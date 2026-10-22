from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class EmployeeBase(BaseModel):
    employeeId: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: str = "Field Technician"
    circle: Optional[str] = "Prc"
    division: Optional[str] = "Office"
    role: str = "technician"  # "technician", "supervisor", "admin"
    assignedSiteId: Optional[str] = None
    assignedSiteName: Optional[str] = None
    assignedSiteIds: Optional[List[str]] = Field(default_factory=list)
    assignedSiteNames: Optional[List[str]] = Field(default_factory=list)
    status: str = "Present"  # "Present" or "Absent"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    locationAddress: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    password: Optional[str] = "adani123"

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    circle: Optional[str] = None
    division: Optional[str] = None
    role: Optional[str] = None
    assignedSiteId: Optional[str] = None
    assignedSiteName: Optional[str] = None
    assignedSiteIds: Optional[List[str]] = None
    assignedSiteNames: Optional[List[str]] = None
    status: Optional[str] = None
    password: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    locationAddress: Optional[str] = None

class EmployeeOut(EmployeeBase):
    id: str
    assignedSites: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

