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
    status: Optional[str] = Query(None)
):
    filters = AttendanceReportFilter(
        fromDate=fromDate,
        toDate=toDate,
        siteId=siteId,
        employeeId=employeeId,
        status=status
    )
    return await report_service.get_attendance_report(filters)

@router.get("/export-excel")
async def export_attendance_excel(
    fromDate: Optional[str] = Query(None),
    toDate: Optional[str] = Query(None),
    siteId: Optional[str] = Query(None),
    employeeId: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    filters = AttendanceReportFilter(
        fromDate=fromDate,
        toDate=toDate,
        siteId=siteId,
        employeeId=employeeId,
        status=status
    )
    excel_bytes = await report_service.generate_excel_bytes(filters)
    filename = f"Adani_Attendance_Report_{fromDate or 'All'}_{toDate or 'All'}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
