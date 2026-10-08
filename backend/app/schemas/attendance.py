from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class GeoPoint(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    accuracy: Optional[float] = None

class CheckInRequest(BaseModel):
    employeeId: str
    siteId: Optional[str] = None
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    bypassRadiusCheck: Optional[bool] = False

class CheckOutRequest(BaseModel):
    employeeId: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None

class AttendanceOut(BaseModel):
    id: str
    employeeId: str
    employeeName: Optional[str] = None
    siteId: Optional[str] = None
    siteName: Optional[str] = None
    date: str
    checkInTime: Optional[str] = None
    checkOutTime: Optional[str] = None
    checkInLocation: Optional[GeoPoint] = None
    checkOutLocation: Optional[GeoPoint] = None
    status: str # "Present", "Absent", "Checked Out"
    workingHours: Optional[str] = None
    distanceFromSite: Optional[float] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class TodayStatusOut(BaseModel):
    isCheckedIn: bool
    status: str # "Present", "Absent", "Checked Out", "Not Checked In"
    employeeId: str
    employeeName: str
    siteId: Optional[str] = None
    siteName: Optional[str] = None
    assignedSiteId: Optional[str] = None
    assignedSiteName: Optional[str] = None
    assignedSiteIds: Optional[List[str]] = Field(default_factory=list)
    assignedSiteNames: Optional[List[str]] = Field(default_factory=list)
    assignedSite: Optional[Dict[str, Any]] = None
    assignedSites: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    siteLatitude: Optional[float] = None
    siteLongitude: Optional[float] = None
    date: str
    checkInTime: Optional[str] = None
    checkOutTime: Optional[str] = None
    checkInLocation: Optional[GeoPoint] = None
    checkOutLocation: Optional[GeoPoint] = None
    workingHours: Optional[str] = None
    createdAt: Optional[str] = None
