import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, CheckCircle, LogOut as LogOutIcon, Calendar, Compass, Building2, Users, FileBarChart2, Settings, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileDrawer = ({ isOpen, onClose }) => {
  const { user, isAdmin, switchRole, logout } = useAuth();

  if (!isOpen) return null;

  const technicianLinks = [
    { to: '/dashboard', label: 'Home / Dashboard', icon: LayoutDashboard },
    { to: '/check-in', label: 'Check In', icon: CheckCircle },
    { to: '/check-out', label: 'Check Out', icon: LogOutIcon },
    { to: '/attendance', label: "Today's Status", icon: Calendar },
    { to: '/history', label: 'Attendance History', icon: Calendar },
    { to: '/site', label: 'Assigned Site', icon: Building2 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employee Management', icon: Users },
    { to: '/sites', label: 'Site Management', icon: Building2 },
    { to: '/history', label: 'Attendance Records', icon: Calendar },
    { to: '/reports', label: 'Reports & Export', icon: FileBarChart2 },
    { to: '/tracking', label: 'Location Tracking', icon: Compass },
    { to: '/settings', label: 'Admin Settings', icon: Settings },
  ];

  const links = isAdmin ? adminLinks : technicianLinks;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/adani_logo.png" alt="Adani" className="h-7 w-auto object-contain" />
            <div className="border-l border-slate-200 pl-2">
              <p className="text-[11px] font-bold text-slate-900 leading-tight">GPS Attendance</p>
              <p className="text-[9px] text-brand-600 font-medium">Smart Meter Project</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-800">{user?.name || 'Rahul Sharma'}</p>
          <p className="text-[11px] text-slate-500">{user?.designation || 'Field Technician'} • {user?.assignedSiteName || 'Pune - Phase 1'}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                switchRole(isAdmin ? 'technician' : 'admin');
                onClose();
              }}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-xs"
            >
              {isAdmin ? <Wrench className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Switch to {isAdmin ? 'Technician' : 'Admin'}</span>
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
