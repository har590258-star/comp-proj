import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import Button from './Button';
import { useToast } from './Toast';

const STATUS_OPTIONS = [
  {
    id: 'Late',
    label: 'Late Arrival',
    desc: 'Technician arrived past grace period or shift start',
    color: 'border-amber-400 bg-amber-50 text-amber-900',
    badge: 'bg-amber-100 text-amber-800',
    icon: AlertCircle,
    defaultIn: '10:15 AM',
    defaultOut: '06:00 PM',
    defaultHours: '7h 45m',
  },
  {
    id: 'Half Day',
    label: 'Half Day',
    desc: 'Partial shift (less than 6 hours completed)',
    color: 'border-orange-400 bg-orange-50 text-orange-900',
    badge: 'bg-orange-100 text-orange-800',
    icon: Clock,
    defaultIn: '09:00 AM',
    defaultOut: '01:30 PM',
    defaultHours: '4h 30m',
  },
  {
    id: 'Present',
    label: 'Present (Full Day)',
    desc: 'Standard shift completed on site',
    color: 'border-emerald-400 bg-emerald-50 text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle,
    defaultIn: '09:00 AM',
    defaultOut: '06:00 PM',
    defaultHours: '9h 00m',
  },
  {
    id: 'Absent',
    label: 'Absent',
    desc: 'Unexcused or unpaid leave of absence',
    color: 'border-rose-400 bg-rose-50 text-rose-900',
    badge: 'bg-rose-100 text-rose-800',
    icon: AlertTriangle,
    defaultIn: '--',
    defaultOut: '--',
    defaultHours: '0h 00m',
  },
];

const ManualAttendanceModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    date: todayStr,
    status: 'Late',
    siteName: '',
    checkInTime: '10:15 AM',
    checkOutTime: '06:00 PM',
    workingHours: '7h 45m',
    remarks: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      const matchStatus = STATUS_OPTIONS.find(
        (o) => o.id.toLowerCase() === (initialData.status || '').toLowerCase()
      );
      setFormData({
        employeeId: initialData.employeeId || '',
        employeeName: initialData.employeeName || '',
        date: initialData.dateRaw || initialData.date || todayStr,
        status: matchStatus ? matchStatus.id : (initialData.status || 'Late'),
        siteName: initialData.site || initialData.siteName || '',
        checkInTime: initialData.checkIn || initialData.checkInTime || '10:15 AM',
        checkOutTime: initialData.checkOut || initialData.checkOutTime || '06:00 PM',
        workingHours: initialData.hours || initialData.workingHours || '7h 45m',
        remarks: initialData.remarks || `Status manually set to ${initialData.status || 'Late'} by Admin`,
      });
    } else {
      setFormData({
        employeeId: '',
        employeeName: '',
        date: todayStr,
        status: 'Late',
        siteName: '',
        checkInTime: '10:15 AM',
        checkOutTime: '06:00 PM',
        workingHours: '7h 45m',
        remarks: 'Late arrival authorized by Supervisor',
      });
    }
  }, [initialData, isOpen]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await api.get('/employees');
      if (Array.isArray(res.data)) {
        setEmployees(res.data);
        if (!initialData && res.data.length > 0 && !formData.employeeId) {
          const first = res.data[0];
          setFormData((prev) => ({
            ...prev,
            employeeId: first.employeeId,
            employeeName: first.name,
            siteName: first.assignedSiteName || 'Pune - Phase 1',
          }));
        }
      }
    } catch (e) {
      console.warn('Could not load employees for manual attendance modal:', e);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleStatusChange = (statusId) => {
    const opt = STATUS_OPTIONS.find((o) => o.id === statusId);
    if (!opt) return;

    setFormData((prev) => ({
      ...prev,
      status: opt.id,
      checkInTime: opt.defaultIn,
      checkOutTime: opt.defaultOut,
      workingHours: opt.defaultHours,
      remarks:
        opt.id === 'Late'
          ? 'Late arrival authorized by Supervisor'
          : opt.id === 'Half Day'
          ? 'Half Day approved due to early field departure'
          : opt.id === 'Present'
          ? 'Full shift manually verified by Admin'
          : 'Marked absent by Admin',
    }));
  };

  const handleEmployeeSelect = (empId) => {
    const emp = employees.find((e) => e.employeeId === empId);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        siteName: emp.assignedSiteName || prev.siteName || 'Pune - Phase 1',
      }));
    } else {
      setFormData((prev) => ({ ...prev, employeeId: empId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) {
      showToast('Please select a technician', 'error');
      return;
    }
    if (!formData.date) {
      showToast('Please select a shift date', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        employeeId: formData.employeeId,
        date: formData.date,
        status: formData.status,
        siteName: formData.siteName,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        workingHours: formData.workingHours,
        remarks: formData.remarks,
      };

      const res = await api.post('/attendance/manual-adjust', payload);
      if (res.data && res.data.success) {
        showToast(
          res.data.message || `Successfully marked as ${formData.status}`,
          'success'
        );
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        showToast('Failed to save manual attendance', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to adjust attendance';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-white to-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? 'Adjust Attendance Status' : 'Record Manual Attendance'}
              </h3>
              <p className="text-xs text-slate-500">
                Mark Late Arrival, Half Day, or Present for field technicians
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Status Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Attendance Status *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = formData.status === opt.id;
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleStatusChange(opt.id)}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? `${opt.color} shadow-sm ring-2 ring-brand-500/20`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                      <span className="text-xs sm:text-sm font-extrabold">{opt.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technician Selection & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Field Technician *
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              >
                <option value="">Select Technician</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shift Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Site Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Substation Site Name
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="e.g. Surat ST-1, Pune - Phase 1"
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Timings & Working Hours */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Check-In</label>
              <input
                type="text"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                placeholder="10:15 AM"
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Check-Out</label>
              <input
                type="text"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                placeholder="06:00 PM"
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Duration</label>
              <input
                type="text"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                placeholder="7h 45m"
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-brand-600 rounded-lg border border-slate-200 bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Admin Remarks / Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Remarks / Reason (Visible to Technician) *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                required
                placeholder="e.g. Shift delayed due to emergency maintenance, half day approved by operations manager..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              This note will be displayed directly on the technician's attendance page and history record.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
              className="bg-brand-500 text-xs font-semibold px-4 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : `Set as ${formData.status}`}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualAttendanceModal;
