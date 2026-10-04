from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class EmployeeBase(BaseModel):
    employeeId: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: str = "Field Technician"
    role: str = "technician"  # "technician" or "admin"
    assignedSiteId: Optional[str] = None
    assignedSiteName: Optional[str] = None
    status: str = "Active"  # "Active" or "Inactive"

class EmployeeCreate(EmployeeBase):
    password: Optional[str] = "adani123"

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    role: Optional[str] = None
    assignedSiteId: Optional[str] = None
    assignedSiteName: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class EmployeeOut(EmployeeBase):
    id: str
