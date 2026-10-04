from pydantic import BaseModel, Field
from typing import Optional, List

class LocationLogRequest(BaseModel):
    employeeId: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    siteId: Optional[str] = None
    batteryLevel: Optional[float] = None
    speed: Optional[float] = None

class LocationRecordOut(BaseModel):
    id: str
    employeeId: str
    latitude: float
    longitude: float
    timestamp: str
    accuracy: Optional[float] = None
    siteId: Optional[str] = None
    batteryLevel: Optional[float] = None
    speed: Optional[float] = None

class CurrentLocationOut(BaseModel):
    employeeId: str
    employeeName: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    updatedAt: str
    siteId: Optional[str] = None
    siteName: Optional[str] = None
    siteLatitude: Optional[float] = None
    siteLongitude: Optional[float] = None
    distanceToSiteMeters: Optional[float] = None
    distanceFormatted: Optional[str] = None
    isOnline: bool = True
    batteryLevel: Optional[float] = None
    speed: Optional[float] = None
