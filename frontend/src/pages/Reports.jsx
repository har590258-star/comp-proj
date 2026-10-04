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

const Reports = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [activeReportTab, setActiveReportTab] = useState('attendance'); // 'attendance' | 'location'
  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedSite, setSelectedSite] = useState('all');

  const [sites, setSites] = useState([
    { label: 'All Sites', value: 'all' },
    { label: 'Pune - Phase 1', value: 'site_pune_1' },
    { label: 'Pune - Phase 2', value: 'site_pune_2' },
    { label: 'Mumbai - Central Hub', value: 'site_mumbai_1' },
  ]);

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

  useEffect(() => {
    fetchSites();
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

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/reports/attendance?fromDate=${fromDate}&toDate=${toDate}&siteId=${selectedSite}`
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

  const handleExportExcel = () => {
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
      XLSX.writeFile(workbook, `Adani_Attendance_Report_${fromDate}_to_${toDate}.xlsx`);

      showToast('Excel report downloaded successfully!', 'info');
    } catch (err) {
      showToast('Failed to export Excel file. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Reports & Operational Audits
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Real-time attendance logs, compliance statistics, and Excel data exports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" onClick={handleExportExcel} disabled={reportRows.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Filter Toolbar matching Section 35 */}
      <Card className="p-4 sm:p-5 shadow-sm border-slate-200">
        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-xs sm:text-sm uppercase tracking-wider">
          <Filter className="w-4 h-4 text-brand-600" />
          <span>Report Filters</span>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Smart Meter Site</label>
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Records</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{reportSummary.totalRecords}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Shift instances</p>
        </Card>
        <Card className="p-4 shadow-sm border-slate-200">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Present Count</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{reportSummary.presentCount}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Verified on-site</p>
        </Card>
        <Card className="p-4 shadow-sm border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Shift Hours</p>
          <p className="text-2xl font-extrabold text-brand-600 mt-1">
            {reportSummary.averageWorkingHours}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across technicians</p>
        </Card>
        <Card className="p-4 shadow-sm border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance Rate</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{reportSummary.complianceRate}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Geofence fidelity</p>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="p-0 overflow-hidden shadow-card">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Generated Attendance Data</h3>
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
    </div>
  );
};

export default Reports;
