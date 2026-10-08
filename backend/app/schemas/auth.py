from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., description="Mobile Number or Employee ID / Email")
    password: str = Field(..., description="User password")

class ForgotPasswordRequest(BaseModel):
    username: str = Field(..., description="Mobile or Employee ID to reset")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserOut(BaseModel):
    id: str
    username: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str # "admin" or "technician"
    employeeId: Optional[str] = None
    assignedSiteId: Optional[str] = None
    assignedSiteName: Optional[str] = None
    assignedSiteIds: Optional[list] = Field(default_factory=list)
    assignedSiteNames: Optional[list] = Field(default_factory=list)
    status: str = "Active"
