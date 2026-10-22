from pydantic import BaseModel, Field
from typing import Optional, List

class NotificationItem(BaseModel):
    id: str
    type: str  # "LATE_ATTENDANCE", "GEOFENCE_BREACH", "CHECK_IN", "CHECK_OUT", "HALF_DAY", "SYSTEM"
    title: str
    message: str
    employeeId: Optional[str] = None
    employeeName: Optional[str] = None
    siteId: Optional[str] = None
    siteName: Optional[str] = None
    severity: str = "info"  # "info", "warning", "danger", "success"
    isRead: bool = False
    createdAt: str

class NotificationListOut(BaseModel):
    items: List[NotificationItem]
    unreadCount: int

class CreateNotificationRequest(BaseModel):
    type: str
    title: str
    message: str
    employeeId: Optional[str] = None
    employeeName: Optional[str] = None
    siteId: Optional[str] = None
    siteName: Optional[str] = None
    severity: str = "info"
