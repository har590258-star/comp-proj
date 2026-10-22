from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter
from app.db.mongodb import get_collection
from app.schemas.dashboard import DashboardStatsOut, RecentAttendanceItem
from app.utils.time_utils import get_ist_today, get_ist_today_str

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsOut)
async def get_dashboard_stats():
    attendance_col = get_collection("attendance")
    employees_col = get_collection("employees")
    sites_col = get_collection("sites")

    # Real count of active employees
    total_employees = await employees_col.count_documents({"status": {"$ne": "Inactive"}})

    # Today's real records
    today_str = get_ist_today_str()
    today_records = await attendance_col.find({"date": today_str}).to_list(500)
    if not today_records:
        today_records = await attendance_col.find().sort([("date", -1), ("createdAt", -1)]).limit(10).to_list(10)

    present_cnt = sum(1 for r in today_records if r.get("status") == "Present")
    checked_out_cnt = sum(1 for r in today_records if r.get("status") == "Checked Out")
    absent_cnt = max(0, total_employees - present_cnt - checked_out_cnt)

    # Sort today records by updatedAt or createdAt desc
    sorted_records = sorted(
        today_records,
        key=lambda x: x.get("updatedAt", x.get("createdAt", "")),
        reverse=True
    )

    # Fetch employee metadata for all recent attendance records
    emp_ids = list({r.get("employeeId") for r in sorted_records if r.get("employeeId")})
    emp_map = {}
    if emp_ids and employees_col is not None:
        raw_emps = await employees_col.find({"employeeId": {"$in": emp_ids}}).to_list(len(emp_ids))
        emp_map = {e.get("employeeId"): e for e in raw_emps}

    # Real recent attendance items
    recent_items = []
    for r in sorted_records[:10]:
        emp_id = r.get("employeeId", "EMP")
        emp = emp_map.get(emp_id, {})

        dist_fmt = r.get("distanceTraveledFormatted")
        if not dist_fmt and r.get("checkInLocation") and r.get("checkOutLocation"):
            cin = r["checkInLocation"]
            cout = r["checkOutLocation"]
            if isinstance(cin, dict) and isinstance(cout, dict):
                cin_lat, cin_lon = cin.get("latitude"), cin.get("longitude")
                cout_lat, cout_lon = cout.get("latitude"), cout.get("longitude")
                if cin_lat is not None and cout_lat is not None:
                    from app.utils.geo import calculate_haversine_distance, format_distance
                    dist_fmt = format_distance(calculate_haversine_distance(cin_lat, cin_lon, cout_lat, cout_lon))

        cin_loc = r.get("checkInLocation")
        cout_loc = r.get("checkOutLocation")
        battery = emp.get("lastBatteryLevel")
        if battery is None and isinstance(cout_loc, dict):
            battery = cout_loc.get("batteryLevel")
        if battery is None and isinstance(cin_loc, dict):
            battery = cin_loc.get("batteryLevel")

        recent_items.append(
            RecentAttendanceItem(
                id=str(r.get("_id", r.get("id", ""))),
                employeeId=emp_id,
                name=r.get("employeeName") or emp.get("name") or "Technician",
                designation=emp.get("designation") or "Field Technician",
                site=r.get("siteName", "Assigned Site"),
                checkOutSite=r.get("checkOutSiteName"),
                status=r.get("status", "Present"),
                checkIn=r.get("checkInTime", "--") or "--",
                checkOut=r.get("checkOutTime", "--") or "--",
                workingHours=r.get("workingHours", "Active"),
                distanceTraveledFormatted=dist_fmt or "--",
                checkInLocation=cin_loc if isinstance(cin_loc, dict) else None,
                checkOutLocation=cout_loc if isinstance(cout_loc, dict) else None,
                date=r.get("date"),
                phone=emp.get("phone"),
                email=emp.get("email"),
                division=emp.get("division"),
                circle=emp.get("circle"),
                batteryLevel=float(battery) if battery is not None else None,
                lastSeen=emp.get("lastSeen")
            )
        )

    # Past 7 days attendance trend computed from real attendance
    days_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    attendance_trend = []
    today_dt = get_ist_today()
    for i in range(6, -1, -1):
        target_day = today_dt - timedelta(days=i)
        target_day_str = target_day.isoformat()
        day_label = days_labels[target_day.weekday()]
        
        day_records = await attendance_col.find({"date": target_day_str}).to_list(500)
        day_present = sum(1 for r in day_records if r.get("status") in ["Present", "Checked Out"])
        day_absent = max(0, total_employees - day_present)
        rate = round((day_present / max(1, total_employees)) * 100, 1) if total_employees > 0 else 0.0

        attendance_trend.append({
            "day": day_label,
            "present": day_present,
            "absent": day_absent,
            "rate": rate
        })

    status_distribution = [
        {"name": "Present", "value": present_cnt, "color": "#22C55E"},
        {"name": "Absent", "value": absent_cnt, "color": "#EF4444"},
        {"name": "Checked Out", "value": checked_out_cnt, "color": "#1E63F0"}
    ]

    # Site-wise stats computed from real sites
    sites = await sites_col.find({"status": "Active"}).to_list(100)
    site_wise_stats = []
    for s in sites:
        site_name = s.get("name", "Site")
        id_val = str(s.get("id") or s.get("_id") or "")
        code_val = str(s.get("code") or "")
        site_identifiers = [x for x in [id_val, str(s.get("_id")), code_val] if x]

        site_present = sum(
            1 for r in today_records 
            if (r.get("siteId") in site_identifiers or r.get("siteName") == site_name) 
            and r.get("status") in ["Present", "Checked Out"]
        )
        site_total = await employees_col.count_documents({
            "$or": [
                {"assignedSiteId": {"$in": site_identifiers}},
                {"assignedSiteIds": {"$in": site_identifiers}},
                {"assignedSiteName": site_name},
                {"assignedSiteNames": site_name}
            ],
            "status": "Active"
        })
        site_absent = max(0, site_total - site_present)
        site_wise_stats.append({
            "name": site_name,
            "present": site_present,
            "absent": site_absent,
            "total": site_total
        })

    attendance_rate = round(((present_cnt + checked_out_cnt) / max(1, total_employees)) * 100, 1) if total_employees > 0 else 0.0

    return DashboardStatsOut(
        totalEmployees=total_employees,
        presentToday=present_cnt,
        absentToday=absent_cnt,
        checkedOutToday=checked_out_cnt,
        attendanceRate=attendance_rate,
        recentAttendance=recent_items,
        attendanceTrend=attendance_trend,
        statusDistribution=status_distribution,
        siteWiseStats=site_wise_stats
    )
