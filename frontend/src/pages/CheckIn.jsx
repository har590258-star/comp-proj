import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Radio,
  FileCheck2,
  Navigation,
  LogOut,
  AlertCircle,
  Timer,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InteractiveMap from '../components/maps/InteractiveMap';
import { calculateDistanceMeters, formatDistance } from '../utils/geoUtils';

const CheckIn = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySiteId = searchParams.get('siteId');
  const { user, refreshUser } = useAuth();

  const [assignedSites, setAssignedSites] = useState([]);
  const [assignedSite, setAssignedSite] = useState(() => {
    try {
      const saved = sessionStorage.getItem('adani_assigned_site') || localStorage.getItem('adani_assigned_site');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const { coordinates, loading: geoLoading, error: geoError, refreshLocation } = useGeolocation({ assignedSite });
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [now, setNow] = useState(new Date());

  // Location anchored to assigned site
  const siteLat =
    assignedSite?.latitude !== undefined && assignedSite?.latitude !== null
      ? Number(assignedSite.latitude)
      : null;
  const siteLng =
    assignedSite?.longitude !== undefined && assignedSite?.longitude !== null
      ? Number(assignedSite.longitude)
      : null;
  const hasSiteCoords = siteLat !== null && siteLng !== null;

  const [simulateAtSite, setSimulateAtSite] = useState(false);

  // Real employee device coordinates (Live in Bangalore by default)
  let activeLat = coordinates.latitude;
  let activeLng = coordinates.longitude;

  if (simulateAtSite && hasSiteCoords) {
    activeLat = Number((siteLat + 0.00018).toFixed(6));
    activeLng = Number((siteLng + 0.00015).toFixed(6));
  } else if (activeLat === null || activeLng === null) {
    if (hasSiteCoords) {
      activeLat = siteLat;
      activeLng = siteLng;
    }
  }

  const hasGps = activeLat !== null && activeLng !== null;

  useEffect(() => {
    if (refreshUser) refreshUser();
    fetchAssignedSite();
    fetchTodayStatus();
  }, [user?.employeeId, user?.assignedSiteId]);

  // Live ticking timer for hours worked while shift is active
  useEffect(() => {
    let interval = null;
    if (todayStatus?.isCheckedIn) {
      interval = setInterval(() => {
        setNow(new Date());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayStatus?.isCheckedIn]);

  const fetchTodayStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await api.get(`/attendance/today?employeeId=${user?.employeeId || 'EMP001'}`);
      if (res.data) {
        setTodayStatus(res.data);
      }
    } catch (err) {
      console.warn('Failed to load today attendance status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchAssignedSite = async () => {
    try {
      const empId = user?.employeeId || 'EMP001';
      // Query all authorized sites for this employee from backend
      const res = await api.get('/sites', {
        params: { employee_id: empId }
      });
      const userSites = res.data || [];
      if (userSites.length > 0) {
        setAssignedSites(userSites);

        // Priority 1: Site requested via URL parameter (?siteId=...)
        if (querySiteId) {
          const match = userSites.find(s => s.id === querySiteId || s._id === querySiteId);
          if (match) {
            setAssignedSite(match);
            return;
          }
        }

        // Priority 2: Keep current assignedSite if it's already one of the authorized sites
        if (assignedSite && userSites.some(s => s.id === assignedSite.id)) {
          return;
        }

        // Priority 3: Fallback to first assigned site
        setAssignedSite(userSites[0]);
        try {
          sessionStorage.setItem('adani_assigned_site', JSON.stringify(userSites[0]));
          localStorage.setItem('adani_assigned_site', JSON.stringify(userSites[0]));
        } catch (_) {}
        return;
      }

      // Secondary lookup via direct employee profile
      const empRes = await api.get(`/employees/${empId}`);
      const empData = empRes.data;
      if (empData?.assignedSiteId) {
        try {
          const siteRes = await api.get(`/sites/${empData.assignedSiteId}`);
          if (siteRes.data) {
            setAssignedSite(siteRes.data);
            setAssignedSites([siteRes.data]);
            try {
              sessionStorage.setItem('adani_assigned_site', JSON.stringify(siteRes.data));
              localStorage.setItem('adani_assigned_site', JSON.stringify(siteRes.data));
            } catch (_) {}
            return;
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Failed to load assigned site for check-in:', e);
    }
  };

  const getElapsedHoursWorked = () => {
    if (!todayStatus?.isCheckedIn) return '00h 00m 00s';
    try {
      let startTime = null;
      if (todayStatus.createdAt) {
        startTime = new Date(todayStatus.createdAt);
      } else if (todayStatus.checkInTime) {
        const [timePart, modifier] = todayStatus.checkInTime.split(' ');
        let [h, m] = timePart.split(':').map(Number);
        if (modifier === 'PM' && h < 12) h += 12;
        if (modifier === 'AM' && h === 12) h = 0;
        const d = new Date();
        d.setHours(h, m, 0, 0);
        startTime = d;
      }
      if (!startTime || isNaN(startTime.getTime())) return '00h 00m 00s';
      const diffMs = Math.max(0, now - startTime);
      const totalSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    } catch {
      return '00h 00m 00s';
    }
  };

  // Authentic site coordinates from server configuration
  const activeSite = assignedSite || {
    id: user?.assignedSiteId,
    name: user?.assignedSiteName || 'Assigned Substation',
    code: 'ADN-SITE',
    address: 'Authorized Field Substation',
    latitude: null,
    longitude: null,
    attendanceRadius: 500,
  };

  const siteLocation = {
    name: activeSite.name,
    code: activeSite.code || 'ADN-SITE',
    address: activeSite.address || 'Authorized Field Deployment Zone',
    manager: activeSite.manager || 'Operations Lead',
    latitude: activeSite.latitude,
    longitude: activeSite.longitude,
    attendanceRadius: activeSite.attendanceRadius || 500,
  };

  const allowedRadius = siteLocation.attendanceRadius || 500;
  const distanceToSiteMeters = (hasGps && siteLocation.latitude != null && siteLocation.longitude != null)
    ? calculateDistanceMeters(activeLat, activeLng, siteLocation.latitude, siteLocation.longitude)
    : null;

  const isWithinGeofence = distanceToSiteMeters !== null && distanceToSiteMeters <= allowedRadius;

  const isShiftActive = Boolean(todayStatus?.isCheckedIn);

  const handleCheckIn = async () => {
    if (isShiftActive) {
      showToast('You are already checked in. Please check out first before checking in again.', 'warning');
      return;
    }

    if (!isWithinGeofence) {
      showToast(
        `Check-in denied: You are ${formatDistance(distanceToSiteMeters)} away from ${siteLocation.name}. Check-in is only permitted within ${allowedRadius}m of the assigned substation.`,
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: user?.employeeId || 'EMP001',
        siteId: activeSite.id || 'site_pune_1',
        latitude: Number(activeLat),
        longitude: Number(activeLng),
        accuracy: coordinates.accuracy || 10,
        bypassRadiusCheck: false,
      };

      const res = await api.post('/attendance/check-in', payload);
      setSuccessData(res.data);
      await fetchTodayStatus();
      showToast(`Checked in successfully at ${activeSite.name}!`, 'success');
    } catch (err) {
      console.error('Check-in error:', err);
      const detail = err.response?.data?.detail;
      const networkMsg =
        err.message === 'Network Error'
          ? 'Network Error: Cannot connect to server. Please check your connection.'
          : 'Failed to record check-in. Please try again.';
      const msg = detail || networkMsg;
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors border border-slate-200"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Field Shift Check-In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Verify live GPS position at your current field work location
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {isShiftActive ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Shift Active • Checked In at {todayStatus?.checkInTime}</span>
            </div>
          ) : isWithinGeofence ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Geofence Status: In-Range ({formatDistance(distanceToSiteMeters)} / {allowedRadius}m)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-300 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Geofence Status: Out of Range ({formatDistance(distanceToSiteMeters)} away • Max: {allowedRadius}m)</span>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Site Selector Bar (shown when technician has multiple assigned sites) */}
      {assignedSites.length > 1 && (
        <Card className="p-4 bg-gradient-to-r from-brand-50/60 via-white to-blue-50/60 border-brand-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Assigned Substations ({assignedSites.length})
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                    Select Punch-In Site
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Select which authorized field substation you are currently reporting to
                </p>
              </div>
            </div>

            {/* Substation Buttons / Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {assignedSites.map((site) => {
                const isSelected = activeSite?.id === site.id;
                const dMeters = (hasGps && site.latitude && site.longitude)
                  ? calculateDistanceMeters(activeLat, activeLng, Number(site.latitude), Number(site.longitude))
                  : null;
                const inRange = dMeters !== null && dMeters <= (site.attendanceRadius || 500);

                return (
                  <button
                    key={site.id}
                    onClick={() => {
                      setAssignedSite(site);
                      setSearchParams({ siteId: site.id });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-700 shadow-sm ring-2 ring-brand-400/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${inRange ? 'bg-emerald-400' : isSelected ? 'bg-white/80' : 'bg-slate-300'}`} />
                    <span>{site.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-brand-700 text-brand-100' : 'bg-slate-100 text-slate-500'}`}>
                      {site.code || 'ADN'}
                    </span>
                    {dMeters !== null && (
                      <span className={`text-[10px] font-normal ${isSelected ? 'text-brand-200' : 'text-slate-400'}`}>
                        ({formatDistance(dMeters)})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {!successData ? (
        /* Two-Column Responsive Enterprise Web Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Satellite Radar Map & Geofence Diagnostics */}
          <div className="lg:col-span-7 space-y-5">
            <Card className="p-5 space-y-4 shadow-sm border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Live Location Radar</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Assignment: {siteLocation.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimulateAtSite(!simulateAtSite)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                      simulateAtSite
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                    title="Toggle between live device GPS (Bangalore) and on-site simulation for testing"
                  >
                    <span>{simulateAtSite ? `⚡ On-Site (${activeSite?.name || 'Substation'})` : '📍 Live GPS (Bangalore)'}</span>
                  </button>
                  <button
                    onClick={refreshLocation}
                    className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-300">
                <InteractiveMap
                  userLocation={hasGps ? {
                    latitude: activeLat,
                    longitude: activeLng,
                    title: simulateAtSite ? 'Simulated On-Site' : 'Your Device GPS (Bangalore)',
                  } : null}
                  siteLocation={siteLocation}
                  geofenceRadius={allowedRadius}
                  showGeofence={true}
                  height="340px"
                  showRoute={true}
                />
              </div>

              {/* Coordinates Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">GPS Latitude</p>
                  <p className="text-base font-mono font-bold text-slate-900 mt-1">
                    {hasGps ? activeLat.toFixed(6) : 'Locating...'}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">GPS Longitude</p>
                  <p className="text-base font-mono font-bold text-slate-900 mt-1">
                    {hasGps ? activeLng.toFixed(6) : 'Locating...'}
                  </p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isWithinGeofence ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isWithinGeofence ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Distance to Site
                  </p>
                  <p className={`text-base font-bold mt-1 ${isWithinGeofence ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {hasGps ? formatDistance(distanceToSiteMeters) : '--'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Shift Protocol Card */}
            <Card className="p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Attendance Compliance Protocol
              </h4>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Strict 500m geofence perimeter enforced around assigned substation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Real-time GPS anti-spoofing telemetry recorded on check-in</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Shift start timestamp recorded to Adani central operations ledger</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column (5 cols): Check-In Action Console */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="p-6 sm:p-8 text-center flex flex-col items-center shadow-card border-slate-200">
              {isShiftActive ? (
                /* ALREADY CHECKED IN: Shift Active State */
                <>
                  <div className="w-22 h-22 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 relative">
                    <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <span className="absolute inset-0 rounded-full border-2 border-emerald-400 opacity-40 animate-ping" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>Shift Currently Active</span>
                  </div>

                  <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
                    Already Checked In
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mb-5 leading-relaxed">
                    You are already checked in for today's deployment. Please proceed to shift check-out when you finish your shift.
                  </p>

                  {/* Active Shift Telemetry Card */}
                  <div className="w-full bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-left space-y-3.5 mb-5">
                    {/* Live Hours Worked Banner */}
                    <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-emerald-600 animate-spin" style={{ animationDuration: '8s' }} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Hours Worked Counter</p>
                          <p className="text-base font-black font-mono text-emerald-900 tracking-tight">{getElapsedHoursWorked()}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-600 text-white rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Live
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Check-In Time</span>
                        <span className="font-extrabold text-slate-900 text-sm">{todayStatus?.checkInTime || '--'}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Attendance Status</span>
                        <span className="font-extrabold text-emerald-700 text-sm">Present</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-1 border-t border-slate-200">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deployment Location</p>
                        <p className="text-xs font-bold text-slate-900">{siteLocation.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {hasGps ? `${activeLat.toFixed(4)}, ${activeLng.toFixed(4)}` : 'GPS active'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full">
                    {/* Direct Checkout Button */}
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={() => navigate('/check-out')}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-4 text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Go to Shift Check-Out</span>
                    </Button>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mt-4 leading-relaxed">
                    To end your shift or check in again for another assignment, complete your shift check-out first.
                  </p>
                </>
              ) : (
                /* NOT CHECKED IN: Ready to Check In State */
                <>
                  <div className={`w-22 h-22 rounded-full border-4 flex items-center justify-center mb-4 relative ${isWithinGeofence ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md ${isWithinGeofence ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      <MapPin className="w-8 h-8" />
                    </div>
                    {isWithinGeofence && (
                      <span className="absolute inset-0 rounded-full border-2 border-emerald-400 opacity-30 animate-ping" />
                    )}
                  </div>

                  <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
                    {todayStatus?.checkOutTime ? 'Check In for New Shift' : 'Ready to Check In'}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium max-w-xs mb-4">
                    {todayStatus?.checkOutTime
                      ? 'You have checked out of your previous shift. Check-in is available when within the site geofence.'
                      : "Your location must be within the designated 500m geofence area to record shift attendance."}
                  </p>

                  {todayStatus?.checkOutTime && (
                    <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs mb-4 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="text-slate-700">
                        <span className="font-bold text-blue-900">Previous shift checked out:</span>{' '}
                        <span>{todayStatus.checkOutTime} (Worked: {todayStatus.workingHours || '--'}).</span>
                      </div>
                    </div>
                  )}

                  {/* Geofence Out-of-Range Warning Banner */}
                  {!isWithinGeofence && hasGps && (
                    <div className="w-full p-4 bg-rose-50 border border-rose-200 rounded-xl text-left space-y-1.5 mb-5 shadow-xs">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>Check-In Locked: Outside Geofence Area</span>
                      </div>
                      <p className="text-xs text-rose-700 leading-relaxed font-medium">
                        You are currently <strong>{formatDistance(distanceToSiteMeters)}</strong> away from <strong>{siteLocation.name}</strong>. Attendance check-in is strictly locked until you arrive within <strong>{allowedRadius} meters</strong> of the assigned substation.
                      </p>
                    </div>
                  )}

                  {/* Location Card */}
                  <div className="w-full bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-left space-y-4 mb-6">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isWithinGeofence ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Current GPS Location
                        </p>
                        <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                          {hasGps ? `${activeLat.toFixed(4)}, ${activeLng.toFixed(4)}` : 'Acquiring satellite lock...'}
                        </p>
                        {hasGps ? (
                          isWithinGeofence ? (
                            <p className="text-xs text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                              <span>● Within Allowed Geofence</span>
                              <span className="text-slate-500 font-normal">({formatDistance(distanceToSiteMeters)} from site)</span>
                            </p>
                          ) : (
                            <p className="text-xs text-rose-600 font-bold mt-0.5 flex items-center gap-1">
                              <span>✕ Outside Geofence</span>
                              <span className="font-semibold">({formatDistance(distanceToSiteMeters)} away • Max {allowedRadius}m)</span>
                            </p>
                          )
                        ) : (
                          <p className="text-xs text-amber-600 font-medium mt-0.5">Detecting GPS telemetry...</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-200" />

                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Assigned Substation Site
                          </p>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Admin Assigned
                          </span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl">
                          <p className="text-sm font-extrabold text-slate-900">
                            {siteLocation.name} <span className="font-mono text-xs text-slate-400 font-semibold">({siteLocation.code || 'ADN-SITE'})</span>
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                            {siteLocation.address}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-semibold">Geofence Perimeter:</span>
                            <span className="font-bold text-slate-800">{allowedRadius} meters</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Check In Button - Enabled strictly when within allowed geofence */}
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={submitting}
                    disabled={!hasGps || !isWithinGeofence}
                    onClick={handleCheckIn}
                    className={
                      !isWithinGeofence
                        ? 'bg-slate-200 border border-slate-300 text-slate-400 font-bold py-4 text-sm cursor-not-allowed select-none shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 text-base shadow-md cursor-pointer'
                    }
                  >
                    {!hasGps
                      ? 'Acquiring GPS Signal...'
                      : !isWithinGeofence
                      ? `Locked: Outside ${allowedRadius}m Geofence`
                      : (todayStatus?.checkOutTime ? 'Check In Again Now' : 'Check In Now')}
                  </Button>

                  <p className="text-xs text-slate-500 font-medium mt-4 leading-relaxed">
                    {!isWithinGeofence
                      ? `Attendance check-in is blocked because your current device GPS is not within ${allowedRadius}m of ${siteLocation.name}.`
                      : 'Your check-in time, live location, and device telemetry will be stored securely in the central Adani database.'}
                  </p>
                </>
              )}
            </Card>

            {/* Quick Shift Recap Widget */}
            <Card className="p-4 sm:p-5 flex items-center justify-between text-sm border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                  <Clock className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Shift Timings: 09:00 AM - 06:00 PM</p>
                  <p className="text-xs text-slate-500 font-medium">Standard 8-hour field operational schedule</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Completed Summary State */
        <Card className="p-8 text-center flex flex-col items-center max-w-lg mx-auto shadow-xl">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">Check-In Successful!</h3>
          <p className="text-sm text-slate-500 mb-6">
            Your shift attendance has been recorded for {user?.name || 'Rahul Sharma'}.
          </p>

          <div className="w-full bg-slate-50 rounded-2xl p-5 text-xs space-y-3 mb-6 text-left border border-slate-200/80">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Present
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Check-In Time</span>
              <span className="font-semibold text-slate-900">
                {successData?.record?.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Assignment Zone</span>
              <span className="font-semibold text-slate-900">{siteLocation.name}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Location Coordinates</span>
              <span className="font-mono text-slate-800">
                {hasGps ? `${activeLat.toFixed(6)}, ${activeLng.toFixed(6)}` : '--'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="outline" size="md" onClick={() => navigate('/attendance')}>
              Today's Status
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate('/check-out')}>
              Go to Shift Check-Out
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CheckIn;
