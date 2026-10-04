from pydantic import BaseModel, Field
from typing import Optional

class AttendanceSettingsSchema(BaseModel):
    attendanceRadiusMeters: float = Field(500.0, description="Allowed radius in meters from site")
    workingHoursStart: str = Field("09:00 AM")
    workingHoursEnd: str = Field("06:00 PM")
    lateThresholdMinutes: int = Field(15, description="Minutes after which check-in is marked late")
    requireGps: bool = Field(True, description="Strict GPS validation required")
    allowMultipleCheckIns: bool = Field(False)
    autoCheckOutEnabled: bool = Field(False)
    autoCheckOutTime: str = Field("19:00")
    companyName: str = Field("Adani Energy Solutions")
    projectName: str = Field("Adani Smart Meter Project")

class SystemSettingsOut(BaseModel):
    settings: AttendanceSettingsSchema
    updatedAt: str
    updatedBy: Optional[str] = "Admin"
