from pydantic import BaseModel, Field
from typing import Optional, List, Any

class AttendanceReportFilter(BaseModel):
    fromDate: Optional[str] = None
    toDate: Optional[str] = None
    siteId: Optional[str] = None
    employeeId: Optional[str] = None
    status: Optional[str] = None

class LocationReportFilter(BaseModel):
    fromDate: Optional[str] = None
    toDate: Optional[str] = None
    employeeId: Optional[str] = None

class ReportSummary(BaseModel):
    totalRecords: int
    presentCount: int
    absentCount: int
    checkedOutCount: int
    averageWorkingHours: str
    complianceRate: str
