import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, User, ChevronDown, ShieldCheck, Wrench, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onOpenMobileMenu, isSyncing, lastSyncedAt }) => {
  const { user, isAdmin, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Check-In Recorded', desc: 'Checked in at Pune - Phase 1', time: '10m ago', unread: true },
    { id: 2, title: 'Smart Meter Survey', desc: '14 new meters assigned in Sector 4', time: '1h ago', unread: false },
    { id: 3, title: 'Geofence Verified', desc: 'GPS accuracy optimal (<10m)', time: '2h ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Adani Energy Solutions Brand Logo & Title */}
          <div 
            onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            className="flex items-center gap-3 sm:gap-3.5 cursor-pointer group min-w-0 shrink-0"
          >
            <img 
              src="/assets/adani_logo.png" 
              alt="Adani Energy Solutions" 
              className="h-9 sm:h-10 md:h-11 lg:h-12 w-auto object-contain transition-transform group-hover:scale-105 shrink-0" 
            />
            <div className="hidden md:flex flex-col justify-center border-l-2 border-slate-200 pl-3 lg:pl-4 py-0.5 min-w-0">
              <h1 className="text-sm lg:text-base xl:text-lg font-black tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                <span className="md:inline lg:hidden">GPS Attendance</span>
                <span className="hidden lg:inline">GPS Based Attendance & Tracking</span>
              </h1>
              <p className="text-[10px] lg:text-xs font-bold text-brand-600 leading-tight mt-0.5 whitespace-nowrap">
                Adani Smart Meter Project
              </p>
            </div>
          </div>
        </div>

        {/* Right: Telemetry, Role Badge, Notifications & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Live System Telemetry Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isAdmin
                  ? 'bg-purple-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span>
              {isAdmin
                ? 'Fleet Telemetry Radar Online'
                : 'Field Portal Active'}
            </span>
          </div>

          {/* Authentic Role Indicator Badge (Derived from User Login) */}
          <div className="flex items-center shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs sm:text-sm font-black shadow-xs whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
                <span>Admin Portal</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-brand-700 text-xs sm:text-sm font-black shadow-xs whitespace-nowrap">
                <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600 shrink-0" />
                <span>Field Technician</span>
              </div>
            )}
          </div>

          {/* Notification bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div 
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Notifications</span>
                  <span className="text-xs text-brand-600 font-bold">3 unread</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-800">{n.title}</p>
                        <span className="text-xs text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 bg-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-black text-sm shadow-xs">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AD'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="font-extrabold text-slate-900 text-sm leading-tight">{user?.name || (isAdmin ? 'Adani Admin' : 'Field Tech')}</p>
                <p className="text-slate-500 text-xs font-bold leading-tight mt-0.5">{user?.designation || (isAdmin ? 'Operations Lead' : 'Field Technician')}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-5 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{user?.employeeId} • {user?.assignedSiteName || 'Adani Grid'}</p>
                  <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-brand-50 text-brand-700'}`}>
                    {isAdmin ? 'Operations Admin' : 'Field Technician'}
                  </span>
                </div>
                <div className="py-1.5">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => navigate('/admin')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-500" />
                        <span>Admin Dashboard</span>
                      </button>
                      <button
                        onClick={() => navigate('/settings')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        System Settings
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <Wrench className="w-4 h-4 text-brand-500" />
                        <span>Technician Home</span>
                      </button>
                      <button
                        onClick={() => navigate('/site')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Assigned Substation
                      </button>
                    </>
                  )}
                </div>
                <div className="border-t border-slate-100 pt-1.5">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-5 py-2.5 text-xs sm:text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
