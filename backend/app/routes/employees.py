import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db.mongodb import get_collection
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.core.security import hash_password

router = APIRouter(prefix="/employees", tags=["Employees"])

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
        query["assignedSiteId"] = siteId
    if status and status != "all":
        query["status"] = status

    docs = await col.find(query).to_list(100)
    results = []
    for d in docs:
        item = dict(d)
        item["id"] = str(item.get("_id", item.get("id")))
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
        "assignedSiteId": emp.assignedSiteId,
        "assignedSiteName": emp.assignedSiteName,
        "status": emp.status
    }
    await users_col.insert_one(user_doc)
    return doc

@router.get("/{id}", response_model=EmployeeOut)
async def get_employee(id: str):
    col = get_collection("employees")
    doc = await col.find_one({"$or": [{"id": id}, {"_id": id}, {"employeeId": id}]})
    if not doc:
        raise HTTPException(status_code=404, detail="Employee not found")
    doc["id"] = str(doc.get("_id", doc.get("id")))
    return doc

@router.put("/{id}", response_model=EmployeeOut)
async def update_employee(id: str, updates: EmployeeUpdate):
    emp_col = get_collection("employees")
    users_col = get_collection("users")

    existing = await emp_col.find_one({"$or": [{"id": id}, {"_id": id}, {"employeeId": id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if "password" in update_dict:
        del update_dict["password"]

    target_id = existing.get("id", id)
    await emp_col.update_one({"$or": [{"id": target_id}, {"_id": target_id}]}, {"$set": update_dict})

    # Sync with users
    user_updates = {k: v for k, v in update_dict.items() if k in ["name", "email", "phone", "role", "assignedSiteId", "assignedSiteName", "status"]}
    if updates.password:
        user_updates["password"] = hash_password(updates.password)
    await users_col.update_one({"employeeId": existing.get("employeeId")}, {"$set": user_updates})

    updated = await emp_col.find_one({"$or": [{"id": target_id}, {"_id": target_id}]})
    updated["id"] = str(updated.get("_id", updated.get("id")))
    return updated

@router.delete("/{id}")
async def delete_employee(id: str):
    emp_col = get_collection("employees")
    users_col = get_collection("users")

    existing = await emp_col.find_one({"$or": [{"id": id}, {"_id": id}, {"employeeId": id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")

    target_id = existing.get("id", id)
    emp_id = existing.get("employeeId")
    await emp_col.delete_one({"$or": [{"id": target_id}, {"_id": target_id}]})
    await users_col.delete_one({"employeeId": emp_id})

    return {"success": True, "message": f"Employee {emp_id} deleted successfully"}
