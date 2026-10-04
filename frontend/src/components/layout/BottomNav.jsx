import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  CheckCircle2,
  Calendar,
  MapPin,
  Building2,
  LayoutDashboard,
  Users,
  FileBarChart2,
  Radio,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
  const { isAdmin } = useAuth();

  const technicianTabs = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/check-in', label: 'Check In', icon: CheckCircle2 },
    { to: '/check-out', label: 'Check Out', icon: LogOut },
    { to: '/site', label: 'Assigned Site', icon: Building2 },
    { to: '/history', label: 'History', icon: Calendar },
  ];

  const adminTabs = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/sites', label: 'Sites', icon: Building2 },
    { to: '/tracking', label: 'Fleet Map', icon: MapPin },
    { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  ];

  const tabs = isAdmin ? adminTabs : technicianTabs;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg safe-area-pb">
      <div className={`grid ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} h-16 max-w-lg mx-auto`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center gap-1 transition-all duration-150 py-1
                ${
                  isActive
                    ? 'text-brand-600 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 w-8 h-1 bg-brand-600 rounded-b-full shadow-xs" />
                  )}
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-brand-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] leading-tight truncate max-w-full px-0.5 text-center">
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
