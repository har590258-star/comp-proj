from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.services.salary_service import salary_service
from app.schemas.salary import PayrollSummaryOut, SalarySlipOut, UploadSlipRequest
from datetime import datetime

router = APIRouter(prefix="/salary", tags=["Salary & Payroll Records"])

@router.get("/summary", response_model=PayrollSummaryOut)
async def get_monthly_payroll_summary(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2030),
    siteId: Optional[str] = Query(None)
):
    now = datetime.now()
    m = month or 10
    y = year or now.year
    return await salary_service.get_monthly_payroll_summary(month=m, year=y, site_id=siteId)

@router.get("/slip/{employee_id}", response_model=SalarySlipOut)
async def get_salary_slip(
    employee_id: str,
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2030)
):
    now = datetime.now()
    m = month or 10
    y = year or now.year
    return await salary_service.generate_salary_slip(employee_id=employee_id, month=m, year=y)

@router.post("/upload-slip")
async def upload_salary_slip(req: UploadSlipRequest):
    result = await salary_service.upload_slip_record(req)
    return {"success": True, "message": "Salary slip uploaded and recorded successfully", "slip": result}
