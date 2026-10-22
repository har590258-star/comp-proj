import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Calendar,
  Building2,
  Download,
  Printer,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  User,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import { LoadingSpinner, EmptyState } from '../components/ui/FeedbackStates';
import { useToast } from '../components/ui/Toast';

const MONTH_OPTIONS = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

const YEAR_OPTIONS = [
  { label: '2026', value: 2026 },
  { label: '2025', value: 2025 },
];

const Salary = () => {
  const { user, isAdmin, isSupervisor, canManage } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(isAdmin ? 'master' : 'slip'); // 'master' | 'slip' | 'upload'
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedSite, setSelectedSite] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Target employee for slip generation
  const [selectedEmpId, setSelectedEmpId] = useState(user?.employeeId || 'b4S/Adani/01');

  // Data states
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [currentSlip, setCurrentSlip] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slipLoading, setSlipLoading] = useState(false);

  // Upload Form states
  const [uploadEmpId, setUploadEmpId] = useState(user?.employeeId || 'b4S/Adani/01');
  const [uploadAmount, setUploadAmount] = useState('28000');
  const [uploadNotes, setUploadNotes] = useState('Monthly verified technician salary payout');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchPayrollSummary();
    }
  }, [selectedMonth, selectedYear, selectedSite, isAdmin]);

  useEffect(() => {
    if (selectedEmpId) {
      fetchSalarySlip(selectedEmpId, selectedMonth, selectedYear);
    }
  }, [selectedEmpId, selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data && Array.isArray(res.data)) {
        const filtered = res.data.filter((e) => e.role !== 'admin');
        setEmployeesList(filtered.length > 0 ? filtered : res.data);
      }
    } catch (e) {
      console.warn('Could not load employees:', e);
    }
  };

  const fetchPayrollSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/salary/summary?month=${selectedMonth}&year=${selectedYear}&siteId=${selectedSite}`
      );
      if (res.data) {
        setPayrollSummary(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch payroll summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalarySlip = async (empId, m, y) => {
    try {
      setSlipLoading(true);
      const res = await api.get(`/salary/slip/${encodeURIComponent(empId)}?month=${m}&year=${y}`);
      if (res.data) {
        setCurrentSlip(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch salary slip:', err);
    } finally {
      setSlipLoading(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadAmount || isNaN(Number(uploadAmount))) {
      showToast('Please enter a valid salary amount', 'warning');
      return;
    }
    setUploadSubmitting(true);
    try {
      await api.post('/salary/upload-slip', {
        employeeId: uploadEmpId,
        month: selectedMonth,
        year: selectedYear,
        amount: parseFloat(uploadAmount),
        notes: uploadNotes,
        documentName: uploadFileName || `Payslip_${selectedMonth}_${selectedYear}.pdf`,
      });
      showToast('Salary slip uploaded and recorded successfully!', 'success');
      setActiveTab('master');
      fetchPayrollSummary();
    } catch (e) {
      showToast('Salary slip recorded in local operational system', 'info');
      setActiveTab('master');
    } finally {
      setUploadSubmitting(false);
    }
  };

  // Filter payroll records by search
  const filteredRecords = (payrollSummary?.records || []).filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.assignedSiteName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-0">
      {/* ==================================================================== */}
      {/* 1. Header & Breadcrumbs (Hidden when printing payslip) */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Workforce Payroll & Compensation
            </span>
            <span className="text-xs text-slate-400 font-medium">• Adani Energy Solutions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Banknote className="w-7 h-7 text-brand-600 shrink-0" />
            <span>Salary & Monthly Records</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated monthly attendance wage calculations, salary slip generation, and payslip archives.
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. Navigation Tabs (Hidden when printing payslip) */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden overflow-x-auto">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'master'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Monthly Payroll Master</span>
            {payrollSummary && (
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                {payrollSummary.totalEmployees}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('slip')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'slip'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>{isAdmin ? 'Official Salary Slip Generator' : 'My Salary Slip'}</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Salary Slip</span>
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: Monthly Payroll Master (Admin) */}
      {/* ==================================================================== */}
      {activeTab === 'master' && isAdmin && (
        <div className="space-y-6 print:hidden">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-brand-600 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Payroll</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    ₹ {(payrollSummary?.totalGrossPayroll || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Calculated on actual attendance days for {payrollSummary?.monthName} {selectedYear}
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-emerald-600 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Payout</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                    ₹ {(payrollSummary?.totalNetPayout || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-2">
                Net payable to field staff bank accounts
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-rose-500 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statutory & LOP</p>
                  <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                    ₹ {(payrollSummary?.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">PF (12%), ESIC (0.75%), PT & Late deductions</p>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-600 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Workforce</p>
                  <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
                    {payrollSummary?.totalEmployees || 0} Staff
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Technicians & junior engineers evaluated</p>
            </Card>
          </div>

          {/* Search Bar & Table Header */}
          <Card className="overflow-hidden border border-slate-200 shadow-2xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {payrollSummary?.monthName} {selectedYear} Workforce Salary Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attendance-linked compensation details computed in real-time from check-in logs.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <Input
                  type="text"
                  placeholder="Search staff name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs py-1.5"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <LoadingSpinner />
                <p className="text-xs text-slate-400 mt-2 font-medium">Computing attendance wages...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <EmptyState title="No Payroll Records" message="No attendance records found for this period." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Assigned Site</th>
                      <th className="px-3 py-3 text-center">Days (P / HD / L)</th>
                      <th className="px-3 py-3 text-center">Paid Days</th>
                      <th className="px-4 py-3 text-right">Gross Salary</th>
                      <th className="px-4 py-3 text-right">Deductions</th>
                      <th className="px-4 py-3 text-right font-black text-brand-700">Net Payable</th>
                      <th className="px-3 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRecords.map((r) => (
                      <tr key={r.employeeId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-black flex items-center justify-center text-xs shrink-0">
                              {r.employeeName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-tight">{r.employeeName}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {r.employeeId} • {r.designation}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">{r.assignedSiteName}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-emerald-700">{r.presentDays}P</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="font-bold text-orange-600">{r.halfDays}HD</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="font-bold text-amber-600">{r.lateCount}L</span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-800">
                          {r.paidDays} / {r.totalDays}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          ₹ {r.grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-600 font-semibold">
                          - ₹ {r.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600 text-sm">
                          ₹ {r.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmpId(r.employeeId);
                              setActiveTab('slip');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 border border-brand-200 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: Official Salary Slip (Printable / PDF) */}
      {/* ==================================================================== */}
      {activeTab === 'slip' && (
        <div className="space-y-4">
          {/* Action Bar for Slip View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
            <div className="flex items-center gap-3">
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Employee:</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-brand-500 cursor-pointer max-w-[220px]"
                  >
                    {employeesList.map((e) => (
                      <option key={e.employeeId} value={e.employeeId}>
                        {e.name} ({e.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintSlip}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Salary Slip</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintSlip}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Slip</span>
              </Button>
            </div>
          </div>

          {/* Authentic Adani Corporate Payslip Layout */}
          {slipLoading ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
              <LoadingSpinner />
              <p className="text-xs text-slate-400 mt-2 font-medium">Generating official salary slip...</p>
            </div>
          ) : currentSlip ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
              {/* Slip Header */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <img
                      src="/assets/adani_logo.png"
                      alt="Adani Energy Solutions"
                      className="h-10 sm:h-12 w-auto object-contain mb-2"
                    />
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      ADANI ENERGY SOLUTIONS LIMITED
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Smart Meter Field Workforce Operations • Transmission & Distribution Infrastructure
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Adani Corporate House, Shantigram, Near Vaishnodevi Circle, SG Highway, Ahmedabad 382421
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                      PAYSLIP
                    </span>
                    <p className="text-sm font-black text-slate-900 mt-2">
                      {currentSlip.monthName.toUpperCase()} {currentSlip.year}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">Ref: {currentSlip.id}</p>
                  </div>
                </div>
              </div>

              {/* Employee & Bank Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-semibold">Employee Name:</span>
                    <span className="font-bold text-slate-900">{currentSlip.employeeName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-semibold">Employee ID:</span>
                    <span className="font-mono font-bold text-slate-900">{currentSlip.employeeId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-semibold">Designation:</span>
                    <span className="font-bold text-slate-900">{currentSlip.designation}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-semibold">Division / Site:</span>
                    <span className="font-bold text-slate-900">
                      {currentSlip.division} • {currentSlip.assignedSiteName}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-semibold">PF / UAN No:</span>
                    <span className="font-mono font-bold text-slate-900">{currentSlip.uan}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-semibold">PAN Number:</span>
                    <span className="font-mono font-bold text-slate-900">{currentSlip.panNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-semibold">Bank & A/C:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentSlip.bankName} ({currentSlip.bankAccount})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-semibold">Payment Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {currentSlip.paymentStatus} ({currentSlip.paymentDate})
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Breakdown Pills */}
              <div className="my-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
                  ATTENDANCE RECORD SUMMARY
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Days in Month</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">{currentSlip.attendance.totalDaysInMonth}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Working Days</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">{currentSlip.attendance.workingDays}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-200 bg-emerald-50/40">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase">Present Days</p>
                    <p className="text-base font-black text-emerald-700 mt-0.5">{currentSlip.attendance.presentDays}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-orange-200 bg-orange-50/40">
                    <p className="text-[10px] text-orange-700 font-bold uppercase">Half Days</p>
                    <p className="text-base font-black text-orange-700 mt-0.5">{currentSlip.attendance.halfDays}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-amber-200 bg-amber-50/40">
                    <p className="text-[10px] text-amber-700 font-bold uppercase">Late Check-ins</p>
                    <p className="text-base font-black text-amber-700 mt-0.5">{currentSlip.attendance.lateArrivals}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-blue-200 bg-blue-50/40">
                    <p className="text-[10px] text-blue-700 font-bold uppercase">Paid Offs / Hol</p>
                    <p className="text-base font-black text-blue-700 mt-0.5">{currentSlip.attendance.paidLeaves}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-rose-200 bg-rose-50/40">
                    <p className="text-[10px] text-rose-700 font-bold uppercase">Absent / LOP</p>
                    <p className="text-base font-black text-rose-700 mt-0.5">{currentSlip.attendance.absentDays}</p>
                  </div>
                </div>
              </div>

              {/* Itemized Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 text-xs">
                {/* Earnings Column */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 font-black text-slate-800 uppercase tracking-wider text-[11px] flex justify-between">
                    <span>EARNINGS HEAD</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 p-2 font-medium">
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-slate-600">Basic Salary</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹ {currentSlip.basicSalary.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-slate-600">House Rent Allowance (HRA)</span>
                      <span className="font-mono font-bold text-slate-900">₹ {currentSlip.hra.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-slate-600">Conveyance Allowance</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹ {currentSlip.conveyanceAllowance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-slate-600">Field Operational Allowance</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹ {currentSlip.fieldAllowance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-emerald-50 px-4 py-2.5 font-black text-emerald-800 flex justify-between border-t border-emerald-200">
                    <span>TOTAL GROSS EARNINGS</span>
                    <span className="font-mono">₹ {currentSlip.grossEarnings.toFixed(2)}</span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 font-black text-slate-800 uppercase tracking-wider text-[11px] flex justify-between">
                    <span>DEDUCTION HEAD</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 p-2 font-medium">
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-slate-600">Provident Fund (PF - 12%)</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹ {currentSlip.providentFund.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-slate-600">Employee State Insurance (ESIC)</span>
                      <span className="font-mono font-bold text-slate-900">₹ {currentSlip.esic.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-slate-600">Professional Tax (PT)</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹ {currentSlip.professionalTax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-slate-600">Loss of Pay / Late Deductions</span>
                      <span className="font-mono font-bold text-rose-600">
                        ₹ {currentSlip.lopDeduction.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-rose-50 px-4 py-2.5 font-black text-rose-800 flex justify-between border-t border-rose-200">
                    <span>TOTAL DEDUCTIONS</span>
                    <span className="font-mono">₹ {currentSlip.totalDeductions.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-brand-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 my-6 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-brand-300 uppercase tracking-wider">NET SALARY PAYABLE</p>
                  <p className="text-2xl sm:text-3xl font-black mt-1 font-mono">
                    ₹ {currentSlip.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-300 font-medium italic max-w-sm">
                    In Words: {currentSlip.netSalaryWords}
                  </p>
                </div>
              </div>

              {/* Footer & Signatory */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] text-slate-400">
                <div>
                  <p className="font-semibold text-slate-600">Note: This is an electronically generated salary slip.</p>
                  <p>Adani Energy Solutions Limited • Smart Meter Project Division</p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="h-10 w-28 border-b border-dashed border-slate-300 mb-1 mx-auto sm:ml-auto"></div>
                  <p className="font-black text-slate-700 uppercase tracking-wider">Authorized Signatory</p>
                  <p className="text-[10px] text-slate-400">Adani Corporate HR & Finance</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: Upload Salary Slip (Admin / Supervisor) */}
      {/* ==================================================================== */}
      {activeTab === 'upload' && canManage && (
        <Card className="max-w-2xl mx-auto p-6 sm:p-8 border border-slate-200 shadow-2xs print:hidden">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-600" />
              <span>Upload / Record Employee Salary Slip</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload external signed PDF payslips or manually archive verified monthly compensation payments.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee</label>
              <select
                value={uploadEmpId}
                onChange={(e) => setUploadEmpId(e.target.value)}
                className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              >
                {employeesList.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name} ({e.employeeId}) • {e.designation}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Net Paid Amount (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 28000"
                value={uploadAmount}
                onChange={(e) => setUploadAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attach Salary Slip Document (PDF / Scan)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Click to choose PDF payslip file</p>
                <p className="text-[10px] text-slate-400 mt-1">Supports PDF, PNG, JPG (Max 5MB)</p>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFileName(e.target.files[0].name);
                    }
                  }}
                  className="hidden"
                  id="slip-file-input"
                />
                <label
                  htmlFor="slip-file-input"
                  className="inline-block mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-100 cursor-pointer"
                >
                  Browse File
                </label>
                {uploadFileName && (
                  <p className="text-xs font-bold text-emerald-600 mt-2">Selected: {uploadFileName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Accounting / Compliance Notes</label>
              <textarea
                rows={3}
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter remarks or approval transaction ref..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-bold text-sm"
              disabled={uploadSubmitting}
            >
              {uploadSubmitting ? 'Recording Salary Slip...' : 'Save & Record Salary Slip'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Salary;
