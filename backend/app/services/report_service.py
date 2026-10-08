import io
import os
import calendar
from datetime import datetime, date
from typing import Dict, Any, List, Optional
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.drawing.image import Image as OpenpyxlImage

from app.db.mongodb import get_collection
from app.schemas.reports import AttendanceReportFilter

# Official Holiday Calendar 2026 matching b4S Solutions Pvt. Ltd. list
OFFICIAL_HOLIDAYS_2026 = {
    "2026-01-26": "Republic Day",
    "2026-03-04": "Dhulandi",
    "2026-03-19": "Gudi Padwa",
    "2026-05-01": "Maharashtra Day",
    "2026-08-15": "Independence Day",
    "2026-09-25": "Anant Chaturdashi",
    "2026-10-02": "Gandhi Jayanti",
    "2026-10-20": "Dussehra",
    "2026-11-08": "Diwali",
    "2026-11-09": "Goverdhan Pooja"
}

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

        records = await attendance_col.find(query).sort("date", -1).to_list(1000)
        formatted_records = []
        present_cnt = 0
        absent_cnt = 0
        checked_out_cnt = 0

        for r in records:
            item = dict(r)
            if "_id" in item:
                item["id"] = str(item["_id"])
                del item["_id"]
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
        """
        Generates an exact replica of the attendance excel template:
        - Embedded b4S Company Logo in header
        - Exact muster roll structure matching template
        - Filled with real employee and telemetry data from the website
        - Focuses on the current month's attendance matrix (1 to 31)
        - Sheet 2: 'Detailed Log' with full telemetry timestamps and GPS
        """
        now = datetime.now()
        # Default to current month and year
        target_year = now.year
        target_month = now.month

        if getattr(filters, "year", None) and getattr(filters, "month", None):
            target_year = int(filters.year)
            target_month = int(filters.month)
        elif filters.toDate:
            try:
                parts = filters.toDate.split("-")
                target_year = int(parts[0])
                target_month = int(parts[1])
            except Exception:
                pass
        elif filters.fromDate:
            try:
                parts = filters.fromDate.split("-")
                target_year = int(parts[0])
                target_month = int(parts[1])
            except Exception:
                pass

        month_name = calendar.month_name[target_month]
        _, days_in_month = calendar.monthrange(target_year, target_month)

        # 1. Fetch Real Employees from website database (technicians)
        employees_col = get_collection("employees")
        emp_query: Dict[str, Any] = {"role": {"$ne": "admin"}}
        if filters.employeeId and filters.employeeId != "all":
            emp_query["employeeId"] = filters.employeeId
        if filters.siteId and filters.siteId != "all":
            emp_query["assignedSiteId"] = filters.siteId

        employees = await employees_col.find(emp_query).sort("employeeId", 1).to_list(200)
        if not employees:
            # Fallback to users collection
            users_col = get_collection("users")
            user_query = {"role": {"$ne": "admin"}}
            if filters.employeeId and filters.employeeId != "all":
                user_query["employeeId"] = filters.employeeId
            employees = await users_col.find(user_query).sort("employeeId", 1).to_list(200)

        # 2. Fetch Sites map for location labels
        sites_col = get_collection("sites")
        sites_list = await sites_col.find({}).to_list(100)
        site_map = {s.get("id"): s.get("name") for s in sites_list}

        location_title = "All Locations"
        if filters.siteId and filters.siteId != "all":
            location_title = site_map.get(filters.siteId, filters.siteId)

        # 3. Fetch Real Attendance records for the target current month
        attendance_col = get_collection("attendance")
        month_prefix = f"{target_year}-{target_month:02d}"
        att_query: Dict[str, Any] = {
            "date": {"$regex": f"^{month_prefix}"}
        }
        if filters.siteId and filters.siteId != "all":
            att_query["siteId"] = filters.siteId
        if filters.employeeId and filters.employeeId != "all":
            att_query["employeeId"] = filters.employeeId

        att_records = await attendance_col.find(att_query).to_list(2000)

        # Build attendance lookup map: (employeeId, day_int) -> status_code
        att_map = {}
        for r in att_records:
            emp_id = r.get("employeeId")
            date_str = r.get("date", "")
            status_val = r.get("status", "Present")
            if emp_id and date_str:
                try:
                    d_int = int(date_str.split("-")[2])
                    code = "P"
                    if status_val in ["Present", "Checked Out"]:
                        code = "P"
                    elif status_val == "Absent":
                        code = "A"
                    elif status_val in ["On Duty", "OD"]:
                        code = "OD"
                    elif status_val in ["Weekly Off", "WO"]:
                        code = "WO"
                    elif status_val in ["Holiday", "PH"]:
                        code = "PH"
                    elif status_val in ["Leave", "PL"]:
                        code = "PL"
                    elif status_val in ["WOP", "Without Pay"]:
                        code = "WOP"
                    att_map[(emp_id, d_int)] = code
                except Exception:
                    pass

        # 4. Create Excel Workbook with openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Attendance"
        ws.views.sheetView[0].showGridLines = True

        # Styles matching template
        font_title = Font(name="Calibri", size=13, bold=True, color="1F497D")
        font_company = Font(name="Calibri", size=10, bold=True, color="595959")
        font_loc = Font(name="Calibri", size=10, bold=True, color="1F497D")
        font_header = Font(name="Calibri", size=9, bold=True, color="FFFFFF")
        font_body = Font(name="Calibri", size=9, bold=False, color="000000")
        font_body_bold = Font(name="Calibri", size=9, bold=True, color="000000")
        font_total = Font(name="Calibri", size=9, bold=True, color="1F497D")

        fill_header = PatternFill(start_color="1F497D", end_color="1F497D", fill_type="solid")
        fill_totals_header = PatternFill(start_color="2A5C9A", end_color="2A5C9A", fill_type="solid")
        fill_sunday = PatternFill(start_color="F2F5F9", end_color="F2F5F9", fill_type="solid")
        fill_holiday = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
        fill_summary_col = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
        fill_total_row = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")

        border_thin = Border(
            left=Side(style="thin", color="D9D9D9"),
            right=Side(style="thin", color="D9D9D9"),
            top=Side(style="thin", color="D9D9D9"),
            bottom=Side(style="thin", color="D9D9D9")
        )
        border_total = Border(
            left=Side(style="thin", color="B0B0B0"),
            right=Side(style="thin", color="B0B0B0"),
            top=Side(style="thin", color="000000"),
            bottom=Side(style="double", color="000000")
        )

        align_center = Alignment(horizontal="center", vertical="center")
        align_left = Alignment(horizontal="left", vertical="center")

        # 5. Insert Company Logo in Header (Top Left A1)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        logo_path = os.path.join(base_dir, "assets", "b4s_logo.png")
        if not os.path.exists(logo_path):
            # Fallback path if needed
            logo_path = r"e:\comp-proj\backend\app\assets\b4s_logo.png"

        if os.path.exists(logo_path):
            try:
                logo_img = OpenpyxlImage(logo_path)
                logo_img.width = 86
                logo_img.height = 54
                ws.add_image(logo_img, "A1")
            except Exception as e:
                print(f"Notice: Logo embedding skipped: {e}")

        # Row 1: Sheet Title
        ws.merge_cells("C1:AQ1")
        cell_r1 = ws["C1"]
        cell_r1.value = f"ATTENDANCE FOR THE MONTH OF {month_name.upper()}  {target_year}"
        cell_r1.font = font_title
        cell_r1.alignment = align_left
        ws.row_dimensions[1].height = 24

        # Row 2: Subtitle / Company
        ws.merge_cells("C2:AQ2")
        cell_r2 = ws["C2"]
        cell_r2.value = "b4S SOLUTIONS PVT. LTD. - MUSTER ROLL ATTENDANCE REGISTER"
        cell_r2.font = font_company
        cell_r2.alignment = align_left
        ws.row_dimensions[2].height = 20

        # Row 3: Location
        ws.merge_cells("C3:AQ3")
        cell_r3 = ws["C3"]
        cell_r3.value = f"LOCATION: {location_title}"
        cell_r3.font = font_loc
        cell_r3.alignment = align_left
        ws.row_dimensions[3].height = 18

        # Row 4: Column Headers
        headers = [
            "SR. NO.",
            "Employee Code",
            "Employee Name",
            "LOCATION"
        ]
        # Days 1 to 31
        for d in range(1, 32):
            headers.append(d)
        # Summary counts
        headers.extend(["P", "WOP", "A", "OD", "WO", "PL", "PH", "Total"])

        ws.row_dimensions[4].height = 26
        for col_idx, h in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col_idx, value=h)
            cell.font = font_header
            cell.alignment = align_center
            cell.border = border_thin
            if col_idx >= 36:
                cell.fill = fill_totals_header
            else:
                cell.fill = fill_header

        # Column Widths matching the template
        col_widths = {
            1: 7.0,    # SR. NO.
            2: 17.0,   # Employee Code
            3: 28.0,   # Employee Name
            4: 20.0,   # LOCATION
        }
        for d_col in range(5, 36):
            col_widths[d_col] = 4.3  # Days 1 to 31
        for sum_col in range(36, 43):
            col_widths[sum_col] = 5.8  # P, WOP, A, OD, WO, PL, PH
        col_widths[43] = 9.5  # Total

        for c_idx, width in col_widths.items():
            ws.column_dimensions[get_column_letter(c_idx)].width = width

        # Today date for real timeline mapping
        today_date = date.today()

        # Rows 5 onwards: Real Employee Data Rows
        start_row = 5
        for emp_idx, emp in enumerate(employees, 1):
            curr_row = start_row + emp_idx - 1
            ws.row_dimensions[curr_row].height = 20

            emp_code = emp.get("employeeId", f"EMP{emp_idx:03d}")
            emp_name = emp.get("name") or emp.get("fullName", "Field Technician")
            emp_site = emp.get("assignedSiteName") or location_title

            # Col A: SR. NO.
            c_sr = ws.cell(row=curr_row, column=1, value=emp_idx)
            c_sr.font = font_body
            c_sr.alignment = align_center
            c_sr.border = border_thin

            # Col B: Employee Code
            c_code = ws.cell(row=curr_row, column=2, value=emp_code)
            c_code.font = font_body_bold
            c_code.alignment = align_left
            c_code.border = border_thin

            # Col C: Employee Name
            c_name = ws.cell(row=curr_row, column=3, value=emp_name)
            c_name.font = font_body_bold
            c_name.alignment = align_left
            c_name.border = border_thin

            # Col D: LOCATION
            c_loc = ws.cell(row=curr_row, column=4, value=emp_site)
            c_loc.font = font_body
            c_loc.alignment = align_left
            c_loc.border = border_thin

            # Days 1 to 31
            for day in range(1, 32):
                col_i = 4 + day
                cell_day = ws.cell(row=curr_row, column=col_i)
                cell_day.border = border_thin
                cell_day.alignment = align_center

                if day > days_in_month:
                    cell_day.value = ""
                    cell_day.font = font_body
                    continue

                curr_dt = date(target_year, target_month, day)
                dt_str = curr_dt.strftime("%Y-%m-%d")
                is_sunday = (curr_dt.weekday() == 6)
                is_holiday = dt_str in OFFICIAL_HOLIDAYS_2026

                code = att_map.get((emp_code, day))
                if not code:
                    if is_holiday:
                        code = "PH"
                    elif is_sunday:
                        code = "WO"
                    elif curr_dt < today_date:
                        code = "A"
                    elif curr_dt == today_date:
                        code = "-"
                    else:
                        # Future days remain empty in muster roll register
                        code = ""

                cell_day.value = code
                if code == "P":
                    cell_day.font = Font(name="Calibri", size=9, bold=True, color="047857")
                elif code == "A":
                    cell_day.font = Font(name="Calibri", size=9, bold=True, color="B91C1C")
                elif code == "WO":
                    cell_day.font = Font(name="Calibri", size=9, bold=True, color="1D4ED8")
                    cell_day.fill = fill_sunday
                elif code == "PH":
                    cell_day.font = Font(name="Calibri", size=9, bold=True, color="B45309")
                    cell_day.fill = fill_holiday
                elif code == "OD":
                    cell_day.font = Font(name="Calibri", size=9, bold=True, color="6D28D9")
                else:
                    cell_day.font = font_body

            # Summary Columns (AJ to AQ / 36 to 43)
            day_start_col = "E"
            day_end_col = get_column_letter(4 + 31)

            formulas = {
                36: f'=COUNTIF({day_start_col}{curr_row}:{day_end_col}{curr_row},"P")',
                37: f'=COUNTIF({day_start_col}{curr_row}:{day_end_col}{curr_row},"WOP")',
                38: f'=COUNTIF({day_start_col}{curr_row}:{day_end_col}{curr_row},"A")',
                39: f'=COUNTIF({day_start_col}{curr_row}:{day_end_col}{curr_row},"OD")',
                40: f'=COUNTIF({day_start_col}{curr_row}:{day_end_col}{curr_row},"WO")',
                41: f'=COUNTIF({day_start_col}{curr_row}:{day_end_col}{curr_row},"PL")',
                42: f'=COUNTIF({day_start_col}{curr_row}:{day_end_col}{curr_row},"PH")',
                43: f'=AJ{curr_row}+AK{curr_row}+AM{curr_row}+AN{curr_row}+AO{curr_row}+AP{curr_row}',
            }

            for col_s, formula in formulas.items():
                c_sum = ws.cell(row=curr_row, column=col_s, value=formula)
                c_sum.border = border_thin
                c_sum.alignment = align_center
                c_sum.font = font_body_bold
                c_sum.fill = fill_summary_col

        # Grand Total Row at Bottom
        num_emps = len(employees)
        tot_row = start_row + num_emps
        ws.row_dimensions[tot_row].height = 22

        c_tot_label = ws.cell(row=tot_row, column=1, value="Total")
        c_tot_label.font = font_total
        c_tot_label.alignment = align_center
        c_tot_label.border = border_total
        c_tot_label.fill = fill_total_row

        for c_blank in range(2, 36):
            c_b = ws.cell(row=tot_row, column=c_blank, value="")
            c_b.border = border_total
            c_b.fill = fill_total_row

        for sum_c in range(36, 44):
            col_let = get_column_letter(sum_c)
            if num_emps > 0:
                sum_form = f"=SUM({col_let}{start_row}:{col_let}{tot_row - 1})"
            else:
                sum_form = 0
            c_sum_tot = ws.cell(row=tot_row, column=sum_c, value=sum_form)
            c_sum_tot.font = font_total
            c_sum_tot.alignment = align_center
            c_sum_tot.border = border_total
            c_sum_tot.fill = fill_total_row

        # Sheet 2: Detailed Log Tab with full telemetry
        ws_detail = wb.create_sheet(title="Detailed Log")
        ws_detail.views.sheetView[0].showGridLines = True

        detail_headers = [
            "Date", "Employee ID", "Employee Name", "Site Name", "Status",
            "Check-In Time", "Check-Out Time", "Working Hours",
            "Check-In Latitude", "Check-In Longitude", "Check-Out Latitude", "Check-Out Longitude"
        ]

        ws_detail.row_dimensions[1].height = 24
        for col_idx, h in enumerate(detail_headers, 1):
            cell = ws_detail.cell(row=1, column=col_idx, value=h)
            cell.font = font_header
            cell.fill = fill_header
            cell.alignment = align_center
            cell.border = border_thin

        detail_widths = [14, 16, 24, 22, 14, 15, 15, 15, 18, 18, 18, 18]
        for idx, w in enumerate(detail_widths, 1):
            ws_detail.column_dimensions[get_column_letter(idx)].width = w

        for r_idx, r in enumerate(att_records, 2):
            ws_detail.row_dimensions[r_idx].height = 19
            cin_loc = r.get("checkInLocation") or {}
            cout_loc = r.get("checkOutLocation") or {}

            row_vals = [
                r.get("date", ""),
                r.get("employeeId", ""),
                r.get("employeeName", ""),
                r.get("siteName", ""),
                r.get("status", ""),
                r.get("checkInTime", "--"),
                r.get("checkOutTime", "--"),
                r.get("workingHours", "--"),
                cin_loc.get("latitude", "") if isinstance(cin_loc, dict) else "",
                cin_loc.get("longitude", "") if isinstance(cin_loc, dict) else "",
                cout_loc.get("latitude", "") if isinstance(cout_loc, dict) else "",
                cout_loc.get("longitude", "") if isinstance(cout_loc, dict) else ""
            ]

            for c_idx, val in enumerate(row_vals, 1):
                c = ws_detail.cell(row=r_idx, column=c_idx, value=val)
                c.font = font_body
                c.border = border_thin
                c.alignment = align_left if c_idx in [2, 3, 4] else align_center

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output.getvalue()

report_service = ReportService()
