import logging
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, List, Tuple
from fastapi import HTTPException
from app.db.mongodb import get_collection
from app.services.map_service import map_service
from app.services.cloud_storage import cloud_storage_service
from app.schemas.attendance import CheckInRequest, CheckOutRequest, ManualAttendanceAdjustmentRequest
from app.utils.time_utils import get_ist_now, get_ist_today_str, get_ist_time_str

logger = logging.getLogger("uvicorn")

def parse_time_str(time_str: str) -> Optional[Tuple[int, int]]:
    """Parses time strings like '09:00 AM', '9:00 AM', '18:00', '6:00 PM' into (hour, minute) 24h format."""
    if not time_str:
        return None
    try:
        clean = time_str.strip().upper()
        if "AM" in clean or "PM" in clean:
            t = datetime.strptime(clean, "%I:%M %p")
            return t.hour, t.minute
        parts = clean.split(":")
        return int(parts[0]), int(parts[1])
    except Exception:
        return None

class AttendanceService:
    async def auto_checkout_past_shifts(self) -> int:
        """
        After 6:00 PM IST (18:00), automatically check out all active checked-in shifts.
        Also check out any stale active shifts from previous days.
        """
        attendance_col = get_collection("attendance")
        if attendance_col is None:
            return 0

        now = get_ist_now()
        today_str = get_ist_today_str()
        is_after_6pm = (now.hour >= 18)

        query = {
            "checkInTime": {"$ne": None},
            "checkOutTime": None
        }

        active_shifts = await attendance_col.find(query).to_list(500)
        auto_checked_count = 0

        for record in active_shifts:
            rec_date = record.get("date", today_str)
            should_close = (rec_date < today_str) or (rec_date == today_str and is_after_6pm)
            if not should_close:
                continue

            # Calculate working hours from checkInTime to 06:00 PM
            working_hours_str = "8h 00m"
            is_half_day = False
            try:
                if record.get("checkInTime"):
                    t_in = datetime.strptime(record["checkInTime"], "%I:%M %p")
                    t_out = datetime.strptime("06:00 PM", "%I:%M %p")
                    diff = t_out - t_in
                    if diff.total_seconds() < 0:
                        diff += timedelta(days=1)
                    hours = int(diff.total_seconds() // 3600)
                    minutes = int((diff.total_seconds() % 3600) // 60)
                    working_hours_str = f"{hours}h {minutes:02d}m"
                    total_hrs = hours + (minutes / 60.0)
                    if total_hrs < 5.0:
                        is_half_day = True
            except Exception:
                working_hours_str = "8h 00m"

            if is_half_day or record.get("status") == "Half Day" or record.get("isHalfDay"):
                final_status = "Half Day"
            elif record.get("status") == "Late" or record.get("isLate"):
                final_status = "Late"
            else:
                final_status = "Checked Out"

            # Delete verification photo
            cloud_storage_service.delete_photo(
                storage_type=record.get("storageType"),
                gcs_blob_name=record.get("gcsBlobName"),
                local_path=record.get("photoPath"),
                employee_id=record.get("employeeId", "unknown"),
                date_str=rec_date
            )

            rec_id = record.get("id") or str(record.get("_id"))
            update_data = {
                "checkOutTime": "06:00 PM",
                "checkOutSiteName": record.get("siteName"),
                "checkOutSiteId": record.get("siteId"),
                "status": final_status,
                "workingHours": working_hours_str,
                "isAutoCheckedOut": True,
                "remarks": "Auto-checked out at 06:00 PM (Shift End)",
                "photoUrl": None,
                "storageType": None,
                "photoDeleted": True,
                "photoDeletedAt": now.isoformat(),
                "updatedAt": now.isoformat()
            }
            if "_id" in record:
                await attendance_col.update_one({"_id": record["_id"]}, {"$set": update_data, "$unset": {"photoPath": "", "gcsBlobName": ""}})
            else:
                await attendance_col.update_one({"id": rec_id}, {"$set": update_data, "$unset": {"photoPath": "", "gcsBlobName": ""}})

            auto_checked_count += 1
            logger.info(f"Auto-checked out employee {record.get('employeeId')} for shift on {rec_date}")

        return auto_checked_count

    async def get_today_checked_in_employees(self) -> List[Dict[str, Any]]:
        await self.auto_checkout_past_shifts()
        attendance_col = get_collection("attendance")
        employees_col = get_collection("employees")
        today_str = get_ist_today_str()

        records = await attendance_col.find({"date": today_str, "checkInTime": {"$ne": None}}).to_list(300)
        records = sorted(records, key=lambda x: x.get("checkInTime", ""), reverse=True)

        result = []
        for r in records:
            item = dict(r)
            if "_id" in item:
                item["id"] = str(item["_id"])
            if not item.get("employeeName"):
                emp = await employees_col.find_one({"employeeId": item.get("employeeId")})
                if emp:
                    item["employeeName"] = emp.get("name")
            item["isCheckedIn"] = bool(item.get("checkInTime") and not item.get("checkOutTime"))
            result.append(item)
        return result

    async def get_today_status(self, employee_id: str) -> Dict[str, Any]:
        await self.auto_checkout_past_shifts()
        attendance_col = get_collection("attendance")
        employees_col = get_collection("employees")
        sites_col = get_collection("sites")

        emp = await employees_col.find_one({"employeeId": employee_id})
        if not emp:
            users_col = get_collection("users")
            emp = await users_col.find_one({"employeeId": employee_id}) if users_col is not None else None
        emp_name = emp.get("name", "Field Technician") if emp else "Field Technician"
        site_name = emp.get("assignedSiteName", "Surat ST-1") if emp else "Surat ST-1"

        today_str = get_ist_today_str()

        # Prioritize active unclosed shift (supports overnight shifts spanning across midnight)
        active_record = await attendance_col.find_one({
            "employeeId": employee_id,
            "checkInTime": {"$ne": None},
            "checkOutTime": None
        }, sort=[("createdAt", -1)])

        record = None
        if active_record:
            record = active_record
        else:
            record = await attendance_col.find_one({
                "employeeId": employee_id,
                "date": today_str
            }, sort=[("updatedAt", -1), ("createdAt", -1)])

            if not record:
                record = await attendance_col.find_one({
                    "employeeId": employee_id
                }, sort=[("date", -1), ("updatedAt", -1), ("createdAt", -1)])
        
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

        # Shift Timing Evaluation:
        # Shift hours: 09:00 AM - 06:00 PM
        # Check-in is strictly closed after 06:00 PM
        now = get_ist_now()
        is_after_6pm = (now.hour >= 18)
        is_check_in_allowed = not is_after_6pm

        if is_after_6pm:
            check_in_restriction_msg = (
                "Shift duty concluded for today (06:00 PM cutoff). Check-in is strictly closed after 06:00 PM."
            )
        elif (now.hour > 10) or (now.hour == 10 and now.minute > 30):
            check_in_restriction_msg = (
                "Shift started earlier. Checking in after 10:30 AM will be recorded as Half Day."
            )
        elif (now.hour > 9) or (now.hour == 9 and now.minute > 0):
            check_in_restriction_msg = (
                "Shift starts at 09:00 AM. Checking in now will be recorded as Late Checked-In."
            )
        else:
            check_in_restriction_msg = None

        is_before_6pm = (now.hour < 18)
        is_check_out_allowed = True
        check_out_restriction_msg = (
            "Early departure notice: Checking out before 06:00 PM will mark shift as Half Day."
            if is_before_6pm else None
        )

        timing_meta = {
            "workingHoursStart": "09:00 AM",
            "workingHoursEnd": "06:00 PM",
            "enforceShiftTimingRules": True,
            "isCheckInAllowedNow": is_check_in_allowed,
            "checkInRestrictionMsg": check_in_restriction_msg,
            "isCheckOutAllowedNow": is_check_out_allowed,
            "checkOutRestrictionMsg": check_out_restriction_msg,
        }

        if record:
            is_checked_in = bool(record.get("checkInTime") and not record.get("checkOutTime"))
            check_in_loc = record.get("checkInLocation")

            res = {
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
                "checkOutSiteId": record.get("checkOutSiteId"),
                "checkOutSiteName": record.get("checkOutSiteName"),
                "distanceTraveledMeters": record.get("distanceTraveledMeters"),
                "distanceTraveledFormatted": record.get("distanceTraveledFormatted"),
                "workingHours": record.get("workingHours", "0h 00m"),
                "remarks": record.get("remarks"),
                "photoUrl": record.get("photoUrl"),
                "createdAt": record.get("createdAt")
            }
            res.update(timing_meta)
            return res

        res = {
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
            "checkInLocation": None,
            "checkOutLocation": None,
            "workingHours": "0h 00m",
            "photoUrl": None
        }
        res.update(timing_meta)
        return res

    async def check_in(self, req: CheckInRequest) -> Dict[str, Any]:
        await self.auto_checkout_past_shifts()
        now_time = get_ist_now()
        check_in_total_mins = now_time.hour * 60 + now_time.minute

        # Strict shift timing rule: Shift check-in is strictly closed after 06:00 PM (18:00 IST)
        if now_time.hour >= 18 and not getattr(req, "bypassTimingCheck", False):
            raise HTTPException(
                status_code=400,
                detail="Check-in rejected: Shift check-in is not permitted after 06:00 PM. Shifts conclude at 06:00 PM."
            )

        # Shift timing evaluation:
        # 1. Any employee checks in between 9:00 AM - 10:30 AM: mark as Late (Late checked-in)
        # 2. Checking in after 10:30 AM: mark as Half-day
        # 3. Before 09:00 AM: Present (On-time)
        if check_in_total_mins > 630:  # After 10:30 AM
            initial_status = "Half Day"
            is_late = True
            is_half_day = True
        elif check_in_total_mins >= 540:  # 09:00 AM to 10:30 AM
            initial_status = "Late"
            is_late = True
            is_half_day = False
        else:  # Before 09:00 AM
            initial_status = "Present"
            is_late = False
            is_half_day = False

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

        # Determine employee role and supervisor privilege (supervisor does not require GPS/geofence or mandatory photo)
        emp_role = emp.get("role", "technician")
        is_supervisor = (emp_role == "supervisor") or getattr(req, "bypassRadiusCheck", False)

        # Prioritize the specific site requested by the technician
        target_site_id = req.siteId or emp.get("assignedSiteId")
        site = None
        if sites_col is not None and target_site_id:
            site = await sites_col.find_one({"$or": [{"id": target_site_id}, {"_id": target_site_id}, {"code": target_site_id}]})
        if not site and emp.get("assignedSiteName"):
            site = await sites_col.find_one({"name": emp.get("assignedSiteName")})
        if not site and req.siteId:
            site = await sites_col.find_one({"$or": [{"id": req.siteId}, {"_id": req.siteId}]})
        if not site and sites_col is not None:
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

        # Geofence verification (bypassed for supervisors)
        proximity_meters = 0.0
        if not is_supervisor:
            if site and "latitude" in site and "longitude" in site and req.latitude and req.longitude:
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

        # Verification photo (Mandatory for field technicians, optional for supervisors)
        photo_url = None
        storage_res = {}
        if req.photo and req.photo.strip():
            storage_res = cloud_storage_service.save_photo(req.employeeId, req.photo)
            photo_url = storage_res.get("photoUrl")
            if not photo_url and not is_supervisor:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to process verification photo. Please upload a valid image file."
                )
        elif not is_supervisor:
            raise HTTPException(
                status_code=400,
                detail="Verification photo is required to check in. Please capture or upload your photo first."
            )
        else:
            photo_url = "/assets/site_photo.jpg"

        final_lat = req.latitude if (req.latitude and req.latitude != 0.0) else (site.get("latitude") or 18.5204)
        final_lng = req.longitude if (req.longitude and req.longitude != 0.0) else (site.get("longitude") or 73.8567)

        now = get_ist_now()
        check_in_time_str = get_ist_time_str()
        today_str = get_ist_today_str()

        # Check if already checked in without checking out (handles both same-day and overnight shifts)
        existing_record = await attendance_col.find_one({
            "employeeId": req.employeeId,
            "checkInTime": {"$ne": None},
            "checkOutTime": None
        }, sort=[("createdAt", -1)])

        if existing_record:
            raise HTTPException(
                status_code=400,
                detail=f"Shift is currently active (Checked in at {existing_record.get('checkInTime')} on {existing_record.get('date', 'today')}). You must check out before checking in again."
            )

        new_att_id = f"att_{uuid.uuid4().hex[:10]}"
        attendance_record = {
            "id": new_att_id,
            "_id": new_att_id,
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
            "status": initial_status,
            "isLate": is_late,
            "workingHours": "Active",
            "photoUrl": photo_url,
            "storageType": storage_res.get("storageType"),
            "gcsBlobName": storage_res.get("gcsBlobName"),
            "photoPath": storage_res.get("localPath"),
            "photoUploadedAt": now.isoformat(),
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }

        await attendance_col.insert_one(attendance_record)

        # Dispatch alert notification to Admin & Supervisor
        try:
            from app.services.notification_service import notification_service
            if is_late:
                await notification_service.create_notification(
                    type="LATE_ATTENDANCE",
                    title="Late Arrival Alert",
                    message=f"{emp.get('name')} ({req.employeeId}) checked in late at {check_in_time_str} at {site.get('name')} (Grace cutoff was 09:15 AM).",
                    employee_id=req.employeeId,
                    employee_name=emp.get("name"),
                    site_id=site.get("id"),
                    site_name=site.get("name"),
                    severity="warning"
                )
            else:
                await notification_service.create_notification(
                    type="CHECK_IN",
                    title="Shift Check-In Verified",
                    message=f"{emp.get('name')} ({req.employeeId}) checked in at {check_in_time_str} at {site.get('name')} with verified GPS fix.",
                    employee_id=req.employeeId,
                    employee_name=emp.get("name"),
                    site_id=site.get("id"),
                    site_name=site.get("name"),
                    severity="success"
                )
        except Exception as e:
            logger.warning(f"Notification error: {e}")

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
            "message": "Checked in successfully with photo verification",
            "record": attendance_record,
            "distanceFromSite": proximity_meters
        }

    async def check_out(self, req: CheckOutRequest) -> Dict[str, Any]:
        # Strict shift timing rule: Early check-out strictly prohibited before 06:00 PM (18:00)
        now = get_ist_now()
        is_early = (now.hour < 18)


        attendance_col = get_collection("attendance")
        locations_col = get_collection("locations")
        today_str = get_ist_today_str()

        # Find active shift: first check today's unclosed record, then any recent unclosed record (e.g. overnight night shift)
        record = await attendance_col.find_one({
            "employeeId": req.employeeId,
            "date": today_str,
            "checkInTime": {"$ne": None},
            "checkOutTime": None
        })
        if not record:
            record = await attendance_col.find_one({
                "employeeId": req.employeeId,
                "checkInTime": {"$ne": None},
                "checkOutTime": None
            }, sort=[("createdAt", -1)])

        if not record or not record.get("checkInTime") or record.get("checkOutTime"):
            raise HTTPException(status_code=400, detail="No active un-closed check-in record found.")

        check_out_time_str = get_ist_time_str()
        target_date = record.get("date", today_str)

        # Automatically and permanently delete verification photo from Google Cloud Storage or disk
        photo_deleted = cloud_storage_service.delete_photo(
            storage_type=record.get("storageType"),
            gcs_blob_name=record.get("gcsBlobName"),
            local_path=record.get("photoPath"),
            employee_id=req.employeeId,
            date_str=target_date
        )

        # Calculate working duration accurately across day boundaries
        working_hours_str = "0h 01m"
        try:
            if record.get("createdAt"):
                t_in_dt = datetime.fromisoformat(record["createdAt"])
                diff = now - t_in_dt
                hours = int(diff.total_seconds() // 3600)
                minutes = int((diff.total_seconds() % 3600) // 60)
                if hours > 0 or minutes > 0:
                    working_hours_str = f"{hours}h {minutes:02d}m"
                else:
                    working_hours_str = "0h 01m"
            elif record.get("checkInTime"):
                t_in = datetime.strptime(record["checkInTime"], "%I:%M %p")
                t_out = datetime.strptime(check_out_time_str, "%I:%M %p")
                diff = t_out - t_in
                if diff.total_seconds() < 0:
                    diff += timedelta(days=1)
                hours = int(diff.total_seconds() // 3600)
                minutes = int((diff.total_seconds() % 3600) // 60)
                if hours > 0 or minutes > 0:
                    working_hours_str = f"{hours}h {minutes:02d}m"
                else:
                    working_hours_str = "0h 01m"
        except Exception:
            working_hours_str = "0h 01m"

        # Calculate movement distance between point of check in and check out location
        from app.utils.geo import calculate_haversine_distance, format_distance
        dist_traveled_meters = 0.0
        dist_traveled_formatted = "0 m"
        check_in_loc = record.get("checkInLocation")
        cin_lat = check_in_loc.get("latitude") if isinstance(check_in_loc, dict) else None
        cin_lon = check_in_loc.get("longitude") if isinstance(check_in_loc, dict) else None

        if cin_lat is not None and cin_lon is not None and req.latitude and req.longitude and req.latitude != 0.0:
            dist_traveled_meters = calculate_haversine_distance(cin_lat, cin_lon, req.latitude, req.longitude)
            dist_traveled_meters = round(dist_traveled_meters, 1)
            dist_traveled_formatted = format_distance(dist_traveled_meters)

        final_cout_lat = req.latitude if (req.latitude and req.latitude != 0.0) else (cin_lat or 18.5204)
        final_cout_lon = req.longitude if (req.longitude and req.longitude != 0.0) else (cin_lon or 73.8567)

        # Determine status:
        # If total duration < 5.0 hours (or early departure < 7h) -> "Half Day"
        # If checked in Late and fulfilled shift -> "Late"
        # Otherwise "Checked Out"
        total_worked_hours = hours + (minutes / 60.0)
        is_half_day = total_worked_hours < 5.0 or (is_early and total_worked_hours < 7.0)
        if is_half_day:
            final_status = "Half Day"
        elif record.get("status") == "Late" or record.get("isLate"):
            final_status = "Late"
        else:
            final_status = "Checked Out"

        # Resolve check-out site (either explicitly provided or auto-detected by proximity to known substations)
        sites_col = get_collection("sites")
        checkout_site_name = getattr(req, "siteName", None) or record.get("siteName")
        checkout_site_id = getattr(req, "siteId", None) or record.get("siteId")
        if sites_col is not None:
            if checkout_site_id and not checkout_site_name:
                s_doc = await sites_col.find_one({"$or": [{"id": checkout_site_id}, {"_id": checkout_site_id}]})
                if s_doc:
                    checkout_site_name = s_doc.get("name")
            if not checkout_site_name and req.latitude and req.longitude and req.latitude != 0.0:
                all_sites = await sites_col.find({}).to_list(100)
                nearest_site = None
                min_dist = float('inf')
                for s in all_sites:
                    if s.get("latitude") and s.get("longitude"):
                        d = calculate_haversine_distance(req.latitude, req.longitude, s["latitude"], s["longitude"])
                        if d < min_dist:
                            min_dist = d
                            nearest_site = s
                if nearest_site and min_dist <= (nearest_site.get("attendanceRadius", 500.0) * 5):
                    checkout_site_id = nearest_site.get("id") or str(nearest_site.get("_id"))
                    checkout_site_name = nearest_site.get("name")

        update_data = {
            "checkOutTime": check_out_time_str,
            "checkOutLocation": {
                "latitude": final_cout_lat,
                "longitude": final_cout_lon,
                "accuracy": req.accuracy
            },
            "checkOutSiteId": checkout_site_id,
            "checkOutSiteName": checkout_site_name,
            "status": final_status,
            "isHalfDay": is_half_day,
            "workingHours": working_hours_str,
            "distanceTraveledMeters": dist_traveled_meters,
            "distanceTraveledFormatted": dist_traveled_formatted,
            "photoUrl": None,
            "storageType": None,
            "photoDeleted": True,
            "photoDeletedAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }

        # Update record by ID or employeeId+date
        rec_id = record.get("id") or (str(record.get("_id")) if record.get("_id") else None)
        query_filter = {"id": rec_id} if rec_id and record.get("id") else {"employeeId": req.employeeId, "date": target_date}
        if "_id" in record:
            query_filter = {"_id": record["_id"]}

        await attendance_col.update_one(
            query_filter,
            {
                "$set": update_data,
                "$unset": {
                    "photoPath": "",
                    "gcsBlobName": ""
                }
            }
        )

        # Dispatch notification to Admin & Supervisor
        try:
            from app.services.notification_service import notification_service
            emp_display_name = record.get("employeeName") or req.employeeId
            if is_half_day:
                await notification_service.create_notification(
                    type="HALF_DAY",
                    title="Half Day / Early Checkout",
                    message=f"{emp_display_name} ({req.employeeId}) checked out at {check_out_time_str}. Total duration: {working_hours_str} (Marked as Half Day).",
                    employee_id=req.employeeId,
                    employee_name=emp_display_name,
                    site_id=record.get("siteId"),
                    site_name=record.get("siteName"),
                    severity="warning"
                )
            else:
                await notification_service.create_notification(
                    type="CHECK_OUT",
                    title="Shift Completed",
                    message=f"{emp_display_name} ({req.employeeId}) completed shift at {check_out_time_str}. Duration: {working_hours_str}.",
                    employee_id=req.employeeId,
                    employee_name=emp_display_name,
                    site_id=record.get("siteId"),
                    site_name=record.get("siteName"),
                    severity="info"
                )
        except Exception as e:
            logger.warning(f"Notification error: {e}")

        # Log location
        await locations_col.insert_one({
            "employeeId": req.employeeId,
            "latitude": final_cout_lat,
            "longitude": final_cout_lon,
            "accuracy": req.accuracy,
            "timestamp": now.isoformat(),
            "siteId": record.get("siteId")
        })

        return {
            "success": True,
            "message": "Checked out successfully. Shift verification photo permanently deleted from database and storage.",
            "checkOutTime": check_out_time_str,
            "workingHours": working_hours_str,
            "distanceTraveledMeters": dist_traveled_meters,
            "distanceTraveledFormatted": dist_traveled_formatted,
            "photoDeleted": photo_deleted
        }

    async def get_history(self, employee_id: str, month: Optional[str] = None, filter_type: str = "monthly") -> List[Dict[str, Any]]:
        await self.auto_checkout_past_shifts()
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
            
            # Ensure distanceTraveledFormatted is populated for every checked-out record
            if not item.get("distanceTraveledFormatted") and item.get("checkInLocation") and item.get("checkOutLocation"):
                cin = item["checkInLocation"]
                cout = item["checkOutLocation"]
                if isinstance(cin, dict) and isinstance(cout, dict):
                    cin_lat, cin_lon = cin.get("latitude"), cin.get("longitude")
                    cout_lat, cout_lon = cout.get("latitude"), cout.get("longitude")
                    if cin_lat is not None and cin_lon is not None and cout_lat is not None and cout_lon is not None:
                        from app.utils.geo import calculate_haversine_distance, format_distance
                        d = calculate_haversine_distance(cin_lat, cin_lon, cout_lat, cout_lon)
                        item["distanceTraveledMeters"] = round(d, 1)
                        item["distanceTraveledFormatted"] = format_distance(d)

            # Auto-resolve checkOutSiteName if not explicitly saved
            if not item.get("checkOutSiteName") and item.get("checkOutLocation"):
                cout = item["checkOutLocation"]
                if isinstance(cout, dict) and cout.get("latitude") and cout.get("longitude"):
                    sites_col = get_collection("sites")
                    if sites_col is not None:
                        all_sites = await sites_col.find({}).to_list(50)
                        from app.utils.geo import calculate_haversine_distance
                        for s in all_sites:
                            if s.get("latitude") and s.get("longitude"):
                                d = calculate_haversine_distance(cout["latitude"], cout["longitude"], s["latitude"], s["longitude"])
                                if d <= (s.get("attendanceRadius", 500.0) * 4):
                                    item["checkOutSiteName"] = s.get("name")
                                    item["checkOutSiteId"] = s.get("id")
                                    break

            formatted.append(item)
        return formatted

    async def manual_adjustment(self, req: ManualAttendanceAdjustmentRequest) -> Dict[str, Any]:
        attendance_col = get_collection("attendance")
        employees_col = get_collection("employees")
        sites_col = get_collection("sites")

        emp = await employees_col.find_one({"employeeId": req.employeeId})
        emp_name = emp.get("name", "Field Technician") if emp else "Field Technician"
        site_name = req.siteName or (emp.get("assignedSiteName") if emp else "Assigned Site")

        now_iso = datetime.now().isoformat()
        raw_status = (req.status or "").strip()
        status_lower = raw_status.lower()

        # Normalize status label
        if "late" in status_lower:
            status_label = "Late"
        elif "half" in status_lower or "hd" == status_lower:
            status_label = "Half Day"
        elif "present" in status_lower:
            status_label = "Present"
        elif "absent" in status_lower:
            status_label = "Absent"
        else:
            status_label = raw_status.title() if raw_status else "Present"

        # Look for existing attendance record on that date
        existing = await attendance_col.find_one({"employeeId": req.employeeId, "date": req.date})

        default_check_in = req.checkInTime
        if not default_check_in:
            if status_label == "Late":
                default_check_in = "10:15 AM"
            elif status_label == "Half Day":
                default_check_in = "09:00 AM"
            else:
                default_check_in = "09:00 AM"

        default_check_out = req.checkOutTime
        if not default_check_out:
            if status_label == "Half Day":
                default_check_out = "01:30 PM"
            elif status_label == "Late":
                default_check_out = "06:00 PM"
            else:
                default_check_out = "06:00 PM"

        default_working_hours = req.workingHours
        if not default_working_hours:
            if status_label == "Half Day":
                default_working_hours = "4h 30m"
            elif status_label == "Late":
                default_working_hours = "7h 45m"
            else:
                default_working_hours = "9h 00m"

        remarks_str = req.remarks or f"Status set to {status_label} by Admin"

        if existing:
            update_fields = {
                "status": status_label,
                "updatedAt": now_iso,
                "isManualAdjustment": True,
                "remarks": remarks_str
            }
            if req.checkInTime or not existing.get("checkInTime"):
                update_fields["checkInTime"] = default_check_in
            if req.checkOutTime or not existing.get("checkOutTime"):
                update_fields["checkOutTime"] = default_check_out
            if req.workingHours or not existing.get("workingHours"):
                update_fields["workingHours"] = default_working_hours
            if req.siteName:
                update_fields["siteName"] = req.siteName

            await attendance_col.update_one({"_id": existing["_id"]}, {"$set": update_fields})
            return {
                "success": True,
                "message": f"Successfully updated attendance for {emp_name} ({req.employeeId}) on {req.date} to {status_label}.",
                "recordId": str(existing.get("_id", existing.get("id"))),
                "status": status_label,
                "date": req.date,
                "remarks": remarks_str
            }
        else:
            new_id = f"att_man_{uuid.uuid4().hex[:8]}"
            new_doc = {
                "attendanceId": new_id,
                "id": new_id,
                "employeeId": req.employeeId,
                "employeeName": emp_name,
                "date": req.date,
                "siteName": site_name,
                "checkInTime": default_check_in,
                "checkOutTime": default_check_out,
                "workingHours": default_working_hours,
                "status": status_label,
                "createdAt": now_iso,
                "updatedAt": now_iso,
                "isManualAdjustment": True,
                "remarks": remarks_str
            }
            await attendance_col.insert_one(new_doc)
            return {
                "success": True,
                "message": f"Successfully created {status_label} attendance record for {emp_name} ({req.employeeId}) on {req.date}.",
                "recordId": new_id,
                "status": status_label,
                "date": req.date,
                "remarks": remarks_str
            }

attendance_service = AttendanceService()
