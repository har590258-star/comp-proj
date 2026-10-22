import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.db.mongodb import get_collection
from app.utils.time_utils import get_ist_now

class NotificationService:
    async def get_notifications(
        self,
        limit: int = 50,
        unread_only: bool = False,
        role: Optional[str] = None,
        employee_id: Optional[str] = None
    ) -> Dict[str, Any]:
        col = get_collection("notifications")
        if col is None:
            return {"items": [], "unreadCount": 0}

        query: Dict[str, Any] = {}
        if unread_only:
            query["isRead"] = False

        norm_role = (role or "").strip().lower()
        norm_emp_id = (employee_id or "").strip()

        # Role & Target-based Notification Segregation:
        # 1. Admin & Supervisor see management-level alerts (employee late checkins, early checkouts, half-day alerts, geofence breaches)
        # 2. Employees ONLY see notifications for changes done TO them by Admin/Supervisor (site shifts, manual attendance/half-day adjustments)
        if norm_role in ["admin", "supervisor"]:
            query["$or"] = [
                {"targetRoles": {"$in": ["admin", "supervisor", "all"]}},
                {"targetRoles": {"$exists": False}},
                {"targetRoles": None},
                {"targetRoles": []},
            ]
        elif norm_emp_id:
            query["$and"] = [
                {
                    "$or": [
                        {"targetEmployeeId": norm_emp_id},
                        {
                            "$and": [
                                {
                                    "$or": [
                                        {"targetEmployeeId": None},
                                        {"targetEmployeeId": ""},
                                        {"targetEmployeeId": {"$exists": False}}
                                    ]
                                },
                                {"targetRoles": {"$in": ["technician", "employee", "all"]}}
                            ]
                        }
                    ]
                },
                # Strictly hide employee-originated action alerts from employee feed
                {
                    "type": {"$nin": ["LATE_ATTENDANCE", "GEOFENCE_BREACH", "CHECK_IN", "CHECK_OUT"]}
                }
            ]
        elif norm_role in ["technician", "employee"]:
            query["$and"] = [
                {
                    "$or": [
                        {"targetEmployeeId": None},
                        {"targetEmployeeId": ""},
                        {"targetEmployeeId": {"$exists": False}}
                    ]
                },
                {"targetRoles": {"$in": ["technician", "employee", "all"]}},
                {"type": {"$nin": ["LATE_ATTENDANCE", "GEOFENCE_BREACH", "CHECK_IN", "CHECK_OUT"]}}
            ]

        docs = await col.find(query).sort("createdAt", -1).to_list(limit)
        items = []
        for d in docs:
            item = dict(d)
            item["id"] = str(item.get("id", item.get("_id")))
            if "_id" in item:
                del item["_id"]
            items.append(item)

        count_query = dict(query)
        count_query["isRead"] = False
        unread_count = await col.count_documents(count_query)

        # Seed initial realistic notifications if collection is empty
        if not items and not unread_only and not norm_emp_id:
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
        severity: str = "info",
        target_roles: Optional[List[str]] = None,
        target_employee_id: Optional[str] = None
    ) -> Dict[str, Any]:
        col = get_collection("notifications")
        now_str = get_ist_now().isoformat()
        notif_id = f"notif_{uuid.uuid4().hex[:10]}"

        # Default targets based on notification nature:
        # Actions performed BY employees (Late, Checkin, Checkout) -> go to Admin & Supervisor
        # Actions performed FOR employees (Site transfer, manual adjustment) -> go to that Employee
        if target_roles is None:
            if type in ["SITE_TRANSFER", "ATTENDANCE_ADJUSTMENT"]:
                target_roles = ["technician", "employee"]
            else:
                target_roles = ["admin", "supervisor"]

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
            "targetRoles": target_roles,
            "targetEmployeeId": target_employee_id,
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
                "targetRoles": ["admin", "supervisor"],
                "targetEmployeeId": None,
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
                "targetRoles": ["admin", "supervisor"],
                "targetEmployeeId": None,
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
                "targetRoles": ["admin", "supervisor"],
                "targetEmployeeId": None,
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
                "targetRoles": ["admin", "supervisor"],
                "targetEmployeeId": None,
                "isRead": True,
                "createdAt": now.isoformat()
            },
            {
                "id": "notif_005",
                "_id": "notif_005",
                "type": "SITE_TRANSFER",
                "title": "Substation Assignment Notice",
                "message": "Your deployment site has been assigned to Surat ST-1 by Area Operations Supervisor.",
                "employeeId": "b4S/Adani/01",
                "employeeName": "Rohit Sharma",
                "siteName": "Surat ST-1",
                "severity": "info",
                "targetRoles": ["technician", "employee"],
                "targetEmployeeId": "b4S/Adani/01",
                "isRead": False,
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
