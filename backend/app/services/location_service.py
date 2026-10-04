from datetime import datetime
from typing import Dict, Any, List, Optional
from app.db.mongodb import get_collection
from app.utils.geo import format_distance, calculate_haversine_distance
from app.utils.time_utils import get_ist_now, get_ist_today_str, get_ist_time_str

class LocationService:
    async def get_current_location(self, employee_id: str) -> Dict[str, Any]:
        locations_col = get_collection("locations")
        employees_col = get_collection("employees")
        sites_col = get_collection("sites")

        emp = await employees_col.find_one({"employeeId": employee_id})
        emp_name = emp.get("name", "Field Technician") if emp else "Field Technician"
        site_name = emp.get("assignedSiteName", "Field Deployment") if emp else "Field Deployment"

        # Fetch latest real location logged by the employee
        latest_loc = await locations_col.find_one(
            {"employeeId": employee_id},
            sort=[("timestamp", -1)]
        )

        time_str = get_ist_time_str()

        if latest_loc and "latitude" in latest_loc and "longitude" in latest_loc:
            user_lat = latest_loc["latitude"]
            user_lon = latest_loc["longitude"]
            return {
                "employeeId": employee_id,
                "employeeName": emp_name,
                "latitude": user_lat,
                "longitude": user_lon,
                "accuracy": latest_loc.get("accuracy", 8),
                "speed": latest_loc.get("speed"),
                "batteryLevel": latest_loc.get("batteryLevel"),
                "updatedAt": time_str,
                "siteName": site_name,
                "distanceToSiteMeters": 0.0,
                "distanceFormatted": "0 m",
                "isOnline": True
            }

        # If no previous location has been logged yet, return clean state without fixed Pune coordinates
        return {
            "employeeId": employee_id,
            "employeeName": emp_name,
            "latitude": None,
            "longitude": None,
            "accuracy": None,
            "speed": None,
            "batteryLevel": None,
            "updatedAt": time_str,
            "siteName": site_name,
            "distanceToSiteMeters": 0.0,
            "distanceFormatted": "0 m",
            "isOnline": True
        }

    async def get_location_history(self, employee_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        locations_col = get_collection("locations")
        records = await locations_col.find({"employeeId": employee_id}).sort("timestamp", -1).limit(limit).to_list(limit)

        results = []
        for r in records:
            item = dict(r)
            if "_id" in item:
                item["id"] = str(item.pop("_id"))
            results.append(item)
        return results

    async def get_team_locations(self) -> List[Dict[str, Any]]:
        employees_col = get_collection("employees")
        locations_col = get_collection("locations")
        attendance_col = get_collection("attendance")

        employees = await employees_col.find({"status": "Active"}).to_list(100)
        today_str = get_ist_today_str()
        team_data = []

        for emp in employees:
            emp_id = emp.get("employeeId")
            if not emp_id or emp.get("role") == "admin":
                continue

            # Fetch latest real location logged by this employee
            latest_loc = await locations_col.find_one(
                {"employeeId": emp_id},
                sort=[("timestamp", -1)]
            )

            # Fetch today attendance
            att = await attendance_col.find_one({"employeeId": emp_id, "date": today_str})
            if not att:
                # Most recent attendance record fallback
                att = await attendance_col.find_one({"employeeId": emp_id}, sort=[("date", -1), ("createdAt", -1)])

            lat = None
            lon = None
            accuracy = 8
            time_str = "--"
            raw_timestamp = None

            if latest_loc and "latitude" in latest_loc and "longitude" in latest_loc:
                lat = latest_loc["latitude"]
                lon = latest_loc["longitude"]
                accuracy = latest_loc.get("accuracy", 8)
                raw_timestamp = latest_loc.get("timestamp")
                try:
                    dt = datetime.fromisoformat(raw_timestamp)
                    time_str = dt.strftime("%I:%M %p")
                except Exception:
                    time_str = str(raw_timestamp)[:16]
            elif att and "checkInLocation" in att and att["checkInLocation"]:
                loc = att["checkInLocation"]
                lat = loc.get("latitude")
                lon = loc.get("longitude")
                accuracy = loc.get("accuracy", 8)
                time_str = att.get("checkInTime", "--")

            status = att.get("status", "Not Checked In") if att else "Not Checked In"

            team_data.append({
                "employeeId": emp_id,
                "name": emp.get("name", "Field Technician"),
                "designation": emp.get("designation", "Field Technician"),
                "siteName": (att.get("siteName") if att else None) or emp.get("assignedSiteName", "Assigned Site"),
                "status": status,
                "checkInTime": att.get("checkInTime") if att else None,
                "checkOutTime": att.get("checkOutTime") if att else None,
                "latitude": lat,
                "longitude": lon,
                "accuracy": accuracy,
                "speed": latest_loc.get("speed") if latest_loc else None,
                "batteryLevel": latest_loc.get("batteryLevel") if latest_loc else None,
                "lastUpdated": time_str,
                "timestamp": raw_timestamp,
                "hasLocation": lat is not None and lon is not None
            })

        return team_data

location_service = LocationService()
