import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, ChevronDown, ShieldCheck, Wrench, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onOpenMobileMenu, isSyncing, lastSyncedAt }) => {
  const { user, isAdmin, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);


  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
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

        {/* Right: Role Badge & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Role Indicator Badge (Desktop & Tablet only to preserve mobile spacing) */}
          <div className="hidden md:flex items-center shrink-0">
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

          {/* Profile Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 bg-slate-50 shrink-0"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-black text-xs sm:text-sm shadow-xs shrink-0">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AD'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="font-extrabold text-slate-900 text-sm leading-tight">{user?.name || (isAdmin ? 'Adani Admin' : 'Field Tech')}</p>
                <p className="text-slate-500 text-xs font-bold leading-tight mt-0.5">{user?.designation || (isAdmin ? 'Operations Lead' : 'Field Technician')}</p>
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
