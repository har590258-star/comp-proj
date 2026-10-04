from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class RecentAttendanceItem(BaseModel):
    id: str
    employeeId: str
    name: str
    designation: Optional[str] = "Field Technician"
    site: str
    status: str
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    workingHours: Optional[str] = None

class ChartDataPoint(BaseModel):
    name: str
    present: Optional[int] = 0
    absent: Optional[int] = 0
    total: Optional[int] = 0
    value: Optional[int] = None
    rate: Optional[float] = None

class DashboardStatsOut(BaseModel):
    totalEmployees: int = 28
    presentToday: int = 22
    absentToday: int = 4
    checkedOutToday: int = 18
    attendanceRate: float = 78.5
    recentAttendance: List[RecentAttendanceItem] = []
    attendanceTrend: List[Dict[str, Any]] = []
    statusDistribution: List[Dict[str, Any]] = []
    siteWiseStats: List[Dict[str, Any]] = []
