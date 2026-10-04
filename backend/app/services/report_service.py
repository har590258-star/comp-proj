import io
from typing import Dict, Any, List, Optional
import pandas as pd
from app.db.mongodb import get_collection
from app.schemas.reports import AttendanceReportFilter

class ReportService:
    async def get_attendance_report(self, filters: AttendanceReportFilter) -> Dict[str, Any]:
        attendance_col = get_collection("attendance")
        query: Dict[str, Any] = {}

        if filters.siteId and filters.siteId != "all":
            query["siteId"] = filters.siteId
        if filters.employeeId and filters.employeeId != "all":
            query["employeeId"] = filters.employeeId
        if filters.status and filters.status != "all":
            query["status"] = filters.status
        if filters.fromDate and filters.toDate:
            query["date"] = {"$gte": filters.fromDate, "$lte": filters.toDate}
        elif filters.fromDate:
            query["date"] = {"$gte": filters.fromDate}
        elif filters.toDate:
            query["date"] = {"$lte": filters.toDate}

        records = await attendance_col.find(query).sort("date", -1).to_list(500)
        formatted_records = []
        present_cnt = 0
        absent_cnt = 0
        checked_out_cnt = 0

        for r in records:
            item = dict(r)
            if "_id" in item:
                item["id"] = str(item["_id"])
            status = item.get("status", "Present")
            if status == "Present":
                present_cnt += 1
            elif status == "Absent":
                absent_cnt += 1
            elif status == "Checked Out":
                checked_out_cnt += 1
            formatted_records.append(item)

        total = len(formatted_records)
        compliance_pct = round((present_cnt + checked_out_cnt) / max(1, total) * 100, 1) if total > 0 else 0.0

        # Calculate real average hours from completed shifts if available
        completed_hours_total = 0
        completed_count = 0
        for r in formatted_records:
            wh = r.get("workingHours", "")
            if "h" in wh and "m" in wh:
                try:
                    parts = wh.replace("m", "").split("h")
                    h = int(parts[0].strip())
                    m = int(parts[1].strip())
                    completed_hours_total += (h * 60 + m)
                    completed_count += 1
                except Exception:
                    pass

        if completed_count > 0:
            avg_minutes = completed_hours_total // completed_count
            avg_hours_str = f"{avg_minutes // 60}h {avg_minutes % 60:02d}m"
        else:
            avg_hours_str = "0h 00m"

        return {
            "summary": {
                "totalRecords": total,
                "presentCount": present_cnt,
                "absentCount": absent_cnt,
                "checkedOutCount": checked_out_cnt,
                "averageWorkingHours": avg_hours_str,
                "complianceRate": f"{compliance_pct}%"
            },
            "records": formatted_records
        }

    async def generate_excel_bytes(self, filters: AttendanceReportFilter) -> bytes:
        report_data = await self.get_attendance_report(filters)
        records = report_data["records"]

        export_rows = []
        for r in records:
            export_rows.append({
                "Date": r.get("date", ""),
                "Employee ID": r.get("employeeId", ""),
                "Employee Name": r.get("employeeName", ""),
                "Site": r.get("siteName", ""),
                "Status": r.get("status", ""),
                "Check-In Time": r.get("checkInTime", "--"),
                "Check-Out Time": r.get("checkOutTime", "--"),
                "Working Hours": r.get("workingHours", "--"),
                "Check-In Latitude": r.get("checkInLocation", {}).get("latitude", "") if r.get("checkInLocation") else "",
                "Check-In Longitude": r.get("checkInLocation", {}).get("longitude", "") if r.get("checkInLocation") else ""
            })

        df = pd.DataFrame(export_rows)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Attendance Report")
        output.seek(0)
        return output.getvalue()

report_service = ReportService()
