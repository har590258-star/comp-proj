import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Table,
  List,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import { LoadingSpinner, EmptyState } from '../components/ui/FeedbackStates';
import { useToast } from '../components/ui/Toast';

const OFFICIAL_HOLIDAYS_2026_SET = new Set([
  '2026-01-26',
  '2026-03-04',
  '2026-03-19',
  '2026-05-01',
  '2026-08-15',
  '2026-09-25',
  '2026-10-02',
  '2026-10-20',
  '2026-11-08',
  '2026-11-09',
]);

const Reports = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const firstDayOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastDayOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const todayStr = formatLocalDate(now);

  const [viewMode, setViewMode] = useState('muster'); // 'muster' | 'detailed'
  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(lastDayOfMonth);
  const [selectedSite, setSelectedSite] = useState('all');

  const [sites, setSites] = useState([
    { label: 'All Sites', value: 'all' },
    { label: 'Pune - Phase 1', value: 'site_pune_1' },
    { label: 'Pune - Phase 2', value: 'site_pune_2' },
    { label: 'Mumbai - Central Hub', value: 'site_mumbai_1' },
    { label: 'Surat ST-1', value: 'site_2949e4fc' },
  ]);

  const [employeesList, setEmployeesList] = useState([]);

  const [reportSummary, setReportSummary] = useState({
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    checkedOutCount: 0,
    averageWorkingHours: '0h 00m',
    complianceRate: '0%',
  });

  const [reportRows, setReportRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchSites();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate, selectedSite]);

  const fetchSites = async () => {
    try {
      const res = await api.get('/sites');
      if (res.data && res.data.length > 0) {
        const siteOpts = [
          { label: 'All Sites', value: 'all' },
          ...res.data.map((s) => ({ label: s.name, value: s.id })),
        ];
        setSites(siteOpts);
      }
    } catch (e) {
      console.warn('Could not fetch sites list:', e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data && res.data.length > 0) {
        // Filter only field technicians, excluding admin role
        const techsOnly = res.data.filter((e) => e.role !== 'admin' && e.employeeId !== 'ADMIN01');
        setEmployeesList(techsOnly.length > 0 ? techsOnly : res.data);
      }
    } catch (e) {
      console.warn('Could not fetch employees list:', e);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const yVal = parseInt(fromDate.split('-')[0], 10) || 2026;
      const mVal = parseInt(fromDate.split('-')[1], 10) || 10;
      const res = await api.get(
        `/reports/attendance?fromDate=${fromDate}&toDate=${toDate}&siteId=${selectedSite}&month=${mVal}&year=${yVal}`
      );
      if (res.data) {
        if (res.data.summary) setReportSummary(res.data.summary);
        if (res.data.records) {
          const mapped = res.data.records.map((r) => ({
            id: r.id || r._id,
            date: r.date,
            employeeId: r.employeeId,
            name: r.employeeName || 'Field Technician',
            site: r.siteName || 'Assigned Site',
            status: r.status,
            checkIn: r.checkInTime || '--',
            checkOut: r.checkOutTime || '--',
            hours: r.workingHours || '--',
          }));
          setReportRows(mapped);
        } else {
          setReportRows([]);
        }
      }
    } catch (e) {
      console.warn('Error fetching reports data:', e);
      setReportRows([]);
    } finally {
      setLoading(false);
    }
  };

  // 1. Primary Muster Roll Excel Export (Matching the exact template)
  const handleExportMusterRollExcel = async () => {
    try {
      setDownloading(true);
      showToast('Generating Monthly Attendance Muster Roll Excel...', 'info');

      const yVal = parseInt(fromDate.split('-')[0], 10) || 2026;
      const mVal = parseInt(fromDate.split('-')[1], 10) || 10;

      // Attempt server-side openpyxl generation for exact template layout
      const response = await api.get(
        `/reports/export-excel?fromDate=${fromDate}&toDate=${toDate}&siteId=${selectedSite}&month=${mVal}&year=${yVal}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `b4S_Attendance_Muster_Roll_${yVal}_${String(mVal).padStart(2, '0')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Attendance Muster Roll Excel downloaded successfully!', 'info');
    } catch (err) {
      console.warn('Backend excel export failed, falling back to client-side generator:', err);
      // Fallback: Generate the exact template using SheetJS client-side
      generateClientSideMusterRoll();
    } finally {
      setDownloading(false);
    }
  };

  // Client-side fallback generator that produces the exact template columns
  const generateClientSideMusterRoll = () => {
    try {
      const year = parseInt(fromDate.split('-')[0], 10) || 2026;
      const month = parseInt(fromDate.split('-')[1], 10) || 10;
      const daysInMonth = new Date(year, month, 0).getDate();

      const emps = employeesList.length > 0 ? employeesList : [
        { employeeId: 'EMP001', name: 'Rohit Sharma', assignedSiteName: 'Surat ST-1' },
        { employeeId: 'EMP002', name: 'Amit Kumar', assignedSiteName: 'Pune - Phase 1' },
        { employeeId: 'EMP003', name: 'Sandeep Yadav', assignedSiteName: 'Pune - Phase 2' },
        { employeeId: 'EMP004', name: 'Vikash Singh', assignedSiteName: 'Pune - Phase 2' },
        { employeeId: 'EMP005', name: 'Neha Patil', assignedSiteName: 'Pune - Phase 1' },
      ];

      // Build day columns map for each employee
      const matrixRows = [];
      emps.forEach((emp, idx) => {
        const row = {
          'SR. NO.': idx + 1,
          'Employee Code': emp.employeeId,
          'Employee Name': emp.name,
          'LOCATION': emp.assignedSiteName || 'Site Location',
        };

        let pCount = 0;
        let wopCount = 0;
        let aCount = 0;
        let odCount = 0;
        let woCount = 0;
        let plCount = 0;
        let phCount = 0;

        for (let d = 1; d <= 31; d++) {
          if (d > daysInMonth) {
            row[d] = '';
            continue;
          }
          const dt = new Date(year, month - 1, d);
          const dtStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isSun = dt.getDay() === 0;
          const isHol = OFFICIAL_HOLIDAYS_2026_SET.has(dtStr);

          // Check report rows for this employee and date
          const matchRec = reportRows.find((r) => r.employeeId === emp.employeeId && r.date === dtStr);
          let code = '-';

          if (matchRec) {
            const st = matchRec.status;
            if (st === 'Present' || st === 'Checked Out') code = 'P';
            else if (st === 'Absent') code = 'A';
            else if (st === 'On Duty') code = 'OD';
            else if (st === 'Weekly Off') code = 'WO';
            else if (st === 'Holiday') code = 'PH';
            else if (st === 'Leave') code = 'PL';
            else code = 'P';
          } else {
            if (isHol) code = 'PH';
            else if (isSun) code = 'WO';
            else if (dtStr < todayStr) code = 'A';
            else code = '-';
          }

          row[d] = code;
          if (code === 'P') pCount++;
          else if (code === 'WOP') wopCount++;
          else if (code === 'A') aCount++;
          else if (code === 'OD') odCount++;
          else if (code === 'WO') woCount++;
          else if (code === 'PL') plCount++;
          else if (code === 'PH') phCount++;
        }

        row['P'] = pCount;
        row['WOP'] = wopCount;
        row['A'] = aCount;
        row['OD'] = odCount;
        row['WO'] = woCount;
        row['PL'] = plCount;
        row['PH'] = phCount;
        row['Total'] = pCount + wopCount + odCount + woCount + plCount + phCount;

        matrixRows.push(row);
      });

      const worksheet = XLSX.utils.json_to_sheet(matrixRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      XLSX.writeFile(workbook, `b4S_Attendance_Muster_Roll_${fromDate}_to_${toDate}.xlsx`);

      showToast('Attendance Muster Roll Excel generated successfully!', 'info');
    } catch (e) {
      showToast('Export failed: ' + e.message, 'error');
    }
  };

  // 2. Secondary Detailed Telemetry Log Export
  const handleExportDetailedLog = () => {
    if (reportRows.length === 0) {
      showToast('No report records to export for this period.', 'warning');
      return;
    }
    try {
      const dataToExport = reportRows.map((r) => ({
        'Date': r.date,
        'Employee ID': r.employeeId,
        'Employee Name': r.name,
        'Site': r.site,
        'Status': r.status,
        'Check-In': r.checkIn,
        'Check-Out': r.checkOut,
        'Working Hours': r.hours,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Logs');
      XLSX.writeFile(workbook, `Detailed_Attendance_Logs_${fromDate}_to_${toDate}.xlsx`);

      showToast('Detailed logs Excel exported successfully!', 'info');
    } catch (err) {
      showToast('Failed to export detailed log.', 'error');
    }
  };

  // Compute on-screen muster roll matrix data
  const targetYear = parseInt(fromDate.split('-')[0], 10) || 2026;
  const targetMonth = parseInt(fromDate.split('-')[1], 10) || 10;
  const daysInCurrentMonth = new Date(targetYear, targetMonth, 0).getDate();

  const matrixEmployees = employeesList.length > 0 ? employeesList : [
    { employeeId: 'EMP001', name: 'Rohit Sharma', assignedSiteName: 'Surat ST-1' },
    { employeeId: 'EMP002', name: 'Amit Kumar', assignedSiteName: 'Pune - Phase 1' },
    { employeeId: 'EMP003', name: 'Sandeep Yadav', assignedSiteName: 'Pune - Phase 2' },
    { employeeId: 'EMP004', name: 'Vikash Singh', assignedSiteName: 'Pune - Phase 2' },
    { employeeId: 'EMP005', name: 'Neha Patil', assignedSiteName: 'Pune - Phase 1' },
    { employeeId: 'EMP700', name: 'Harsh Parmar', assignedSiteName: 'Ahmedabad - Solar Phase 1' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors border border-slate-200"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Reports & Attendance Muster Roll
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Monthly 1-31 attendance register sheets, shift audit logs, and formatted Excel exports
            </p>
          </div>
        </div>

        {/* Dual Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={handleExportDetailedLog}
            disabled={reportRows.length === 0}
            className="text-xs font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Detailed Logs</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleExportMusterRollExcel}
            loading={downloading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-sm flex items-center gap-2 px-4 py-2.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Muster Roll (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 sm:p-5 shadow-sm border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-slate-700 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
            <Filter className="w-4 h-4 text-brand-600" />
            <span>Report Parameters & Date Filter</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFromDate('2026-10-01');
                setToDate('2026-10-31');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                targetMonth === 10 && targetYear === 2026
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs ring-1 ring-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ✓ Current Month: October 2026
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate('2026-09-01');
                setToDate('2026-09-30');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                targetMonth === 9 && targetYear === 2026
                  ? 'bg-brand-50 text-brand-700 border-brand-300 shadow-xs ring-1 ring-brand-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              September 2026
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Deployment Location / Site</label>
            <Select
              options={sites}
              value={selectedSite}
              onChange={(val) => setSelectedSite(val)}
              className="text-xs sm:text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-sm border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Shift Records</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{reportSummary.totalRecords}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Logged shift records</p>
        </Card>
        <Card className="p-4 shadow-sm border-slate-200">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Present Count</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{reportSummary.presentCount}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Verified on-site shifts</p>
        </Card>
        <Card className="p-4 shadow-sm border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Shift Hours</p>
          <p className="text-2xl font-black text-brand-600 mt-1">{reportSummary.averageWorkingHours}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Shift average</p>
        </Card>
        <Card className="p-4 shadow-sm border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance Rate</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{reportSummary.complianceRate}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Geofence fidelity score</p>
        </Card>
      </div>

      {/* View Mode Toggle: Muster Roll Matrix vs Detailed Logs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('muster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              viewMode === 'muster'
                ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Muster Roll Matrix (Template View)</span>
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              viewMode === 'detailed'
                ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Detailed Shift Activity Logs</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-semibold px-2">
          {viewMode === 'muster'
            ? 'Format matches the downloaded Excel register'
            : `${reportRows.length} activity instances`}
        </div>
      </div>

      {/* Content Based on View Mode */}
      {viewMode === 'muster' ? (
        /* --- MUSTER ROLL MATRIX VIEW --- */
        <Card className="p-0 overflow-hidden shadow-card border-slate-200">
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/b4s_logo.png"
                alt="b4S Solutions"
                className="h-10 w-auto bg-white p-1 rounded-xl shadow-xs shrink-0 object-contain"
              />
              <div>
                <p className="text-xs font-bold text-brand-300 uppercase tracking-widest">
                  Official Register Preview
                </p>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                  ATTENDANCE FOR THE MONTH OF {new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  b4S SOLUTIONS PVT. LTD. • LOCATION: {selectedSite === 'all' ? 'All Locations' : (sites.find((s) => s.value === selectedSite)?.label || selectedSite)}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExportMusterRollExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-[11px] sm:text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                  <th className="py-2.5 px-3 text-left w-12 sticky left-0 bg-slate-800 z-10">SR.</th>
                  <th className="py-2.5 px-3 text-left min-w-[120px] sticky left-12 bg-slate-800 z-10">Employee Code</th>
                  <th className="py-2.5 px-3 text-left min-w-[160px]">Employee Name</th>
                  <th className="py-2.5 px-3 text-left min-w-[140px]">LOCATION</th>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <th
                      key={d}
                      className={`py-2 px-1.5 min-w-[28px] ${
                        d > daysInCurrentMonth ? 'opacity-30 bg-slate-900' : ''
                      }`}
                    >
                      {d}
                    </th>
                  ))}
                  <th className="py-2 px-2 bg-blue-900 text-white min-w-[32px]">P</th>
                  <th className="py-2 px-2 bg-blue-900 text-white min-w-[32px]">WOP</th>
                  <th className="py-2 px-2 bg-blue-900 text-white min-w-[32px]">A</th>
                  <th className="py-2 px-2 bg-blue-900 text-white min-w-[32px]">OD</th>
                  <th className="py-2 px-2 bg-blue-900 text-white min-w-[32px]">WO</th>
                  <th className="py-2 px-2 bg-blue-900 text-white min-w-[32px]">PL</th>
                  <th className="py-2 px-2 bg-blue-900 text-white min-w-[32px]">PH</th>
                  <th className="py-2 px-2 bg-indigo-950 text-emerald-300 font-extrabold min-w-[42px]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {matrixEmployees.map((emp, idx) => {
                  let p = 0;
                  let wop = 0;
                  let a = 0;
                  let od = 0;
                  let wo = 0;
                  let pl = 0;
                  let ph = 0;

                  return (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-left font-mono font-bold text-slate-500 sticky left-0 bg-white z-10">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 text-left font-mono font-extrabold text-slate-900 sticky left-12 bg-white z-10">
                        {emp.employeeId}
                      </td>
                      <td className="py-2 px-3 text-left font-bold text-slate-800">
                        {emp.name}
                      </td>
                      <td className="py-2 px-3 text-left text-slate-600 text-[11px]">
                        {emp.assignedSiteName || 'Pune - Phase 1'}
                      </td>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                        if (d > daysInCurrentMonth) {
                          return <td key={d} className="bg-slate-50 text-slate-300">-</td>;
                        }

                        const dt = new Date(targetYear, targetMonth - 1, d);
                        const dtStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSun = dt.getDay() === 0;
                        const isHol = OFFICIAL_HOLIDAYS_2026_SET.has(dtStr);

                        const matchRec = reportRows.find(
                          (r) => r.employeeId === emp.employeeId && r.date === dtStr
                        );

                        let code = '';
                        if (matchRec) {
                          const st = matchRec.status;
                          if (st === 'Present' || st === 'Checked Out') code = 'P';
                          else if (st === 'Absent') code = 'A';
                          else if (st === 'On Duty') code = 'OD';
                          else if (st === 'Weekly Off') code = 'WO';
                          else if (st === 'Holiday') code = 'PH';
                          else if (st === 'Leave') code = 'PL';
                          else code = 'P';
                        } else {
                          if (isHol) code = 'PH';
                          else if (isSun) code = 'WO';
                          else if (dtStr < todayStr) code = 'A';
                          else if (dtStr === todayStr) code = '-';
                          else code = '';
                        }

                        if (code === 'P') p++;
                        else if (code === 'WOP') wop++;
                        else if (code === 'A') a++;
                        else if (code === 'OD') od++;
                        else if (code === 'WO') wo++;
                        else if (code === 'PL') pl++;
                        else if (code === 'PH') ph++;

                        return (
                          <td
                            key={d}
                            className={`py-1.5 px-1 font-mono font-bold text-center border-x border-slate-100 ${
                              code === 'P'
                                ? 'text-emerald-700 bg-emerald-50/50'
                                : code === 'A'
                                ? 'text-rose-700 bg-rose-50/40'
                                : code === 'WO'
                                ? 'text-blue-700 bg-blue-50/40'
                                : code === 'PH'
                                ? 'text-amber-700 bg-amber-50/60 font-black'
                                : code === 'OD'
                                ? 'text-purple-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {code}
                          </td>
                        );
                      })}
                      <td className="py-2 px-1.5 font-bold font-mono text-emerald-700 bg-slate-50">{p}</td>
                      <td className="py-2 px-1.5 font-bold font-mono text-slate-700 bg-slate-50">{wop}</td>
                      <td className="py-2 px-1.5 font-bold font-mono text-rose-700 bg-slate-50">{a}</td>
                      <td className="py-2 px-1.5 font-bold font-mono text-purple-700 bg-slate-50">{od}</td>
                      <td className="py-2 px-1.5 font-bold font-mono text-blue-700 bg-slate-50">{wo}</td>
                      <td className="py-2 px-1.5 font-bold font-mono text-slate-700 bg-slate-50">{pl}</td>
                      <td className="py-2 px-1.5 font-bold font-mono text-amber-700 bg-slate-50">{ph}</td>
                      <td className="py-2 px-1.5 font-black font-mono text-slate-900 bg-emerald-50/60">
                        {p + wop + od + wo + pl + ph}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-3 font-medium">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700">Legend:</span>
              <span className="text-emerald-700 font-bold">P = Present</span>
              <span className="text-blue-700 font-bold">WO = Weekly Off</span>
              <span className="text-amber-700 font-bold">PH = Public Holiday</span>
              <span className="text-rose-700 font-bold">A = Absent</span>
              <span className="text-purple-700 font-bold">OD = On Duty</span>
              <span className="text-slate-600 font-bold">PL = Leave</span>
              <span className="text-slate-600 font-bold">WOP = Without Pay</span>
            </div>
            <span>Calculated over {daysInCurrentMonth} days in {new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          </div>
        </Card>
      ) : (
        /* --- DETAILED ACTIVITY LOGS VIEW --- */
        <Card className="p-0 overflow-hidden shadow-card">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Generated Attendance Shift Logs</h3>
            <span className="text-xs text-slate-500">{reportRows.length} entries</span>
          </div>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="Filtering and generating report logs..." />
            </div>
          ) : reportRows.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <EmptyState
                title="No report records found"
                description="No attendance data was found matching the selected date range and site filters. Try selecting a broader date range or record live shifts."
              />
            </div>
          ) : (
            <>
              {/* Desktop Data Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Site</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Hours</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">{r.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{r.name}</td>
                        <td className="py-3 px-4 text-slate-600">{r.site}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{r.checkIn}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{r.checkOut}</td>
                        <td className="py-3 px-4 text-slate-700">{r.hours}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={r.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="sm:hidden divide-y divide-slate-100">
                {reportRows.map((r) => (
                  <div key={r.id} className="p-4 space-y-2 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{r.name}</span>
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Site:</span>
                        <span className="font-medium text-slate-700">{r.site}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium text-slate-700">{r.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hours:</span>
                        <span className="font-semibold text-brand-600">{r.hours}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                        <span>In: {r.checkIn}</span>
                        <span>Out: {r.checkOut}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default Reports;
