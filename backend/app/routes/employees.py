import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db.mongodb import get_collection
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.core.security import hash_password

router = APIRouter(prefix="/employees", tags=["Employees"])

async def populate_assigned_sites_info(item: dict) -> dict:
    if "_id" in item:
        item["_id"] = str(item["_id"])
    sites_col = get_collection("sites")
    site_ids = item.get("assignedSiteIds") or []
    if not site_ids and item.get("assignedSiteId"):
        site_ids = [item["assignedSiteId"]]
    
    # Remove duplicates preserving order
    seen = set()
    clean_site_ids = [s for s in site_ids if s and not (s in seen or seen.add(s))]

    site_docs = []
    site_names = []
    if clean_site_ids and sites_col is not None:
        raw_sites = await sites_col.find({"$or": [{"id": {"$in": clean_site_ids}}, {"_id": {"$in": clean_site_ids}}]}).to_list(50)
        # Sort in the order of clean_site_ids
        site_map = {str(s.get("id", s.get("_id"))): s for s in raw_sites}
        for s_id in clean_site_ids:
            if s_id in site_map:
                s_data = dict(site_map[s_id])
                s_data["id"] = str(s_data.get("id", s_data.get("_id")))
                if "_id" in s_data:
                    s_data["_id"] = str(s_data["_id"])
                site_docs.append(s_data)
                site_names.append(s_data.get("name", s_id))

    item["assignedSiteIds"] = clean_site_ids
    item["assignedSiteNames"] = site_names if site_names else (item.get("assignedSiteNames") or [])
    item["assignedSites"] = site_docs
    if clean_site_ids:
        item["assignedSiteId"] = clean_site_ids[0]
        if site_names:
            item["assignedSiteName"] = site_names[0]
    return item

@router.get("", response_model=List[EmployeeOut])
async def list_employees(
    search: Optional[str] = Query(None, description="Search by name, employeeId or phone"),
    siteId: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    col = get_collection("employees")
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"} if hasattr(col, "client") and col.client else search},
            {"employeeId": search},
            {"phone": search}
        ]
    if siteId and siteId != "all":
        query["$or"] = [
            {"assignedSiteId": siteId},
            {"assignedSiteIds": siteId}
        ]
    if status and status != "all":
        query["status"] = status

    docs = await col.find(query).to_list(100)
    results = []
    for d in docs:
        item = dict(d)
        item["id"] = str(item.get("_id", item.get("id")))
        item = await populate_assigned_sites_info(item)
        results.append(item)
    return results

@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_employee(emp: EmployeeCreate):
    emp_col = get_collection("employees")
    users_col = get_collection("users")

    existing = await emp_col.find_one({"employeeId": emp.employeeId})
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    new_id = f"emp_{uuid.uuid4().hex[:8]}"
    doc = emp.dict()
    doc["id"] = new_id
    doc["_id"] = new_id

    # Handle multiple site ids & names
    doc = await populate_assigned_sites_info(doc)

    await emp_col.insert_one(doc)

    # Also create user account for login
    user_doc = {
        "id": f"usr_{emp.employeeId.lower()}",
        "username": emp.employeeId,
        "password": hash_password(emp.password or "adani123"),
        "name": emp.name,
        "email": emp.email,
        "phone": emp.phone,
        "role": emp.role,
        "employeeId": emp.employeeId,
        "assignedSiteId": doc.get("assignedSiteId"),
        "assignedSiteName": doc.get("assignedSiteName"),
        "assignedSiteIds": doc.get("assignedSiteIds", []),
        "assignedSiteNames": doc.get("assignedSiteNames", []),
        "status": emp.status
    }
    await users_col.insert_one(user_doc)
    return doc

from bson import ObjectId

def build_emp_query(identifier: str):
    conds = [{"id": identifier}, {"employeeId": identifier}]
    if ObjectId.is_valid(identifier):
        conds.append({"_id": ObjectId(identifier)})
    conds.append({"_id": identifier})
    return {"$or": conds}

@router.get("/{id}", response_model=EmployeeOut)
async def get_employee(id: str):
    col = get_collection("employees")
    doc = await col.find_one(build_emp_query(id))
    if not doc:
        raise HTTPException(status_code=404, detail="Employee not found")
    item = dict(doc)
    item["id"] = str(item.get("_id", item.get("id")))
    item = await populate_assigned_sites_info(item)
    return item

@router.put("/{id}", response_model=EmployeeOut)
async def update_employee(id: str, updates: EmployeeUpdate):
    emp_col = get_collection("employees")
    users_col = get_collection("users")

    existing = await emp_col.find_one(build_emp_query(id))
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if "password" in update_dict:
        del update_dict["password"]

    # If assignedSiteIds updated, sync names and primary site
    if "assignedSiteIds" in update_dict:
        site_ids = update_dict.get("assignedSiteIds") or []
        temp_dict = {"assignedSiteIds": site_ids}
        temp_dict = await populate_assigned_sites_info(temp_dict)
        update_dict["assignedSiteIds"] = temp_dict["assignedSiteIds"]
        update_dict["assignedSiteNames"] = temp_dict["assignedSiteNames"]
        if temp_dict["assignedSiteIds"]:
            update_dict["assignedSiteId"] = temp_dict["assignedSiteId"]
            update_dict["assignedSiteName"] = temp_dict["assignedSiteName"]
        else:
            update_dict["assignedSiteId"] = None
            update_dict["assignedSiteName"] = None

    target_id = existing.get("id", id)
    match_query = build_emp_query(str(target_id))
    await emp_col.update_one(match_query, {"$set": update_dict})

    # Sync with users collection
    user_sync_keys = [
        "name", "email", "phone", "role", "status",
        "assignedSiteId", "assignedSiteName", "assignedSiteIds", "assignedSiteNames"
    ]
    user_updates = {k: v for k, v in update_dict.items() if k in user_sync_keys}
    if updates.password:
        user_updates["password"] = hash_password(updates.password)
    if user_updates:
        await users_col.update_one({"employeeId": existing.get("employeeId")}, {"$set": user_updates})

    updated = await emp_col.find_one(match_query)
    updated_dict = dict(updated)
    updated_dict["id"] = str(updated_dict.get("_id", updated_dict.get("id")))
    updated_dict = await populate_assigned_sites_info(updated_dict)
    return updated_dict

@router.delete("/{id}")
async def delete_employee(id: str):
    emp_col = get_collection("employees")
    users_col = get_collection("users")

    existing = await emp_col.find_one(build_emp_query(id))
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_id = existing.get("employeeId")
    target_id = existing.get("id", id)
    match_query = build_emp_query(str(target_id))
    await emp_col.delete_one(match_query)
    await users_col.delete_one({"employeeId": emp_id})

    return {"success": True, "message": f"Employee {emp_id} deleted successfully"}
