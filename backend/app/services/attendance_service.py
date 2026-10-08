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
        
        # Gather all assigned site IDs & names
        assigned_site_ids = list(emp.get("assignedSiteIds") or []) if emp else []
        if emp and emp.get("assignedSiteId") and emp.get("assignedSiteId") not in assigned_site_ids:
            assigned_site_ids.insert(0, emp.get("assignedSiteId"))

        assigned_site_names = list(emp.get("assignedSiteNames") or []) if emp else []
        if emp and emp.get("assignedSiteName") and emp.get("assignedSiteName") not in assigned_site_names:
            assigned_site_names.insert(0, emp.get("assignedSiteName"))

        assigned_site_id = assigned_site_ids[0] if assigned_site_ids else (emp.get("assignedSiteId") if emp else None)
        assigned_site_name = assigned_site_names[0] if assigned_site_names else (emp.get("assignedSiteName", site_name) if emp else site_name)

        # Look up authoritative assigned sites list
        assigned_sites_list = []
        if sites_col is not None and assigned_site_ids:
            raw_docs = await sites_col.find({"$or": [{"id": {"$in": assigned_site_ids}}, {"_id": {"$in": assigned_site_ids}}]}).to_list(50)
            site_map = {str(s.get("id", s.get("_id"))): s for s in raw_docs}
            for sid in assigned_site_ids:
                if sid in site_map:
                    s_doc = site_map[sid]
                    assigned_sites_list.append({
                        "id": str(s_doc.get("id", s_doc.get("_id"))),
                        "name": s_doc.get("name", sid),
                        "code": s_doc.get("code", "ADN-SITE"),
                        "address": s_doc.get("address", ""),
                        "latitude": s_doc.get("latitude"),
                        "longitude": s_doc.get("longitude"),
                        "attendanceRadius": s_doc.get("attendanceRadius", 500.0),
                        "manager": s_doc.get("manager", ""),
                        "managerPhone": s_doc.get("managerPhone", "+91 98220 12345"),
                        "managerEmail": s_doc.get("managerEmail", "ops@adani.com"),
                        "workingHours": s_doc.get("workingHours", "09:00 AM - 06:00 PM")
                    })

        assigned_site_doc = assigned_sites_list[0] if assigned_sites_list else None
        site_info = assigned_site_doc

        if record:
            is_checked_in = bool(record.get("checkInTime") and not record.get("checkOutTime"))
            check_in_loc = record.get("checkInLocation")

            return {
                "isCheckedIn": is_checked_in,
                "status": record.get("status", "Present"),
                "employeeId": employee_id,
                "employeeName": emp_name,
                "siteId": record.get("siteId") or assigned_site_id,
                "siteName": record.get("siteName") or assigned_site_name,
                "assignedSiteId": assigned_site_id,
                "assignedSiteName": assigned_site_name,
                "assignedSiteIds": assigned_site_ids,
                "assignedSiteNames": assigned_site_names,
                "assignedSite": site_info,
                "assignedSites": assigned_sites_list,
                "siteLatitude": assigned_site_doc.get("latitude") if assigned_site_doc else None,
                "siteLongitude": assigned_site_doc.get("longitude") if assigned_site_doc else None,
                "date": record.get("date", today_str),
                "checkInTime": record.get("checkInTime"),
                "checkOutTime": record.get("checkOutTime"),
                "checkInLocation": check_in_loc,
                "checkOutLocation": record.get("checkOutLocation"),
                "workingHours": record.get("workingHours", "0h 00m"),
                "createdAt": record.get("createdAt")
            }

        default_loc = None
        if assigned_site_doc and "latitude" in assigned_site_doc and "longitude" in assigned_site_doc:
            default_loc = {
                "latitude": round(assigned_site_doc["latitude"] + 0.00018, 6),
                "longitude": round(assigned_site_doc["longitude"] + 0.00015, 6),
                "accuracy": 10.0,
                "address": assigned_site_doc.get("address")
            }

        return {
            "isCheckedIn": False,
            "status": "Not Checked In",
            "employeeId": employee_id,
            "employeeName": emp_name,
            "siteId": assigned_site_id,
            "siteName": assigned_site_name,
            "assignedSiteId": assigned_site_id,
            "assignedSiteName": assigned_site_name,
            "assignedSiteIds": assigned_site_ids,
            "assignedSiteNames": assigned_site_names,
            "assignedSite": site_info,
            "assignedSites": assigned_sites_list,
            "siteLatitude": assigned_site_doc.get("latitude") if assigned_site_doc else None,
            "siteLongitude": assigned_site_doc.get("longitude") if assigned_site_doc else None,
            "date": today_str,
            "checkInTime": None,
            "checkOutTime": None,
            "checkInLocation": default_loc,
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

        site_id = emp.get("assignedSiteId") or req.siteId
        site = None
        if sites_col is not None:
            if site_id:
                site = await sites_col.find_one({"$or": [{"id": site_id}, {"_id": site_id}, {"code": site_id}]})
            if not site and emp.get("assignedSiteName"):
                site = await sites_col.find_one({"name": emp.get("assignedSiteName")})
            if not site and req.siteId:
                site = await sites_col.find_one({"$or": [{"id": req.siteId}, {"_id": req.siteId}]})
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

        # Enforce strict geofence verification (must be within allowed radius, default 500m)
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
            if not proximity["isWithinRadius"]:
                dist_str = proximity.get("distanceFormatted", f"{int(proximity_meters)}m")
                raise HTTPException(
                    status_code=400,
                    detail=f"Check-in rejected: Outside authorized geofence. You are currently {dist_str} away from '{site.get('name')}'. Attendance check-in is strictly permitted only within {int(allowed_radius)}m of your assigned substation."
                )

        now = get_ist_now()
        check_in_time_str = get_ist_time_str()
        today_str = get_ist_today_str()

        # Check if already checked in without checking out
        existing_record = await attendance_col.find_one({"employeeId": req.employeeId, "date": today_str})
        if existing_record and existing_record.get("checkInTime") and not existing_record.get("checkOutTime"):
            raise HTTPException(
                status_code=400,
                detail=f"Shift is currently active (Checked in at {existing_record.get('checkInTime')}). You must check out before checking in again."
            )

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
