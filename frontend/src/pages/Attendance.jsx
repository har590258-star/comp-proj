import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  Building2,
  MapPin,
  Clock,
  Check,
  CheckCircle2,
  LogOut,
  Navigation,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import HolidayModal, { downloadHolidayPdfFile } from '../components/ui/HolidayModal';
import { Download } from 'lucide-react';

const Attendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const [details, setDetails] = useState({
    status: 'Not Checked In',
    checkInTime: '--',
    checkOutTime: '--',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    siteName: user?.assignedSiteName || 'Pune - Phase 1',
    siteAddress: 'Hinjewadi, Pune, Maharashtra',
    checkInLocation: '--',
    checkOutLocation: '--',
    workingHours: '--',
  });

  const [elapsedFormatted, setElapsedFormatted] = useState('--');

  useEffect(() => {
    fetchTodayData();
  }, [user]);

  // Live timer for hours worked after check-in
  useEffect(() => {
    if (details.status !== 'Present' || !details.checkInTime || details.checkInTime === '--') {
      if (details.checkOutTime && details.checkOutTime !== '--') {
        setElapsedFormatted(details.workingHours || 'Completed');
      } else {
        setElapsedFormatted('--');
      }
      return;
    }

    const updateTimer = () => {
      try {
        const timeStr = details.checkInTime;
        const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return;
        let [_, h, m, meridiem] = match;
        let hours = parseInt(h, 10);
        const mins = parseInt(m, 10);
        if (meridiem) {
          meridiem = meridiem.toUpperCase();
          if (meridiem === 'PM' && hours < 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
        }

        const checkInDate = new Date();
        if (details.date) {
          const parts = details.date.split('-');
          if (parts.length === 3) {
            checkInDate.setFullYear(
              parseInt(parts[0], 10),
              parseInt(parts[1], 10) - 1,
              parseInt(parts[2], 10)
            );
          }
        }
        checkInDate.setHours(hours, mins, 0, 0);

        const now = new Date();
        const diffSec = Math.max(0, Math.floor((now.getTime() - checkInDate.getTime()) / 1000));
        const hrs = Math.floor(diffSec / 3600);
        const remMin = Math.floor((diffSec % 3600) / 60);
        const remSec = diffSec % 60;
        setElapsedFormatted(
          `${String(hrs).padStart(2, '0')}h ${String(remMin).padStart(2, '0')}m ${String(remSec).padStart(2, '0')}s`
        );
      } catch (err) {
        console.error('Attendance timer error:', err);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [details.status, details.checkInTime, details.date, details.checkOutTime, details.workingHours]);

  const fetchTodayData = async () => {
    try {
      const res = await api.get(`/attendance/today?employeeId=${user?.employeeId || 'EMP001'}`);
      if (res.data && res.data.checkInTime) {
        setDetails({
          status: res.data.status || 'Present',
          checkInTime: res.data.checkInTime,
          checkOutTime: res.data.checkOutTime || '--',
          date: res.data.date || new Date().toISOString().split('T')[0],
          siteName: res.data.siteName || user?.assignedSiteName || 'Pune - Phase 1',
          siteAddress: 'Hinjewadi, Pune, Maharashtra',
          checkInLocation: res.data.checkInLocation
            ? `${res.data.checkInLocation.latitude.toFixed(6)}, ${res.data.checkInLocation.longitude.toFixed(6)}`
            : '--',
          checkOutLocation: res.data.checkOutLocation
            ? `${res.data.checkOutLocation.latitude.toFixed(6)}, ${res.data.checkOutLocation.longitude.toFixed(6)}`
            : '--',
          workingHours: res.data.workingHours || 'In Progress',
        });
      } else {
        setDetails((prev) => ({
          ...prev,
          status: 'Not Checked In',
          checkInTime: '--',
          checkOutTime: '--',
          workingHours: '--',
        }));
      }
    } catch (e) {
      console.warn('Real-world status fetch notice:', e);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Header matching Screen 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl text-slate-700 hover:text-slate-900 bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Today's Attendance Status
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Daily verified shift audit & telemetry summary
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowHolidayModal(true)}
            className="bg-white text-sm font-bold px-4 py-2 border-brand-200 text-brand-700 hover:bg-brand-50 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Holidays 2026 (PDF)</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/history')}
            className="bg-white text-sm font-bold px-4 py-2"
          >
            View Full History
          </Button>
        </div>
      </div>

      {/* Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Top Banner & Key Attributes Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Green Banner Card matching Screen 5 */}
          <div className="bg-emerald-600 rounded-3xl p-7 text-white shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-md flex-shrink-0">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {details.status}
                </h3>
                <div className="mt-2 space-y-1.5 text-sm sm:text-base text-emerald-100 font-semibold">
                  <p>Checked In: {details.checkInTime || '--'}</p>
                  <p>Checked Out: {details.checkOutTime || '--'}</p>
                  {details.status === 'Present' && (
                    <div className="flex items-center gap-2 pt-1 text-white">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                      <span>Hours Worked:</span>
                      <span className="font-mono font-black text-white bg-black/25 px-2.5 py-0.5 rounded-lg tracking-wider">
                        {elapsedFormatted}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Key-Value Attributes Card matching Screen 5 */}
          <Card className="divide-y divide-slate-100 p-0 overflow-hidden shadow-card border-slate-200">
            {/* Date */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3.5 text-slate-600">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span className="text-base font-semibold">Date</span>
              </div>
              <span className="text-base font-bold text-slate-900">{details.date}</span>
            </div>

            {/* Site */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3.5 text-slate-600">
                <Building2 className="w-5 h-5 text-slate-500" />
                <span className="text-base font-semibold">Site</span>
              </div>
              <span className="text-base font-bold text-slate-900">{details.siteName}</span>
            </div>

            {/* Location (Check In) */}
            <div className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Location (Check In)</span>
              </div>
              <span className="text-sm font-mono font-medium text-slate-800">
                {details.checkInLocation}
              </span>
            </div>

            {/* Location (Check Out) */}
            <div className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Location (Check Out)</span>
              </div>
              <span className="text-sm font-mono font-medium text-slate-800">
                {details.checkOutLocation}
              </span>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-3 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <StatusBadge status={details.status} />
            </div>

            {/* Working Hours with Live Timer */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-50/60">
              <div className="flex items-center gap-3 text-slate-600">
                <Clock className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-semibold text-slate-800">Working Hours</span>
              </div>
              <span className="text-base font-bold text-brand-600 font-mono flex items-center gap-2">
                {details.status === 'Present' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700 font-black">{elapsedFormatted} (Live)</span>
                  </>
                ) : (
                  details.workingHours
                )}
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Shift Audit Trail & Site Context */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Shift Timeline
            </h4>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-100" />
                <p className="text-xs font-bold text-slate-900">Shift Started (Checked In)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{details.checkInTime} • Substation Hinjewadi</p>
                <p className="text-[10px] font-mono text-emerald-600 mt-0.5">{details.checkInLocation}</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100" />
                <p className="text-xs font-bold text-slate-900">Active Field Survey</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Smart meter sector telemetry online</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-100" />
                <p className="text-xs font-bold text-slate-900">Shift Finalized (Checked Out)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{details.checkOutTime || 'Pending Check-Out'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={() => navigate('/check-out')}
                className="bg-brand-500 text-xs font-semibold"
              >
                Go to Shift Check-Out
              </Button>
              <Button
                variant="outline"
                fullWidth
                size="md"
                onClick={() => navigate('/site')}
                className="text-xs font-semibold"
              >
                View Assigned Site Details
              </Button>
              <Button
                variant="outline"
                fullWidth
                size="md"
                onClick={() => setShowHolidayModal(true)}
                className="text-xs font-semibold flex items-center justify-center gap-2 border-emerald-300 text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Holiday Calendar 2026 (PDF)</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <HolidayModal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
      />
    </div>
  );
};

export default Attendance;
