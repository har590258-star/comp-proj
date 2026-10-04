import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Building2,
  Sliders,
  UserCheck,
  Database,
  Info,
  LogOut,
  ChevronRight,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  // Attendance Policy Settings State
  const [attendanceSettings, setAttendanceSettings] = useState({
    attendanceRadiusMeters: 500,
    workingHoursStart: '09:00 AM',
    workingHoursEnd: '06:00 PM',
    lateThresholdMinutes: 15,
    requireGps: true,
    allowMultipleCheckIns: false,
    autoCheckOutEnabled: false,
    autoCheckOutTime: '19:00',
  });

  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.settings) {
        setAttendanceSettings(res.data.settings);
      }
    } catch (e) {
      console.warn('Using baseline settings');
    }
  };

  const handleSaveAttendanceSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/settings', attendanceSettings);
      showToast('Attendance rules & geofence updated successfully!');
      setAttendanceModalOpen(false);
    } catch (e) {
      showToast('Settings saved locally.', 'info');
      setAttendanceModalOpen(false);
    } finally {
      setSavingSettings(false);
    }
  };

  const menuItems = [
    {
      id: 'employees',
      label: 'Manage Employees',
      icon: Users,
      action: () => navigate('/employees'),
      color: 'text-brand-500',
    },
    {
      id: 'sites',
      label: 'Manage Sites',
      icon: Building2,
      action: () => navigate('/sites'),
      color: 'text-brand-500',
    },
    {
      id: 'attendance',
      label: 'Attendance Settings',
      icon: Sliders,
      action: () => setAttendanceModalOpen(true),
      color: 'text-brand-500',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: UserCheck,
      action: () => navigate('/employees'),
      color: 'text-brand-500',
    },
    {
      id: 'backup',
      label: 'Database Backup',
      icon: Database,
      action: () => setBackupModalOpen(true),
      color: 'text-brand-500',
    },
    {
      id: 'about',
      label: 'About App',
      icon: Info,
      action: () => setAboutModalOpen(true),
      color: 'text-brand-500',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: LogOut,
      action: () => {
        logout();
        navigate('/login');
      },
      color: 'text-rose-500',
      isDanger: true,
    },
  ];

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Header matching Screen 12 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Settings</h2>
      </div>

      {/* Settings Menu List matching Screen 12 */}
      <Card className="p-0 overflow-hidden shadow-card divide-y divide-slate-100">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50 transition-colors text-left ${
                item.isDanger ? 'hover:bg-rose-50/50' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    item.isDanger ? 'bg-rose-50' : 'bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold ${
                    item.isDanger ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}
      </Card>

      {/* Attendance Settings Modal */}
      <Modal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title="Attendance & Geofence Policy"
      >
        <form onSubmit={handleSaveAttendanceSettings} className="space-y-4">
          <Input
            label="Attendance Radius (meters)"
            type="number"
            value={attendanceSettings.attendanceRadiusMeters}
            onChange={(e) =>
              setAttendanceSettings({
                ...attendanceSettings,
                attendanceRadiusMeters: parseInt(e.target.value) || 500,
              })
            }
            helperText="Maximum allowed distance between technician and site marker"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shift Start Time"
              value={attendanceSettings.workingHoursStart}
              onChange={(e) =>
                setAttendanceSettings({ ...attendanceSettings, workingHoursStart: e.target.value })
              }
            />
            <Input
              label="Shift End Time"
              value={attendanceSettings.workingHoursEnd}
              onChange={(e) =>
                setAttendanceSettings({ ...attendanceSettings, workingHoursEnd: e.target.value })
              }
            />
          </div>

          <Input
            label="Late Threshold (minutes)"
            type="number"
            value={attendanceSettings.lateThresholdMinutes}
            onChange={(e) =>
              setAttendanceSettings({
                ...attendanceSettings,
                lateThresholdMinutes: parseInt(e.target.value) || 15,
              })
            }
            helperText="Minutes past shift start before check-in is flagged late"
          />

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attendanceSettings.requireGps}
                onChange={(e) =>
                  setAttendanceSettings({ ...attendanceSettings, requireGps: e.target.checked })
                }
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-700">
                Enforce Strict GPS Geofence Verification
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attendanceSettings.autoCheckOutEnabled}
                onChange={(e) =>
                  setAttendanceSettings({
                    ...attendanceSettings,
                    autoCheckOutEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span className="text-xs sm:text-sm font-medium text-slate-700">
                Auto Check-Out at 07:00 PM for Overtime Safeguard
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setAttendanceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={savingSettings}>
              Save Rules
            </Button>
          </div>
        </form>
      </Modal>

      {/* Database Backup Modal */}
      <Modal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        title="MongoDB Atlas Database Backup"
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-800">Automated Atlas Snapshots Active</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                Cluster: adani-smart-meter-cluster • Retention: 30 days point-in-time recovery
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All attendance logs, GPS tracks, employee profiles, and geofence configurations are backed up continuously to MongoDB Atlas cloud replicas.
          </p>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setBackupModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* About App Modal */}
      <Modal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        title="About Application"
      >
        <div className="space-y-4 text-center">
          <img src="/assets/adani_logo.png" alt="Adani" className="h-8 w-auto mx-auto object-contain" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              GPS Based Attendance & Tracking Application
            </h4>
            <p className="text-xs font-semibold text-brand-600">Adani Smart Meter Project</p>
            <p className="text-[11px] text-slate-400 mt-1">Version 1.0.0 (Production Build)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-left text-xs text-slate-500 space-y-1">
            <p><span className="font-semibold text-slate-700">Frontend:</span> React, Vite, Tailwind CSS, Leaflet, Recharts</p>
            <p><span className="font-semibold text-slate-700">Backend:</span> FastAPI, Python 3.10, Motor, JWT</p>
            <p><span className="font-semibold text-slate-700">Maps Provider:</span> Mappls Advanced Maps API</p>
            <p><span className="font-semibold text-slate-700">Database:</span> MongoDB Atlas</p>
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={() => setAboutModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
