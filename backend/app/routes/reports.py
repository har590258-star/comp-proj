from typing import Optional
from fastapi import APIRouter, Query, Response
from app.services.report_service import report_service
from app.schemas.reports import AttendanceReportFilter

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/attendance")
async def get_attendance_report(
    fromDate: Optional[str] = Query(None),
    toDate: Optional[str] = Query(None),
    siteId: Optional[str] = Query(None),
    employeeId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None)
):
    filters = AttendanceReportFilter(
        fromDate=fromDate,
        toDate=toDate,
        siteId=siteId,
        employeeId=employeeId,
        status=status,
        month=month,
        year=year
    )
    return await report_service.get_attendance_report(filters)

@router.get("/export-excel")
async def export_attendance_excel(
    fromDate: Optional[str] = Query(None),
    toDate: Optional[str] = Query(None),
    siteId: Optional[str] = Query(None),
    employeeId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None)
):
    filters = AttendanceReportFilter(
        fromDate=fromDate,
        toDate=toDate,
        siteId=siteId,
        employeeId=employeeId,
        status=status,
        month=month,
        year=year
    )
    excel_bytes = await report_service.generate_excel_bytes(filters)
    # Human-friendly filename with target month/year
    m_val = month or (int(toDate.split("-")[1]) if toDate else None) or (int(fromDate.split("-")[1]) if fromDate else 10)
    y_val = year or (int(toDate.split("-")[0]) if toDate else None) or (int(fromDate.split("-")[0]) if fromDate else 2026)
    filename = f"b4S_Attendance_Muster_Roll_{y_val}_{m_val:02d}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
