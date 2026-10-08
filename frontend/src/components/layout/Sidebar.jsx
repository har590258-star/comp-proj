import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckCircle,
  LogOut as LogOutIcon,
  Calendar,
  MapPin,
  Building2,
  Users,
  FileBarChart2,
  Settings,
  Clock,
  Compass,
  Radio,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HolidayModal from '../ui/HolidayModal';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const technicianLinks = [
    { to: '/dashboard', label: 'Home / Dashboard', icon: LayoutDashboard },
    { to: '/check-in', label: 'Field Check In', icon: CheckCircle },
    { to: '/check-out', label: 'Shift Check Out', icon: LogOutIcon },
    { to: '/attendance', label: "Today's Status", icon: Clock },
    { to: '/history', label: 'Attendance History', icon: Calendar },
    { to: '/site', label: 'Assigned Sites', icon: Building2 },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/sites', label: 'Sites Management', icon: Building2 },
    { to: '/history', label: 'Attendance Logs', icon: Calendar },
    { to: '/reports', label: 'Reports & Export', icon: FileBarChart2 },
    { to: '/tracking', label: 'Location Tracking', icon: MapPin },
    { to: '/settings', label: 'Admin Settings', icon: Settings },
  ];

  const navLinks = isAdmin ? adminLinks : technicianLinks;

  return (
    <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-slate-200 sticky top-20 h-[calc(100vh-5rem)] p-5 flex-shrink-0 z-20 justify-between">
      <div className="space-y-3">
        <div className="px-3 pt-1 pb-1">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {isAdmin ? 'Operations Management' : 'Field Operations'}
          </p>
        </div>

        <nav className="space-y-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  group relative flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-bold transition-all duration-150
                  ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3.5">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span className="text-sm sm:text-base font-bold tracking-tight">{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-6 rounded-full bg-brand-500" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Site Info Card at bottom of sidebar */}
      <div className="pt-3 border-t border-slate-200 space-y-3">
        <button
          type="button"
          onClick={() => setShowHolidayModal(true)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />
            <span>Holidays 2026 (PDF)</span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
            10 Days
          </span>
        </button>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isAdmin ? 'Admin Console' : 'Field Operations'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">Active</span>
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">
            {user?.name || 'Rahul Sharma'}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {user?.assignedSiteName || 'Pune - Phase 1'}
          </p>
        </div>
      </div>

      <HolidayModal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
      />
    </aside>
  );
};

export default Sidebar;
