import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Filter, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import { LoadingSpinner, EmptyState } from '../components/ui/FeedbackStates';

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const now = new Date();
  const [activeTab, setActiveTab] = useState('monthly'); // 'daily' | 'weekly' | 'monthly'
  const [currentMonthIndex, setCurrentMonthIndex] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('ALL');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    }
  }, [isAdmin]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data && res.data.length > 0) {
        setEmployeesList(res.data);
      }
    } catch (e) {
      console.warn('Failed to load employees for filter');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, activeTab, currentMonthIndex, currentYear, selectedEmp]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const targetMonthStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
      const empIdParam = isAdmin ? selectedEmp : (user?.employeeId || 'EMP001');
      const res = await api.get(
        `/attendance/history?employeeId=${empIdParam}&filter_type=${activeTab}&month=${targetMonthStr}`
      );
      if (res.data && res.data.length > 0) {
        const formatted = res.data.map((r) => {
          let dateStr = r.date;
          try {
            const d = new Date(r.date);
            if (!isNaN(d.getTime())) {
              dateStr = `${d.getDate()} ${months[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
            }
          } catch (e) {}

          return {
            id: r.id || r._id,
            employeeId: r.employeeId,
            employeeName: r.employeeName || 'Field Technician',
            date: dateStr,
            status: r.status,
            site: r.siteName || user?.assignedSiteName || 'Assigned Site',
            checkIn: r.checkInTime || '--',
            checkOut: r.checkOutTime || '--',
            hours: r.workingHours || '--',
          };
        });
        setRecords(formatted);
      } else {
        setRecords([]);
      }
    } catch (e) {
      console.warn('Error fetching attendance history:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  return (
    <div className={`mx-auto space-y-5 ${isAdmin ? 'max-w-5xl' : 'max-w-2xl'}`}>
      {/* Header matching Screen 6 & Admin Sidebar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors border border-slate-200"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? 'Attendance Logs & Shifts' : 'Attendance History'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isAdmin
                ? 'Centralized shift check-in and check-out ledger across all technicians'
                : 'Official verified personal shift logs'}
            </p>
          </div>
        </div>

        {/* Admin Employee Filter */}
        {isAdmin && (
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500">Filter Technician:</span>
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Field Technicians</option>
              {employeesList.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Segmented Control / Tab Toggle matching Screen 6 */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl">
        {['daily', 'weekly', 'monthly'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl capitalize transition-all duration-150 ${
              activeTab === tab
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Date Navigation matching Screen 6 (< Current Month Year >) */}
      <Card className="flex items-center justify-between py-3 px-4 shadow-xs">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-bold text-slate-800">
            {months[currentMonthIndex]} {currentYear}
          </span>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </Card>

      {/* Attendance List / Table Container */}
      <Card className="p-0 overflow-hidden shadow-card divide-y divide-slate-100">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading attendance logs..." />
          </div>
        ) : records.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <EmptyState
              title="No attendance records found"
              description={`No shift activity recorded for ${months[currentMonthIndex]} ${currentYear}. Verified check-ins and check-outs will appear here.`}
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Date</th>
                    {isAdmin && <th className="py-3 px-5">Technician</th>}
                    <th className="py-3 px-5">Substation Site</th>
                    <th className="py-3 px-5">Check-In</th>
                    <th className="py-3 px-5">Check-Out</th>
                    <th className="py-3 px-5">Duration</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900 whitespace-nowrap">
                        {item.date}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900">{item.employeeName}</p>
                          <p className="text-[11px] font-mono text-slate-500">{item.employeeId}</p>
                        </td>
                      )}
                      <td className="py-3.5 px-5 text-slate-700 font-medium whitespace-nowrap">
                        {item.site}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {item.checkIn}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {item.checkOut && item.checkOut !== '--' ? item.checkOut : (
                          <span className="text-slate-400 italic">Active Shift</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-brand-600 font-bold whitespace-nowrap">
                        {item.hours}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AttendanceHistory;
