from datetime import datetime, date
from typing import Dict, Any, Optional, List
from fastapi import HTTPException
from app.db.mongodb import get_collection
from app.services.map_service import map_service
from app.schemas.attendance import CheckInRequest, CheckOutRequest
from app.utils.time_utils import get_ist_now, get_ist_today_str, get_ist_time_str

class AttendanceService:
    async def get_today_status(self, employee_id: str) -> Dict[str, Any]:
        attendance_col = get_collection("attendance")
        employees_col = get_collection("employees")
        sites_col = get_collection("sites")

        emp = await employees_col.find_one({"employeeId": employee_id})
        emp_name = emp.get("name", "Field Technician") if emp else "Field Technician"
        site_name = emp.get("assignedSiteName", "Pune - Phase 1") if emp else "Pune - Phase 1"

        today_str = get_ist_today_str()
        record = await attendance_col.find_one({
            "employeeId": employee_id,
            "date": today_str
        })
        
        if record:
            is_checked_in = bool(record.get("checkInTime") and not record.get("checkOutTime"))
            return {
                "isCheckedIn": is_checked_in,
                "status": record.get("status", "Present"),
                "employeeId": employee_id,
                "employeeName": emp_name,
                "siteName": record.get("siteName", site_name),
                "date": record.get("date", today_str),
                "checkInTime": record.get("checkInTime"),
                "checkOutTime": record.get("checkOutTime"),
                "checkInLocation": record.get("checkInLocation"),
                "checkOutLocation": record.get("checkOutLocation"),
                "workingHours": record.get("workingHours", "0h 00m")
            }

        return {
            "isCheckedIn": False,
            "status": "Not Checked In",
            "employeeId": employee_id,
            "employeeName": emp_name,
            "siteName": site_name,
            "date": today_str,
            "checkInTime": None,
            "checkOutTime": None,
            "checkInLocation": None,
            "checkOutLocation": None,
            "workingHours": "0h 00m"
        }

    async def check_in(self, req: CheckInRequest) -> Dict[str, Any]:
        attendance_col = get_collection("attendance")
        employees_col = get_collection("employees")
        sites_col = get_collection("sites")
        settings_col = get_collection("settings")
        locations_col = get_collection("locations")

        # Get employee
        emp = await employees_col.find_one({"employeeId": req.employeeId})
        if not emp:
            users_col = get_collection("users")
            user_doc = await users_col.find_one({"employeeId": req.employeeId}) if users_col is not None else None
            emp_name = user_doc.get("name") if user_doc else f"Technician {req.employeeId}"
            emp = {
                "employeeId": req.employeeId,
                "name": emp_name,
                "assignedSiteId": req.siteId or "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "status": "Active"
            }
            await employees_col.insert_one(emp)

        site_id = req.siteId or emp.get("assignedSiteId")
        site = None
        if sites_col is not None:
            if site_id:
                site = await sites_col.find_one({"id": site_id})
            if not site:
                site = await sites_col.find_one({})
        if not site:
            site = {
                "id": "site_pune_1",
                "name": "Pune - Phase 1",
                "code": "ADN-PS-001",
                "address": "Hinjewadi, Pune, Maharashtra",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "attendanceRadius": 500.0,
                "status": "Active"
            }

        # Get system attendance policy
        app_settings_doc = await settings_col.find_one({"id": "app_settings"})
        allowed_radius = site.get("attendanceRadius", 500.0)
        if app_settings_doc and "settings" in app_settings_doc:
            allowed_radius = app_settings_doc["settings"].get("attendanceRadiusMeters", allowed_radius)

        # Determine site details and operational zone
        site_name = site.get("name", "Field Operations") if site else "Field Operations"
        site_id = site.get("id", "site_field_1") if site else "site_field_1"

        # Check proximity dynamically - in real world operations, check-in is based on the technician's actual location
        proximity_meters = 0.0
        if site and "latitude" in site and "longitude" in site:
            proximity = map_service.verify_site_proximity(
                user_lat=req.latitude,
                user_lon=req.longitude,
                site_lat=site["latitude"],
                site_lon=site["longitude"],
                allowed_radius_meters=allowed_radius
            )
            proximity_meters = proximity["distanceMeters"]
            # If within site radius, use site's name; if deployed in the field, record as active field location
            if not proximity["isWithinRadius"]:
                site_name = f"{site_name} (Field Deployment)"

        now = get_ist_now()
        check_in_time_str = get_ist_time_str()
        today_str = get_ist_today_str()

        # Update or create attendance record
        filter_query = {"employeeId": req.employeeId, "date": today_str}
        attendance_record = {
            "employeeId": req.employeeId,
            "employeeName": emp.get("name"),
            "siteId": site.get("id"),
            "siteName": site.get("name"),
            "date": today_str,
            "checkInTime": check_in_time_str,
            "checkOutTime": None,
            "checkInLocation": {
                "latitude": req.latitude,
                "longitude": req.longitude,
                "accuracy": req.accuracy
            },
            "status": "Present",
            "workingHours": "Active",
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }

        await attendance_col.update_one(filter_query, {"$set": attendance_record}, upsert=True)

        # Sync employee assigned site in database so user side updates automatically
        if site and "id" in site and "name" in site:
            await employees_col.update_one(
                {"employeeId": req.employeeId},
                {"$set": {"assignedSiteId": site["id"], "assignedSiteName": site["name"]}}
            )
            users_col = get_collection("users")
            await users_col.update_one(
                {"employeeId": req.employeeId},
                {"$set": {"assignedSiteId": site["id"], "assignedSiteName": site["name"]}}
            )

        # Save to location log
        await locations_col.insert_one({
            "employeeId": req.employeeId,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "accuracy": req.accuracy,
            "timestamp": now.isoformat(),
            "siteId": site.get("id")
        })

        return {
            "success": True,
            "message": "Checked in successfully",
            "record": attendance_record,
            "distanceFromSite": proximity_meters
        }

    async def check_out(self, req: CheckOutRequest) -> Dict[str, Any]:
        attendance_col = get_collection("attendance")
        locations_col = get_collection("locations")
        today_str = get_ist_today_str()

        record = await attendance_col.find_one({"employeeId": req.employeeId, "date": today_str})
        if not record or not record.get("checkInTime") or record.get("checkOutTime"):
            raise HTTPException(status_code=400, detail="No active un-closed check-in record found for today.")

        now = get_ist_now()
        check_out_time_str = get_ist_time_str()

        # Calculate working duration
        working_hours_str = "0h 01m"
        try:
            if record.get("checkInTime"):
                t_in = datetime.strptime(record["checkInTime"], "%I:%M %p")
                t_out = datetime.strptime(check_out_time_str, "%I:%M %p")
                diff = t_out - t_in
                hours = int(diff.total_seconds() // 3600)
                minutes = int((diff.total_seconds() % 3600) // 60)
                if hours > 0 or minutes > 0:
                    working_hours_str = f"{hours}h {minutes:02d}m"
                else:
                    working_hours_str = "0h 01m"
        except Exception:
            working_hours_str = "0h 01m"

        update_data = {
            "checkOutTime": check_out_time_str,
            "checkOutLocation": {
                "latitude": req.latitude,
                "longitude": req.longitude,
                "accuracy": req.accuracy
            },
            "status": "Checked Out",
            "workingHours": working_hours_str,
            "updatedAt": now.isoformat()
        }

        target_date = record.get("date", today_str)
        await attendance_col.update_one(
            {"employeeId": req.employeeId, "date": target_date},
            {"$set": update_data}
        )

        # Log location
        await locations_col.insert_one({
            "employeeId": req.employeeId,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "accuracy": req.accuracy,
            "timestamp": now.isoformat(),
            "siteId": record.get("siteId")
        })

        return {
            "success": True,
            "message": "Checked out successfully",
            "checkOutTime": check_out_time_str,
            "workingHours": working_hours_str
        }

    async def get_history(self, employee_id: str, month: Optional[str] = None, filter_type: str = "monthly") -> List[Dict[str, Any]]:
        attendance_col = get_collection("attendance")
        employees_col = get_collection("employees")
        query: Dict[str, Any] = {}
        if employee_id and employee_id.upper() not in ["ALL", "ADMIN01", "ADMIN"]:
            query["employeeId"] = employee_id

        records = await attendance_col.find(query).to_list(200)
        # Sort by date desc, then by updatedAt desc
        records = sorted(records, key=lambda x: (x.get("date", ""), x.get("updatedAt", x.get("createdAt", ""))), reverse=True)
        
        formatted = []
        for r in records:
            item = dict(r)
            if "_id" in item:
                item["id"] = str(item["_id"])
            if not item.get("employeeName"):
                emp = await employees_col.find_one({"employeeId": item.get("employeeId")})
                if emp:
                    item["employeeName"] = emp.get("name")
            formatted.append(item)
        return formatted

attendance_service = AttendanceService()
