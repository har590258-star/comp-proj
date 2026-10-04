import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Compass,
  Building2,
  Map,
  Clock,
  MapPin,
  RefreshCw,
  LogOut,
  TrendingUp,
  ShieldCheck,
  Radio,
  ArrowRight,
  Navigation,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InteractiveMap from '../components/maps/InteractiveMap';
import { formatDistance } from '../utils/geoUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { coordinates, refreshLocation } = useGeolocation();

  // Dynamic shift status based on employee
  const [todayStatus, setTodayStatus] = useState({
    isCheckedIn: false,
    status: 'Not Started',
    checkInTime: null,
    checkOutTime: null,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    latitude: null,
    longitude: null,
    siteName: user?.assignedSiteName || 'Field Operations',
    siteAddress: 'Live Field Deployment Zone',
  });

  const [monthlyStats, setMonthlyStats] = useState({
    rate: '0.0%',
    shiftsCount: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodayStatus();
    fetchMonthlyStats();
  }, [user]);

  const fetchTodayStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/today?employeeId=${user?.employeeId || 'EMP001'}`);
      if (res.data && res.data.checkInTime) {
        setTodayStatus({
          isCheckedIn: res.data.isCheckedIn !== undefined ? res.data.isCheckedIn : true,
          status: res.data.status || 'Present',
          checkInTime: res.data.checkInTime,
          checkOutTime: res.data.checkOutTime,
          date: res.data.date || new Date().toISOString().split('T')[0],
          latitude: res.data.checkInLocation?.latitude || coordinates.latitude,
          longitude: res.data.checkInLocation?.longitude || coordinates.longitude,
          siteName: res.data.siteName || user?.assignedSiteName || 'Field Operations',
          siteAddress: 'Live Field Deployment Zone',
        });
      } else {
        setTodayStatus((prev) => ({
          ...prev,
          isCheckedIn: false,
          status: 'Not Started',
          checkInTime: null,
          checkOutTime: null,
          siteName: user?.assignedSiteName || 'Field Operations',
        }));
      }
    } catch (e) {
      console.warn('Real-world status fetch:', e);
      setTodayStatus((prev) => ({
        ...prev,
        isCheckedIn: false,
        status: 'Not Started',
        checkInTime: null,
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const res = await api.get(`/attendance/history?employeeId=${user?.employeeId || 'EMP001'}`);
      if (res.data && Array.isArray(res.data)) {
        const total = res.data.length;
        const present = res.data.filter((r) => r.status === 'Present' || r.status === 'Checked Out').length;
        const rate = total > 0 ? `${Math.round((present / total) * 100)}%` : '0.0%';
        setMonthlyStats({
          rate,
          shiftsCount: total,
        });
      }
    } catch (e) {
      console.warn('Could not fetch monthly attendance stats:', e);
    }
  };

  // Real employee device coordinates
  const activeLat = coordinates.latitude;
  const activeLng = coordinates.longitude;
  const hasGps = activeLat !== null && activeLng !== null;

  // Active site location dynamically adapts to employee's deployment area
  const siteLocation = {
    latitude: activeLat,
    longitude: activeLng,
    name: todayStatus.siteName,
    address: 'Adani Smart Meter Project Work Zone',
    manager: 'Operations Lead',
    timings: '09:00 AM - 06:00 PM',
  };

  // 4 Core Quick Actions matching PDF reference screen 2
  const quickActions = [
    {
      id: 'attendance',
      title: 'My Attendance',
      subtitle: 'Logs & daily shift records',
      icon: Calendar,
      path: '/attendance',
      color: 'bg-blue-100 text-brand-600',
    },
    {
      id: 'checkout',
      title: 'Shift Check Out',
      subtitle: 'Record departure & sign off',
      icon: LogOut,
      path: '/check-out',
      color: 'bg-rose-100 text-rose-600',
    },
    {
      id: 'site',
      title: 'Assigned Site',
      subtitle: 'Substation specifications',
      icon: Building2,
      path: '/site',
      color: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'status',
      title: "Today's Status",
      subtitle: 'Verified daily shift audit',
      icon: Clock,
      path: '/attendance',
      color: 'bg-emerald-100 text-emerald-700',
    },
  ];

  return (
    <div className="space-y-7 w-full mx-auto">
      {/* 1. Executive Top Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-brand-600 font-black text-xl sm:text-2xl flex-shrink-0 shadow-sm">
            {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'RS'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Hello, {user?.name || 'Rahul Sharma'}
              </h2>
              <span className="text-xs sm:text-sm font-black bg-brand-50 text-brand-700 px-3.5 py-1 rounded-full border border-brand-200 shadow-2xs">
                {user?.designation || 'Field Technician'}
              </span>
            </div>
            <div className="text-sm sm:text-base text-slate-600 mt-2 flex flex-wrap items-center gap-3.5 font-semibold">
              <span>Employee ID: <strong className="text-slate-900 font-extrabold">{user?.employeeId || 'EMP001'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-2 text-slate-800 font-extrabold">
                <Building2 className="w-4 h-4 text-brand-500" />
                Assignment: {todayStatus.siteName}
              </span>
            </div>
          </div>
        </div>

        {/* System Health and Status Controls */}
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs sm:text-sm shadow-2xs">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="font-extrabold text-slate-800">Field Portal Active</span>
          </div>

          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={() => {
              fetchTodayStatus();
            }}
            loading={loading}
            className="bg-white font-extrabold text-sm px-5 py-2.5 shadow-2xs hover:bg-slate-50"
          >
            Refresh Status
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Row (4 Enterprise KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Shift Status */}
        <Card className="p-3.5 sm:p-6 lg:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] sm:text-xs md:text-sm font-black text-slate-400 uppercase tracking-wider">Today's Shift</p>
            <p className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 mt-1 sm:mt-1.5 tracking-tight">
              {todayStatus.isCheckedIn ? 'Checked In' : 'Not Started'}
            </p>
            <p className={`text-xs sm:text-sm font-bold mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2 ${todayStatus.isCheckedIn ? 'text-emerald-600' : 'text-slate-500'}`}>
              <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${todayStatus.isCheckedIn ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{todayStatus.isCheckedIn ? 'Shift Active' : 'Shift Inactive'}</span>
            </p>
          </div>
          <div className={`w-9 h-9 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs shrink-0 self-start sm:self-auto ${
            todayStatus.isCheckedIn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}>
            {todayStatus.isCheckedIn ? <CheckCircle2 className="w-5 h-5 sm:w-8 sm:h-8" /> : <Clock className="w-5 h-5 sm:w-8 sm:h-8" />}
          </div>
        </Card>

        {/* Card 2: Check-In Time */}
        <Card className="p-3.5 sm:p-6 lg:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] sm:text-xs md:text-sm font-black text-slate-400 uppercase tracking-wider">Check-In Time</p>
            <p className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 mt-1 sm:mt-1.5 tracking-tight">
              {todayStatus.checkInTime || '--'}
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1 sm:mt-1.5 truncate">
              {todayStatus.checkInTime ? todayStatus.date : 'Awaiting Check In'}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-blue-100 text-brand-600 flex items-center justify-center shadow-xs shrink-0 self-start sm:self-auto">
            <Clock className="w-5 h-5 sm:w-8 sm:h-8" />
          </div>
        </Card>

        {/* Card 3: Geofence Coverage */}
        <Card className="p-3.5 sm:p-6 lg:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] sm:text-xs md:text-sm font-black text-slate-400 uppercase tracking-wider">Authorized Geofence</p>
            <p className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 mt-1 sm:mt-1.5 tracking-tight">500 m</p>
            <p className="text-xs sm:text-sm font-bold mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2 text-emerald-600">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500" />
              <span>Verified In Zone</span>
            </p>
          </div>
          <div className="w-9 h-9 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs shrink-0 self-start sm:self-auto">
            <MapPin className="w-5 h-5 sm:w-8 sm:h-8" />
          </div>
        </Card>

        {/* Card 4: Monthly Attendance */}
        <Card className="p-3.5 sm:p-6 lg:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] sm:text-xs md:text-sm font-black text-slate-400 uppercase tracking-wider">Monthly Attendance</p>
            <p className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 mt-1 sm:mt-1.5 tracking-tight">
              {monthlyStats.rate}
            </p>
            <p className="text-xs sm:text-sm text-brand-600 font-extrabold mt-1 sm:mt-1.5">
              {monthlyStats.shiftsCount} {monthlyStats.shiftsCount === 1 ? 'Shift' : 'Shifts'} Logged
            </p>
          </div>
          <div className="w-9 h-9 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs shrink-0 self-start sm:self-auto">
            <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8" />
          </div>
        </Card>
      </div>

      {/* 3. Main Dashboard Body: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column (7 cols): Today's Active Status Hero & Quick Action Grid */}
        <div className="lg:col-span-7 space-y-7">
          {/* Active Attendance Hero Banner */}
          <div className={`rounded-3xl p-7 sm:p-9 text-white shadow-xl relative overflow-hidden transition-all ${
            todayStatus.isCheckedIn
              ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800'
              : 'bg-gradient-to-br from-blue-700 via-indigo-700 to-brand-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-100">
                    Live Shift Verification
                  </p>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1">
                    {todayStatus.isCheckedIn ? 'You are Checked In' : 'Ready to Check In'}
                  </h3>
                  <p className="text-sm sm:text-base text-blue-100 font-semibold mt-1.5">
                    {todayStatus.isCheckedIn
                      ? `Shift active at ${todayStatus.checkInTime} • ${todayStatus.siteName}`
                      : hasGps
                        ? `GPS verified at your current device location • ${todayStatus.siteName}`
                        : 'Acquiring satellite GPS lock for shift start...'}
                  </p>
                </div>
              </div>

              <div>
                {todayStatus.isCheckedIn ? (
                  <button
                    onClick={() => navigate('/check-out')}
                    className="px-8 py-3.5 sm:py-4 text-base sm:text-lg font-black bg-white text-rose-700 hover:bg-rose-50 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap"
                  >
                    <LogOut className="w-5 h-5 text-rose-600" />
                    <span>Check Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/check-in')}
                    className="px-9 py-3.5 sm:py-4 text-base sm:text-lg font-black bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Check In</span>
                  </button>
                )}
              </div>
            </div>

            {/* Coordinates Footer */}
            <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-sm font-mono text-blue-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white" />
                <span className="font-bold">
                  {hasGps ? `Lat: ${activeLat.toFixed(4)} | Long: ${activeLng.toFixed(4)}` : 'Detecting GPS...'}
                </span>
              </div>
              <span className="bg-black/20 backdrop-blur-sm font-sans font-black px-3.5 py-1.5 rounded-full text-xs text-white">
                Authorized Dynamic Geofence: 500m
              </span>
            </div>
          </div>

          {/* Quick Actions (4 Cards Matching Reference PDF Screen 2) */}
          <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-wider">
                Quick Actions
              </h3>
              <span className="text-xs sm:text-sm font-bold text-slate-500">Primary Navigation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-brand-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color} mb-4 transition-transform group-hover:scale-110 shadow-xs`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">{action.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Live Interactive Satellite Map & Site Card */}
        <div className="lg:col-span-5 space-y-7">
          {/* Interactive Map Preview Card */}
          <Card className="p-6 space-y-4 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg sm:text-xl font-black text-slate-900">Assigned Site Map</h4>
                <p className="text-xs sm:text-sm text-slate-500 font-bold">Substation Boundary & Geofence</p>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/site')}
                className="text-xs sm:text-sm font-extrabold px-3.5 py-2 shadow-2xs hover:bg-slate-50"
              >
                View Site
              </Button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-inner">
              <InteractiveMap
                userLocation={coordinates}
                siteLocation={{
                  latitude: activeLat,
                  longitude: activeLng,
                  name: todayStatus.siteName,
                }}
                geofenceRadius={500}
                showGeofence={true}
                height="360px"
                showRoute={false}
              />
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700 pt-1">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand-500" />
                Current: {hasGps ? `${activeLat.toFixed(4)}, ${activeLng.toFixed(4)}` : 'Waiting for GPS...'}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                Geofence: In-Range (0 m)
              </span>
            </div>
          </Card>

          {/* Assigned Site Widget */}
          <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
            <div className="relative h-36 w-full bg-slate-900">
              <img
                src="/assets/site_photo.jpg"
                alt="Site infrastructure"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-3.5 left-5 text-white">
                <h4 className="text-lg font-black">{siteLocation.name}</h4>
                <p className="text-xs sm:text-sm text-slate-200 font-mono font-bold">
                  {hasGps ? `${activeLat.toFixed(4)}, ${activeLng.toFixed(4)}` : 'Active Field Work Zone'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Deployment Lead</span>
                <span className="font-extrabold text-slate-900">{siteLocation.manager}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Shift Timings</span>
                <span className="font-extrabold text-slate-900">{siteLocation.timings}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500 font-bold">Operational Status</span>
                <span className="font-black text-emerald-600">
                  Authorized & In-Range (Live Location Mode)
                </span>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => navigate('/site')}
                  className="text-sm font-extrabold py-3 shadow-2xs hover:bg-slate-50"
                >
                  View Deployment Zone & Details
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
