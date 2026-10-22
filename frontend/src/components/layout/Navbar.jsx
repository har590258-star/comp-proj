import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  User,
  ChevronDown,
  ShieldCheck,
  Wrench,
  LogOut,
  Radio,
  Bell,
  UserCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Banknote,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Navbar = ({ onOpenMobileMenu, isSyncing, lastSyncedAt }) => {
  const { user, isAdmin, isSupervisor, canManage, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 25000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=20');
      if (res.data) {
        setNotifications(res.data.items || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      // silent fallback
    }
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm print:hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Adani Energy Solutions Brand Logo & Title */}
          <div 
            onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group min-w-0 shrink-0"
          >
            <img 
              src="/assets/adani_logo.png" 
              alt="Adani Energy Solutions" 
              className="h-8 sm:h-10 md:h-11 lg:h-12 w-auto object-contain transition-transform group-hover:scale-105 shrink-0" 
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

        {/* Right: Notifications, Role Badge & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Notification Bell Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="relative p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 bg-slate-50 cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Alerts & Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications or alerts at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 transition-colors flex items-start gap-3 hover:bg-slate-50/80 cursor-pointer ${
                          !n.isRead ? 'bg-brand-50/30' : ''
                        }`}
                        onClick={(e) => !n.isRead && markAsRead(n.id, e)}
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'LATE_ATTENDANCE' ? (
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                          ) : n.type === 'GEOFENCE_BREACH' ? (
                            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                          ) : n.type === 'CHECK_OUT' || n.type === 'HALF_DAY' ? (
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-brand-600 flex items-center justify-center font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-normal mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Indicator Badge */}
          <div className="hidden md:flex items-center shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs sm:text-sm font-black shadow-xs whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
                <span>Admin Portal</span>
              </div>
            ) : isSupervisor ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-black shadow-xs whitespace-nowrap">
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                <span>Supervisor Portal</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-brand-700 text-xs sm:text-sm font-black shadow-xs whitespace-nowrap">
                <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600 shrink-0" />
                <span>Field Technician</span>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 bg-slate-50 shrink-0 cursor-pointer"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-black text-xs sm:text-sm shadow-xs shrink-0">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AD'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="font-extrabold text-slate-900 text-sm leading-tight">{user?.name || (canManage ? 'Adani Lead' : 'Field Tech')}</p>
                <p className="text-slate-500 text-xs font-bold leading-tight mt-0.5">{user?.designation || (canManage ? 'Operations' : 'Field Technician')}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block shrink-0" />
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
                  <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${isAdmin ? 'bg-purple-100 text-purple-700' : isSupervisor ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-brand-700'}`}>
                    {isAdmin ? 'Operations Admin' : isSupervisor ? 'Field Supervisor' : 'Field Technician'}
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
                        <span>Operations Dashboard</span>
                      </button>
                      <button
                        onClick={() => navigate('/salary')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <Banknote className="w-4 h-4 text-brand-500" />
                        <span>Salary & Monthly Records</span>
                      </button>
                      <button
                        onClick={() => navigate('/settings')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        System Settings
                      </button>
                    </>
                  ) : isSupervisor ? (
                    <>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Supervisor Dashboard</span>
                      </button>
                      <button
                        onClick={() => navigate('/sites')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <Building2 className="w-4 h-4 text-brand-600" />
                        <span>Site Management</span>
                      </button>
                      <button
                        onClick={() => navigate('/salary')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <Banknote className="w-4 h-4 text-brand-500" />
                        <span>My Salary & Payslips</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Technician Home
                      </button>
                      <button
                        onClick={() => navigate('/salary')}
                        className="w-full text-left px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <Banknote className="w-4 h-4 text-brand-500" />
                        <span>My Salary & Payslips</span>
                      </button>
                    </>
                  )}
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-5 py-2.5 text-xs sm:text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold cursor-pointer"
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
