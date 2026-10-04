from pydantic import BaseModel, Field
from typing import Optional, List

class SiteBase(BaseModel):
    name: str = Field(..., example="Pune - Phase 1")
    code: str = Field(..., example="ADN-PS-001")
    address: str = Field(..., example="Hinjewadi, Pune, Maharashtra")
    latitude: float = Field(..., example=18.5204)
    longitude: float = Field(..., example=73.8567)
    manager: str = Field(..., example="Suresh Patil")
    workingHours: str = Field("09:00 AM - 06:00 PM")
    attendanceRadius: float = Field(500.0, description="Allowed geofence radius in meters")
    status: str = Field("Active")
    imageUrl: Optional[str] = "/assets/site_photo.jpg"

class SiteCreate(SiteBase):
    pass

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    manager: Optional[str] = None
    workingHours: Optional[str] = None
    attendanceRadius: Optional[float] = None
    status: Optional[str] = None
    imageUrl: Optional[str] = None

class SiteOut(SiteBase):
    id: str
    assignedEmployeesCount: Optional[int] = 0
