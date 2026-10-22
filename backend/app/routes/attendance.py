from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends
from app.services.attendance_service import attendance_service
from app.schemas.attendance import (
    CheckInRequest,
    CheckOutRequest,
    AttendanceOut,
    TodayStatusOut,
    ManualAttendanceAdjustmentRequest
)
from app.db.mongodb import get_collection
from bson import ObjectId

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/today", response_model=TodayStatusOut)
async def get_today_attendance(employeeId: Optional[str] = Query("b4S/Adani/01")):
    return await attendance_service.get_today_status(employee_id=employeeId)

@router.get("/today-checked-in")
async def get_today_checked_in_employees():
    """Retrieve all employees who checked in today for supervisor and admin dashboards."""
    return await attendance_service.get_today_checked_in_employees()

@router.post("/auto-checkout")
async def trigger_auto_checkout():
    """Trigger auto check-out for shifts past 6:00 PM IST or from previous dates."""
    count = await attendance_service.auto_checkout_past_shifts()
    return {"success": True, "autoCheckedOutCount": count}

@router.post("/check-in")
async def check_in(req: CheckInRequest):
    return await attendance_service.check_in(req)

@router.post("/check-out")
async def check_out(req: CheckOutRequest):
    return await attendance_service.check_out(req)

@router.get("/history", response_model=List[AttendanceOut])
async def get_attendance_history(
    employeeId: Optional[str] = Query("b4S/Adani/01"),
    filter_type: Optional[str] = Query("monthly"),
    month: Optional[str] = Query(None)
):
    return await attendance_service.get_history(employee_id=employeeId, month=month, filter_type=filter_type)

@router.post("/manual-adjust")
async def manual_adjust_attendance(req: ManualAttendanceAdjustmentRequest):
    """Allows Admin/Supervisor to manually set or adjust an employee's shift status (e.g. Late, Half Day, Present, Absent)."""
    return await attendance_service.manual_adjustment(req)

@router.put("/{attendance_id}/status")
async def update_attendance_status(attendance_id: str, payload: Dict[str, Any]):
    """Update existing attendance record status (e.g. Late, Half Day)."""
    attendance_col = get_collection("attendance")
    query = {"$or": [{"attendanceId": attendance_id}, {"id": attendance_id}]}
    if ObjectId.is_valid(attendance_id):
        query["$or"].append({"_id": ObjectId(attendance_id)})

    existing = await attendance_col.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    new_status = payload.get("status", "Present")
    remarks = payload.get("remarks") or f"Status updated to {new_status} by Admin"

    update_dict = {
        "status": new_status,
        "remarks": remarks,
        "isManualAdjustment": True
    }
    if "checkInTime" in payload and payload["checkInTime"]:
        update_dict["checkInTime"] = payload["checkInTime"]
    if "checkOutTime" in payload and payload["checkOutTime"]:
        update_dict["checkOutTime"] = payload["checkOutTime"]
    if "workingHours" in payload and payload["workingHours"]:
        update_dict["workingHours"] = payload["workingHours"]

    await attendance_col.update_one({"_id": existing["_id"]}, {"$set": update_dict})
    return {"success": True, "message": f"Shift status updated to {new_status}", "status": new_status}

