from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends
from app.services.attendance_service import attendance_service
from app.schemas.attendance import CheckInRequest, CheckOutRequest, AttendanceOut, TodayStatusOut

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/today", response_model=TodayStatusOut)
async def get_today_attendance(employeeId: Optional[str] = Query("EMP001")):
    return await attendance_service.get_today_status(employee_id=employeeId)

@router.post("/check-in")
async def check_in(req: CheckInRequest):
    return await attendance_service.check_in(req)

@router.post("/check-out")
async def check_out(req: CheckOutRequest):
    return await attendance_service.check_out(req)

@router.get("/history", response_model=List[AttendanceOut])
async def get_attendance_history(
    employeeId: Optional[str] = Query("EMP001"),
    filter_type: Optional[str] = Query("monthly"),
    month: Optional[str] = Query(None)
):
    return await attendance_service.get_history(employee_id=employeeId, month=month, filter_type=filter_type)
