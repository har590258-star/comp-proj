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
  Banknote,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HolidayModal from '../ui/HolidayModal';

const Sidebar = () => {
  const { user, isAdmin, isSupervisor, canManage } = useAuth();
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const technicianLinks = [
    { to: '/dashboard', label: 'Home / Dashboard', icon: LayoutDashboard },
    { to: '/check-in', label: 'Field Check In', icon: CheckCircle },
    { to: '/check-out', label: 'Shift Check Out', icon: LogOutIcon },
    { to: '/attendance', label: "Today's Status", icon: Clock },
    { to: '/history', label: 'Attendance History', icon: Calendar },
    { to: '/salary', label: 'My Salary & Payslips', icon: Banknote },
  ];

  const supervisorLinks = [
    { to: '/dashboard', label: 'Home / Dashboard', icon: LayoutDashboard },
    { to: '/check-in', label: 'Field Check In', icon: CheckCircle },
    { to: '/check-out', label: 'Shift Check Out', icon: LogOutIcon },
    { to: '/attendance', label: "Today's Status", icon: Clock },
    { to: '/history', label: 'Attendance History', icon: Calendar },
    { to: '/sites', label: 'Site Management', icon: Building2 },
    { to: '/salary', label: 'My Salary & Payslips', icon: Banknote },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Operations Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/sites', label: 'Sites Management', icon: Building2 },
    { to: '/history', label: 'Attendance Logs', icon: Calendar },
    { to: '/reports', label: 'Reports & Export', icon: FileBarChart2 },
    { to: '/tracking', label: 'Location Tracking', icon: MapPin },
    { to: '/salary', label: 'Salary & Monthly Records', icon: Banknote },
    ...(isAdmin ? [{ to: '/settings', label: 'Admin Settings', icon: Settings }] : []),
  ];

  const navLinks = isAdmin ? adminLinks : isSupervisor ? supervisorLinks : technicianLinks;

  return (
    <aside className="hidden lg:flex lg:flex-col w-72 bg-white border-r border-slate-200 sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] flex-shrink-0 z-20 select-none">
      {/* Scrollable Upper Section: Category Header & Nav Links */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-2">
        <div className="px-2 pt-1 pb-1">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {isAdmin ? 'Operations Management' : isSupervisor ? 'Supervisor Field Operations' : 'Field Operations'}
          </p>
        </div>

        <nav className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                  ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span className="truncate tracking-tight">{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-4.5 rounded-full bg-brand-600 shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Fixed Bottom Section: Holidays Action & User Console Profile */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/60 space-y-2.5 shrink-0">
        <button
          type="button"
          onClick={() => setShowHolidayModal(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 shadow-2xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />
            <span>Holidays 2026 (PDF)</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
            10 Days
          </span>
        </button>

        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isAdmin ? 'Admin Console' : isSupervisor ? 'Supervisor Field' : 'Field Operations'}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active</span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate">
            {user?.name || (isAdmin ? 'Adani Operations Admin' : 'Rahul Sharma')}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {isAdmin ? 'Central Operations HQ' : (user?.assignedSiteName || 'Pune - Phase 1')}
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
