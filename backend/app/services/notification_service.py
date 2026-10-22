import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.db.mongodb import get_collection
from app.utils.time_utils import get_ist_now

class NotificationService:
    async def get_notifications(self, limit: int = 50, unread_only: bool = False) -> Dict[str, Any]:
        col = get_collection("notifications")
        if col is None:
            return {"items": [], "unreadCount": 0}

        query = {}
        if unread_only:
            query["isRead"] = False

        docs = await col.find(query).sort("createdAt", -1).to_list(limit)
        items = []
        for d in docs:
            item = dict(d)
            item["id"] = str(item.get("id", item.get("_id")))
            if "_id" in item:
                del item["_id"]
            items.append(item)

        unread_count = await col.count_documents({"isRead": False})

        # Seed initial realistic notifications if collection is empty
        if not items and not unread_only:
            items = await self._seed_default_notifications()
            unread_count = len([i for i in items if not i.get("isRead")])

        return {"items": items, "unreadCount": unread_count}

    async def create_notification(
        self,
        type: str,
        title: str,
        message: str,
        employee_id: Optional[str] = None,
        employee_name: Optional[str] = None,
        site_id: Optional[str] = None,
        site_name: Optional[str] = None,
        severity: str = "info"
    ) -> Dict[str, Any]:
        col = get_collection("notifications")
        now_str = get_ist_now().isoformat()
        notif_id = f"notif_{uuid.uuid4().hex[:10]}"

        doc = {
            "id": notif_id,
            "_id": notif_id,
            "type": type,
            "title": title,
            "message": message,
            "employeeId": employee_id,
            "employeeName": employee_name,
            "siteId": site_id,
            "siteName": site_name,
            "severity": severity,
            "isRead": False,
            "createdAt": now_str
        }

        if col is not None:
            await col.insert_one(doc)

        clean = dict(doc)
        if "_id" in clean:
            del clean["_id"]
        return clean

    async def mark_as_read(self, notification_id: str) -> bool:
        col = get_collection("notifications")
        if col is None:
            return False
        res = await col.update_one(
            {"$or": [{"id": notification_id}, {"_id": notification_id}]},
            {"$set": {"isRead": True}}
        )
        return res.modified_count > 0 or res.matched_count > 0

    async def mark_all_as_read(self) -> int:
        col = get_collection("notifications")
        if col is None:
            return 0
        res = await col.update_many({"isRead": False}, {"$set": {"isRead": True}})
        return res.modified_count

    async def _seed_default_notifications(self) -> List[Dict[str, Any]]:
        col = get_collection("notifications")
        now = get_ist_now()
        samples = [
            {
                "id": "notif_001",
                "_id": "notif_001",
                "type": "LATE_ATTENDANCE",
                "title": "Late Arrival Alert",
                "message": "Vikash Singh (b4S/Adani/04) checked in late at 09:34 AM at Pune - Phase 2 (34m past 09:00 AM cutoff).",
                "employeeId": "b4S/Adani/04",
                "employeeName": "Vikash Singh",
                "siteId": "site_pune_2",
                "siteName": "Pune - Phase 2",
                "severity": "warning",
                "isRead": False,
                "createdAt": now.isoformat()
            },
            {
                "id": "notif_002",
                "_id": "notif_002",
                "type": "CHECK_IN",
                "title": "Shift Check-In Verified",
                "message": "Rohit Sharma (b4S/Adani/01) successfully checked in at Surat ST-1 with verified photo & GPS geofence fix.",
                "employeeId": "b4S/Adani/01",
                "employeeName": "Rohit Sharma",
                "siteId": "site_2949e4fc",
                "siteName": "Surat ST-1",
                "severity": "success",
                "isRead": False,
                "createdAt": now.isoformat()
            },
            {
                "id": "notif_003",
                "_id": "notif_003",
                "type": "GEOFENCE_BREACH",
                "title": "Geofence Proximity Alert",
                "message": "Telemetry update: Sandeep Yadav (b4S/Adani/03) reported location 1.1km away from authorized perimeter of Pune - Phase 2.",
                "employeeId": "b4S/Adani/03",
                "employeeName": "Sandeep Yadav",
                "siteId": "site_pune_2",
                "siteName": "Pune - Phase 2",
                "severity": "danger",
                "isRead": True,
                "createdAt": now.isoformat()
            },
            {
                "id": "notif_004",
                "_id": "notif_004",
                "type": "CHECK_OUT",
                "title": "Shift Completed",
                "message": "Amit Kumar (b4S/Adani/02) checked out at 06:12 PM. Working shift duration: 8h 42m.",
                "employeeId": "b4S/Adani/02",
                "employeeName": "Amit Kumar",
                "siteId": "site_pune_1",
                "siteName": "Pune - Phase 1",
                "severity": "info",
                "isRead": True,
                "createdAt": now.isoformat()
            }
        ]

        if col is not None:
            for s in samples:
                await col.insert_one(dict(s))

        clean_list = []
        for s in samples:
            item = dict(s)
            del item["_id"]
            clean_list.append(item)
        return clean_list

notification_service = NotificationService()
