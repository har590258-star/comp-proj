import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, status
from app.db.mongodb import get_collection
from app.schemas.site import SiteCreate, SiteUpdate, SiteOut
from app.core.security import oauth2_scheme, decode_access_token

router = APIRouter(prefix="/sites", tags=["Sites"])

@router.get("", response_model=List[SiteOut])
async def list_sites(
    employee_id: Optional[str] = Query(None, description="Optional employee ID to scope to assigned site"),
    token: Optional[str] = Depends(oauth2_scheme)
):
    sites_col = get_collection("sites")
    employees_col = get_collection("employees")
    users_col = get_collection("users")

    target_emp_id = employee_id
    is_admin = False

    # Check caller authentication credentials
    if token:
        payload = decode_access_token(token)
        if payload:
            role = payload.get("role")
            if role == "admin":
                is_admin = True
            else:
                target_emp_id = target_emp_id or payload.get("employee_id") or payload.get("sub")

    query = {}
    # Non-admin users are strictly restricted to seeing ONLY their assigned sites
    if not is_admin and target_emp_id:
        emp = await employees_col.find_one({"employeeId": target_emp_id})
        if not emp:
            emp = await users_col.find_one({"employeeId": target_emp_id})

        if emp and emp.get("role") != "admin":
            assigned_ids = list(emp.get("assignedSiteIds") or [])
            if emp.get("assignedSiteId") and emp.get("assignedSiteId") not in assigned_ids:
                assigned_ids.append(emp.get("assignedSiteId"))
            
            assigned_names = list(emp.get("assignedSiteNames") or [])
            if emp.get("assignedSiteName") and emp.get("assignedSiteName") not in assigned_names:
                assigned_names.append(emp.get("assignedSiteName"))

            conditions = []
            for s_id in assigned_ids:
                if s_id:
                    conditions.extend([{"id": s_id}, {"_id": s_id}, {"code": s_id}])
            for s_name in assigned_names:
                if s_name:
                    conditions.append({"name": s_name})

            if conditions:
                query = {"$or": conditions}
            else:
                return []

    sites = await sites_col.find(query).to_list(100)
    results = []
    for s in sites:
        item = dict(s)
        site_id = item.get("id", str(item.get("_id")))
        item["id"] = site_id
        # Count assigned employees
        cnt = await employees_col.count_documents({
            "$or": [
                {"assignedSiteId": site_id},
                {"assignedSiteIds": site_id}
            ]
        })
        item["assignedEmployeesCount"] = cnt
        results.append(item)
    return results

@router.post("", response_model=SiteOut, status_code=status.HTTP_201_CREATED)
async def create_site(site_in: SiteCreate):
    sites_col = get_collection("sites")
    new_id = f"site_{uuid.uuid4().hex[:8]}"
    doc = site_in.dict()
    doc["id"] = new_id
    doc["_id"] = new_id
    await sites_col.insert_one(doc)
    doc["assignedEmployeesCount"] = 0
    return doc

@router.get("/{id}", response_model=SiteOut)
async def get_site(id: str, token: Optional[str] = Depends(oauth2_scheme)):
    sites_col = get_collection("sites")
    employees_col = get_collection("employees")
    users_col = get_collection("users")

    # If caller is non-admin, verify this is their assigned site
    if token:
        payload = decode_access_token(token)
        if payload and payload.get("role") != "admin":
            emp_id = payload.get("employee_id") or payload.get("sub")
            emp = await employees_col.find_one({"employeeId": emp_id}) or await users_col.find_one({"employeeId": emp_id})
            if emp:
                assigned_id = emp.get("assignedSiteId")
                assigned_name = emp.get("assignedSiteName")
                if id not in [assigned_id, assigned_name]:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access restricted: You are only authorized to view your assigned site."
                    )

    site = await sites_col.find_one({"$or": [{"id": id}, {"_id": id}, {"code": id}]})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    site["id"] = str(site.get("_id", site.get("id")))
    site["assignedEmployeesCount"] = await employees_col.count_documents({"assignedSiteId": site["id"]})
    return site

@router.put("/{id}", response_model=SiteOut)
async def update_site(id: str, updates: SiteUpdate):
    sites_col = get_collection("sites")
    existing = await sites_col.find_one({"$or": [{"id": id}, {"_id": id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="Site not found")

    target_id = existing.get("id", id)
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    await sites_col.update_one({"$or": [{"id": target_id}, {"_id": target_id}]}, {"$set": update_data})

    updated = await sites_col.find_one({"$or": [{"id": target_id}, {"_id": target_id}]})
    updated["id"] = str(updated.get("_id", updated.get("id")))
    return updated

@router.delete("/{id}")
async def delete_site(id: str):
    sites_col = get_collection("sites")
    existing = await sites_col.find_one({"$or": [{"id": id}, {"_id": id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="Site not found")

    target_id = existing.get("id", id)
    await sites_col.delete_one({"$or": [{"id": target_id}, {"_id": target_id}]})
    return {"success": True, "message": f"Site {id} deleted successfully"}
