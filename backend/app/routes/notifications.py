from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.notification_service import notification_service
from app.schemas.notification import NotificationListOut, CreateNotificationRequest

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])

@router.get("", response_model=NotificationListOut)
async def get_notifications(
    limit: int = Query(50, ge=1, le=200),
    unreadOnly: bool = Query(False)
):
    return await notification_service.get_notifications(limit=limit, unread_only=unreadOnly)

@router.post("/read/{notification_id}")
async def mark_notification_read(notification_id: str):
    success = await notification_service.mark_as_read(notification_id)
    return {"success": success, "id": notification_id}

@router.post("/read-all")
async def mark_all_notifications_read():
    count = await notification_service.mark_all_as_read()
    return {"success": True, "markedCount": count}

@router.post("/create")
async def create_custom_notification(req: CreateNotificationRequest):
    created = await notification_service.create_notification(
        type=req.type,
        title=req.title,
        message=req.message,
        employee_id=req.employeeId,
        employee_name=req.employeeName,
        site_id=req.siteId,
        site_name=req.siteName,
        severity=req.severity
    )
    return {"success": True, "notification": created}
