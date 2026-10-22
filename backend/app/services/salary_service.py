import calendar
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.db.mongodb import get_collection
from app.utils.time_utils import get_ist_now
from app.schemas.salary import SalarySlipOut, PayrollSummaryOut, MonthlyPayrollRecord, UploadSlipRequest

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

def num_to_words(n: int) -> str:
    """Converts integer number up to 99,99,999 into Indian Rupee words."""
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
             "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
             "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def convert_hundred(val: int) -> str:
        s = ""
        if val >= 100:
            s += units[val // 100] + " Hundred "
            val %= 100
        if val >= 20:
            s += tens[val // 10] + " "
            val %= 10
        if val > 0:
            s += units[val] + " "
        return s.strip()

    if n == 0:
        return "Zero Rupees Only"

    result = ""
    # Lakhs
    lakhs = n // 100000
    if lakhs > 0:
        result += convert_hundred(lakhs) + " Lakh "
        n %= 100000

    # Thousands
    thousands = n // 1000
    if thousands > 0:
        result += convert_hundred(thousands) + " Thousand "
        n %= 1000

    # Hundreds and below
    if n > 0:
        result += convert_hundred(n)

    return result.strip() + " Rupees Only"


class SalaryService:
    def _get_base_monthly_salary(self, designation: str, role: str) -> float:
        desig_lower = (designation or "").lower()
        if "lead" in desig_lower or role == "admin":
            return 65000.0
        elif "supervisor" in desig_lower or role == "supervisor":
            return 42000.0
        elif "head" in desig_lower:
            return 45000.0
        elif "senior" in desig_lower:
            return 34000.0
        else:
            return 28000.0

    async def get_monthly_payroll_summary(self, month: int, year: int, site_id: Optional[str] = None) -> PayrollSummaryOut:
        employees_col = get_collection("employees")
        attendance_col = get_collection("attendance")

        # Fetch employees (exclude system admin)
        emp_query: Dict[str, Any] = {"role": {"$ne": "admin"}}
        if site_id and site_id != "all":
            emp_query["$or"] = [{"assignedSiteId": site_id}, {"assignedSiteIds": site_id}]

        employees = await employees_col.find(emp_query).sort("employeeId", 1).to_list(200)
        if not employees:
            users_col = get_collection("users")
            employees = await users_col.find({"role": {"$ne": "admin"}}).to_list(200)

        month_prefix = f"{year}-{month:02d}"
        att_docs = await attendance_col.find({"date": {"$regex": f"^{month_prefix}"}}).to_list(5000)

        # Map attendance by employeeId
        emp_att_map: Dict[str, List[Dict[str, Any]]] = {}
        for doc in att_docs:
            eid = doc.get("employeeId")
            if eid:
                emp_att_map.setdefault(eid, []).append(doc)

        num_days_in_month = calendar.monthrange(year, month)[1]

        # Calculate sundays in this month
        sundays_count = sum(1 for d in range(1, num_days_in_month + 1) if datetime(year, month, d).weekday() == 6)
        paid_holidays_count = 2  # Standard Adani paid festival holidays

        records: List[MonthlyPayrollRecord] = []
        total_gross = 0.0
        total_net = 0.0
        total_ded = 0.0

        for emp in employees:
            eid = emp.get("employeeId")
            name = emp.get("name", "Field Technician")
            desig = emp.get("designation", "Field Technician")
            role = emp.get("role", "technician")
            site_name = emp.get("assignedSiteName", "Assigned Grid")

            emp_records = emp_att_map.get(eid, [])
            present_days = 0.0
            half_days = 0
            late_count = 0
            absent_days = 0

            for r in emp_records:
                st = r.get("status", "Present")
                if st in ["Present", "Checked Out"]:
                    present_days += 1.0
                elif st == "Late":
                    present_days += 1.0
                    late_count += 1
                elif st == "Half Day":
                    half_days += 1
                    present_days += 0.5
                elif st == "Absent":
                    absent_days += 1

            # If no attendance records seeded yet for employee, generate realistic baseline
            if not emp_records:
                present_days = float(max(18, num_days_in_month - sundays_count - 3))
                late_count = 2
                half_days = 1
                absent_days = num_days_in_month - sundays_count - paid_holidays_count - int(present_days)

            base_salary = self._get_base_monthly_salary(desig, role)
            daily_rate = base_salary / num_days_in_month
            paid_days = present_days + sundays_count + paid_holidays_count
            paid_days = min(paid_days, float(num_days_in_month))

            earned_gross = round(daily_rate * paid_days, 2)
            pf = round((base_salary * 0.5) * 0.12, 2) # 12% of basic
            esic = round(earned_gross * 0.0075, 2) # 0.75% of gross
            pt = 200.0 # Standard Professional Tax in Maharashtra/Gujarat
            late_penalty = late_count * 100.0 # 100 INR token deduction per late

            deductions = round(pf + esic + pt + late_penalty, 2)
            net_pay = round(max(0.0, earned_gross - deductions), 2)

            total_gross += earned_gross
            total_net += net_pay
            total_ded += deductions

            records.append(MonthlyPayrollRecord(
                employeeId=eid,
                employeeName=name,
                designation=desig,
                assignedSiteName=site_name,
                month=month,
                year=year,
                monthName=MONTH_NAMES[month],
                totalDays=num_days_in_month,
                presentDays=present_days,
                halfDays=half_days,
                absentDays=absent_days,
                lateCount=late_count,
                paidDays=paid_days,
                grossSalary=earned_gross,
                totalDeductions=deductions,
                netSalary=net_pay,
                paymentStatus="Processed"
            ))

        return PayrollSummaryOut(
            month=month,
            year=year,
            monthName=MONTH_NAMES[month],
            totalEmployees=len(records),
            totalGrossPayroll=round(total_gross, 2),
            totalNetPayout=round(total_net, 2),
            totalDeductions=round(total_ded, 2),
            records=records
        )

    async def generate_salary_slip(self, employee_id: str, month: int, year: int) -> SalarySlipOut:
        employees_col = get_collection("employees")
        users_col = get_collection("users")
        attendance_col = get_collection("attendance")

        emp = await employees_col.find_one({"employeeId": employee_id})
        if not emp:
            emp = await users_col.find_one({"employeeId": employee_id})
        if not emp:
            emp = {
                "employeeId": employee_id,
                "name": f"Employee {employee_id}",
                "designation": "Field Technician",
                "circle": "Maharashtra Circle",
                "division": "Pune Division",
                "assignedSiteName": "Pune - Phase 1",
                "role": "technician"
            }

        num_days = calendar.monthrange(year, month)[1]
        sundays_count = sum(1 for d in range(1, num_days + 1) if datetime(year, month, d).weekday() == 6)
        working_days = num_days - sundays_count

        month_prefix = f"{year}-{month:02d}"
        att_docs = await attendance_col.find({
            "employeeId": employee_id,
            "date": {"$regex": f"^{month_prefix}"}
        }).to_list(100)

        present_days = 0.0
        half_days = 0
        late_count = 0
        absent_days = 0

        for r in att_docs:
            st = r.get("status", "Present")
            if st in ["Present", "Checked Out"]:
                present_days += 1.0
            elif st == "Late":
                present_days += 1.0
                late_count += 1
            elif st == "Half Day":
                half_days += 1
                present_days += 0.5
            elif st == "Absent":
                absent_days += 1

        if not att_docs:
            present_days = float(max(20, working_days - 2))
            late_count = 1
            half_days = 1
            absent_days = 1

        paid_leaves = 2
        total_paid_days = min(float(num_days), present_days + sundays_count + paid_leaves)

        base_salary = self._get_base_monthly_salary(emp.get("designation", ""), emp.get("role", ""))

        # Itemized Earnings Breakdown
        basic = round(base_salary * 0.50, 2)
        hra = round(base_salary * 0.30, 2)
        conveyance = round(base_salary * 0.10, 2)
        field_allowance = round(base_salary * 0.10, 2)
        gross_earnings = round(basic + hra + conveyance + field_allowance, 2)

        # Prorate if loss of pay occurred
        unpaid_days = max(0.0, float(num_days) - total_paid_days)
        daily_rate = gross_earnings / num_days
        lop_deduction = round(daily_rate * unpaid_days, 2)

        # Deductions
        pf = round(basic * 0.12, 2)
        esic = round(gross_earnings * 0.0075, 2)
        pt = 200.0
        late_penalty = late_count * 100.0

        total_deductions = round(pf + esic + pt + lop_deduction + late_penalty, 2)
        net_salary = round(max(0.0, gross_earnings - total_deductions), 2)
        net_words = num_to_words(int(net_salary))

        slip_id = f"PAY-{year}{month:02d}-{employee_id.replace('/', '')}"

        return SalarySlipOut(
            id=slip_id,
            employeeId=employee_id,
            employeeName=emp.get("name", "Employee"),
            designation=emp.get("designation", "Field Technician"),
            circle=emp.get("circle", "Maharashtra Circle"),
            division=emp.get("division", "Pune Division"),
            assignedSiteName=emp.get("assignedSiteName", "Pune - Phase 1"),
            month=month,
            year=year,
            monthName=MONTH_NAMES[month],
            uan="101298456721",
            pfNumber="MH/PUN/0087421/000/0192",
            panNumber="ABCDE1234F",
            bankAccount="•••• •••• •••• 4821",
            bankName="State Bank of India",
            attendance={
                "totalDaysInMonth": num_days,
                "workingDays": working_days,
                "presentDays": present_days,
                "halfDays": half_days,
                "paidLeaves": paid_leaves,
                "absentDays": absent_days,
                "lateArrivals": late_count
            },
            basicSalary=basic,
            hra=hra,
            conveyanceAllowance=conveyance,
            fieldAllowance=field_allowance,
            grossEarnings=gross_earnings,
            providentFund=pf,
            esic=esic,
            professionalTax=pt,
            lopDeduction=round(lop_deduction + late_penalty, 2),
            totalDeductions=total_deductions,
            netSalary=net_salary,
            netSalaryWords=net_words,
            paymentStatus="Paid",
            paymentDate=f"28-{month:02d}-{year}",
            generatedAt=get_ist_now().strftime("%d-%b-%Y %I:%M %p")
        )

    async def upload_slip_record(self, req: UploadSlipRequest) -> Dict[str, Any]:
        col = get_collection("uploaded_slips")
        doc_id = f"slip_{uuid.uuid4().hex[:10]}"
        now_str = get_ist_now().isoformat()
        doc = {
            "id": doc_id,
            "_id": doc_id,
            "employeeId": req.employeeId,
            "month": req.month,
            "year": req.year,
            "amount": req.amount,
            "notes": req.notes,
            "documentName": req.documentName or f"Salary_Slip_{req.month}_{req.year}.pdf",
            "uploadedAt": now_str
        }
        if col is not None:
            await col.insert_one(doc)
        clean = dict(doc)
        if "_id" in clean:
            del clean["_id"]
        return clean

salary_service = SalaryService()
