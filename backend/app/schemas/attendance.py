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
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    accuracy: Optional[float] = None
    bypassRadiusCheck: Optional[bool] = False
    bypassTimingCheck: Optional[bool] = False
    photo: Optional[str] = None # Base64 encoded verification photo

class CheckOutRequest(BaseModel):
    employeeId: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    accuracy: Optional[float] = None
    siteId: Optional[str] = None
    siteName: Optional[str] = None
    bypassTimingCheck: Optional[bool] = False
    bypassRadiusCheck: Optional[bool] = False

class AttendanceOut(BaseModel):
    id: str
    employeeId: str
    employeeName: Optional[str] = None
    siteId: Optional[str] = None
    siteName: Optional[str] = None
    checkOutSiteId: Optional[str] = None
    checkOutSiteName: Optional[str] = None
    date: str
    checkInTime: Optional[str] = None
    checkOutTime: Optional[str] = None
    checkInLocation: Optional[GeoPoint] = None
    checkOutLocation: Optional[GeoPoint] = None
    status: str # "Present", "Absent", "Late", "Half Day", "Checked Out"
    workingHours: Optional[str] = None
    distanceFromSite: Optional[float] = None
    distanceTraveledMeters: Optional[float] = None
    distanceTraveledFormatted: Optional[str] = None
    photoUrl: Optional[str] = None
    remarks: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class TodayStatusOut(BaseModel):
    isCheckedIn: bool
    status: str # "Present", "Absent", "Late", "Half Day", "Checked Out", "Not Checked In"
    employeeId: str
    employeeName: str
    siteId: Optional[str] = None
    siteName: Optional[str] = None
    checkOutSiteId: Optional[str] = None
    checkOutSiteName: Optional[str] = None
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
    distanceTraveledMeters: Optional[float] = None
    distanceTraveledFormatted: Optional[str] = None
    workingHours: Optional[str] = None
    remarks: Optional[str] = None
    photoUrl: Optional[str] = None
    createdAt: Optional[str] = None
    workingHoursStart: Optional[str] = "09:00 AM"
    workingHoursEnd: Optional[str] = "06:00 PM"
    enforceShiftTimingRules: Optional[bool] = True
    isCheckInAllowedNow: Optional[bool] = True
    checkInRestrictionMsg: Optional[str] = None
    isCheckOutAllowedNow: Optional[bool] = True
    checkOutRestrictionMsg: Optional[str] = None

class ManualAttendanceAdjustmentRequest(BaseModel):
    employeeId: str
    date: str
    status: str # "Late", "Half Day", "Present", "Absent"
    siteName: Optional[str] = None
    checkInTime: Optional[str] = None
    checkOutTime: Optional[str] = None
    workingHours: Optional[str] = None
    remarks: Optional[str] = None

