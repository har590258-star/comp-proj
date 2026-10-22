from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class EarningsItem(BaseModel):
    title: str
    amount: float

class DeductionsItem(BaseModel):
    title: str
    amount: float

class AttendanceBreakdown(BaseModel):
    totalDaysInMonth: int
    workingDays: int
    presentDays: float
    halfDays: int
    paidLeaves: int
    absentDays: int
    lateArrivals: int

class SalarySlipOut(BaseModel):
    id: str
    employeeId: str
    employeeName: str
    designation: str
    circle: str
    division: str
    assignedSiteName: str
    month: int
    year: int
    monthName: str
    uan: str = "101239845672"
    pfNumber: str = "MH/PUN/0087421/000/0192"
    panNumber: str = "ABCDE1234F"
    bankAccount: str = "•••• •••• •••• 4821"
    bankName: str = "HDFC Bank Ltd."
    attendance: AttendanceBreakdown
    basicSalary: float
    hra: float
    conveyanceAllowance: float
    fieldAllowance: float
    grossEarnings: float
    providentFund: float
    esic: float
    professionalTax: float
    lopDeduction: float
    totalDeductions: float
    netSalary: float
    netSalaryWords: str
    paymentStatus: str = "Paid"
    paymentDate: str = "30th of the month"
    generatedAt: str

class MonthlyPayrollRecord(BaseModel):
    employeeId: str
    employeeName: str
    designation: str
    assignedSiteName: str
    month: int
    year: int
    monthName: str
    totalDays: int
    presentDays: float
    halfDays: int
    absentDays: int
    lateCount: int
    paidDays: float
    grossSalary: float
    totalDeductions: float
    netSalary: float
    paymentStatus: str = "Processed"

class PayrollSummaryOut(BaseModel):
    month: int
    year: int
    monthName: str
    totalEmployees: int
    totalGrossPayroll: float
    totalNetPayout: float
    totalDeductions: float
    records: List[MonthlyPayrollRecord]

class UploadSlipRequest(BaseModel):
    employeeId: str
    month: int
    year: int
    amount: float
    notes: Optional[str] = None
    documentName: Optional[str] = None
    fileBase64: Optional[str] = None
