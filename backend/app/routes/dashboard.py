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
    total_employees = await employees_col.count_documents({"status": "Active"})

    # Today's real records
    today_str = get_ist_today_str()
    today_records = await attendance_col.find({"date": today_str}).to_list(500)

    present_cnt = sum(1 for r in today_records if r.get("status") == "Present")
    checked_out_cnt = sum(1 for r in today_records if r.get("status") == "Checked Out")
    absent_cnt = max(0, total_employees - present_cnt - checked_out_cnt)

    # Real recent attendance items
    recent_items = []
    # Sort today records by updatedAt or createdAt desc
    sorted_records = sorted(
        today_records,
        key=lambda x: x.get("updatedAt", x.get("createdAt", "")),
        reverse=True
    )
    for r in sorted_records[:10]:
        recent_items.append(
            RecentAttendanceItem(
                id=str(r.get("_id", r.get("id", ""))),
                employeeId=r.get("employeeId", "EMP"),
                name=r.get("employeeName", "Technician"),
                designation="Field Technician",
                site=r.get("siteName", "Assigned Site"),
                status=r.get("status", "Present"),
                checkIn=r.get("checkInTime", "--") or "--",
                checkOut=r.get("checkOutTime", "--") or "--",
                workingHours=r.get("workingHours", "Active")
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
        site_id = s.get("id")
        site_present = sum(
            1 for r in today_records 
            if (r.get("siteId") == site_id or r.get("siteName") == site_name) 
            and r.get("status") in ["Present", "Checked Out"]
        )
        site_total = await employees_col.count_documents({"assignedSiteId": site_id, "status": "Active"})
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
