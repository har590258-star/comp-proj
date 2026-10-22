import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Radio,
  FileCheck2,
  LogIn,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useToast } from '../components/ui/Toast';
import { calculateDistanceMeters, formatDistance } from '../utils/geoUtils';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import InteractiveMap from '../components/maps/InteractiveMap';
import { LoadingSpinner } from '../components/ui/FeedbackStates';

const CheckOut = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignedSite, setAssignedSite] = useState(() => {
    try {
      const saved = sessionStorage.getItem('adani_assigned_site') || localStorage.getItem('adani_assigned_site');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const { coordinates, refreshLocation } = useGeolocation({ assignedSite });
  const { showToast } = useToast();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingShift, setLoadingShift] = useState(true);
  const [shiftData, setShiftData] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';

  // Strict Shift Timing Rule: Early check-out prohibited before 06:00 PM (18:00) for standard technicians
  const isBefore6PM =
    !isSupervisor &&
    (shiftData?.isCheckOutAllowedNow === false || now.getHours() < 18);

  const siteLat = assignedSite?.latitude !== undefined && assignedSite?.latitude !== null ? Number(assignedSite.latitude) : null;
  const siteLng = assignedSite?.longitude !== undefined && assignedSite?.longitude !== null ? Number(assignedSite.longitude) : null;
  const hasSiteCoords = siteLat !== null && siteLng !== null;

  let activeLat = coordinates.latitude;
  let activeLng = coordinates.longitude;

  const hasGps = activeLat !== null && activeLng !== null;

  const cinLat = shiftData?.checkInLocation?.latitude != null ? Number(shiftData.checkInLocation.latitude) : null;
  const cinLng = shiftData?.checkInLocation?.longitude != null ? Number(shiftData.checkInLocation.longitude) : null;
  const hasCheckInLocation = cinLat !== null && cinLng !== null;

  const liveDistanceMeters = (hasCheckInLocation && hasGps)
    ? calculateDistanceMeters(cinLat, cinLng, activeLat, activeLng)
    : null;

  const originLocation = hasCheckInLocation
    ? {
        name: 'Check-In Point',
        code: 'CIN',
        address: 'Shift punch-in origin point',
        manager: assignedSite?.manager || 'Operations Lead',
        latitude: cinLat,
        longitude: cinLng,
      }
    : {
        name: assignedSite?.name || user?.assignedSiteName || 'Field Operations',
        code: assignedSite?.code || 'ADN-FLD-001',
        address: assignedSite?.address || 'Active Field Deployment Zone',
        manager: assignedSite?.manager || 'Operations Lead',
        latitude: siteLat !== null ? siteLat : activeLat,
        longitude: siteLng !== null ? siteLng : activeLng,
      };

  const siteLocation = {
    name: assignedSite?.name || user?.assignedSiteName || 'Field Operations',
    code: assignedSite?.code || 'ADN-FLD-001',
    address: assignedSite?.address || 'Active Field Deployment Zone',
    manager: assignedSite?.manager || 'Operations Lead',
    latitude: siteLat !== null ? siteLat : activeLat,
    longitude: siteLng !== null ? siteLng : activeLng,
  };

  useEffect(() => {
    fetchActiveShift();
  }, [user]);

  const fetchActiveShift = async () => {
    try {
      setLoadingShift(true);
      const res = await api.get(`/attendance/today?employeeId=${user?.employeeId || 'b4S/Adani/01'}`);
      if (res.data) {
        setShiftData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch active shift:', err);
    } finally {
      setLoadingShift(false);
    }
  };

  const calculateShiftDuration = () => {
    if (!shiftData?.checkInTime) return '0h 00m';
    try {
      const now = new Date();
      const [time, modifier] = shiftData.checkInTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const checkInDate = new Date();
      checkInDate.setHours(hours, minutes, 0, 0);

      const diffMs = Math.max(0, now - checkInDate);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    } catch {
      return 'In Progress';
    }
  };

  const handleConfirmCheckout = async () => {
    if (isBefore6PM && !isSupervisor) {
      showToast('Check-out notice: Checking out before 06:00 PM records shift as Half Day.', 'warning');
    }

    const lat = activeLat ?? siteLat ?? 18.5204;
    const lng = activeLng ?? siteLng ?? 73.8567;

    setSubmitting(true);
    setConfirmModalOpen(false);
    try {
      const payload = {
        employeeId: user?.employeeId || 'b4S/Adani/01',
        latitude: Number(lat),
        longitude: Number(lng),
        accuracy: coordinates.accuracy || 10,
        bypassRadiusCheck: Boolean(isSupervisor),
      };

      const res = await api.post('/attendance/check-out', payload);
      setSuccessData(res.data);
      showToast(
        isSupervisor
          ? 'Supervisor normal check-out successful!'
          : 'Checked out successfully at your departure location!',
        'info'
      );
    } catch (err) {
      console.error('Check-out error:', err);
      const detail = err.response?.data?.detail;
      const networkMsg =
        err.message === 'Network Error'
          ? 'Network Error: Cannot connect to server. Please check your connection.'
          : 'Failed to record check-out. Please try again.';
      const errorMsg = detail || networkMsg;
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingShift) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Checking active shift telemetry..." />
      </div>
    );
  }

  const isCheckedIn = Boolean(shiftData?.isCheckedIn);
  const isAlreadyCheckedOut = Boolean(shiftData?.checkOutTime);

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
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isSupervisor ? 'Supervisor Shift Check-Out' : 'Shift Check-Out & Finalization'}
              </h2>
              {isSupervisor && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white">
                  Supervisor Desk
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {isSupervisor
                ? 'Direct supervisory shift departure sign-off with accurate punch log'
                : 'End active shift and log departure telemetry from your current location'}
            </p>
          </div>
        </div>

        {isCheckedIn && (
          <div className="hidden sm:flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Clock className="w-4 h-4 text-rose-500" />
            <span>Active Shift Duration: ~{calculateShiftDuration()}</span>
          </div>
        )}
      </div>

      {!isCheckedIn && !successData ? (
        /* Not Checked In State */
        <Card className="p-8 text-center max-w-lg mx-auto shadow-sm border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isAlreadyCheckedOut ? 'Shift Completed for Today' : 'No Active Shift Found'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isAlreadyCheckedOut
                ? `You checked out at ${shiftData.checkOutTime} (Total duration: ${shiftData.workingHours || '--'}). Your daily shift is recorded.`
                : "You haven't checked in yet today. Shift check-in is strictly permitted only before 09:00 AM."}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {!isAlreadyCheckedOut && (
              <Button variant="primary" size="md" onClick={() => navigate('/check-in')}>
                <LogIn className="w-4 h-4 mr-2" />
                Go to Check In
              </Button>
            )}
            <Button variant="outline" size="md" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </Card>
      ) : !successData ? (
        isSupervisor ? (
          /* SUPERVISOR DIRECT CHECK-OUT CONSOLE (No location map/radar shown, direct check-out with accurate punch time & duration) */
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-6 sm:p-8 text-center shadow-lg border-slate-200 bg-white">
              {/* Top Supervisor Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supervisory Duty Portal</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white">
                        Supervisor
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">{user?.name || 'Area Operations Supervisor'}</p>
                    <p className="text-xs text-slate-500 font-mono">ID: {user?.employeeId || 'SUPER01'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Shift Active</span>
                </div>
              </div>

              {/* Large Real-Time Clock */}
              <div className="py-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-3">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Real-Time Clock (IST)</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                  {now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Shift Stats Card */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Punched In At</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">{shiftData?.checkInTime || '--'}</p>
                  <p className="text-[11px] text-slate-500">Initial operational arrival</p>
                </div>
                <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 text-left">
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Active Shift Duration</p>
                  <p className="text-base font-black text-blue-900 mt-0.5">{calculateShiftDuration()}</p>
                  <p className="text-[11px] text-blue-700">Elapsed working time</p>
                </div>
              </div>

              {/* Designated Substation / Area Info */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Designated Substation</p>
                    <p className="text-sm font-extrabold text-slate-900">{siteLocation.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{siteLocation.address || 'Operational Zone'}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg">
                  {siteLocation.code || 'ADN-ZONE'}
                </span>
              </div>

              {/* Supervisor Direct Checkout Action */}
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-left text-xs text-blue-900 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Location verification radar is waived for supervisor check-out. Your departure timestamp and duty hours will be recorded in central operations.</span>
                </div>

                <Button
                  variant="danger"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  onClick={() => setConfirmModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-4 text-base shadow-lg cursor-pointer"
                >
                  Supervisor Complete Shift Check-Out Now
                </Button>
              </div>
            </Card>

            {/* Shift Rules Info Widget */}
            <Card className="p-4 sm:p-5 flex items-center justify-between text-sm border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">Shift Timings & Departure Rules</p>
                    <span className="text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-300 px-2 py-0.5 rounded-full">
                      Shift Policy
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Supervisory duty departure logs punch time immediately without GPS distance constraints.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
        /* Two-Column Layout for Active Shift Check-Out */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Map and Telemetry Diagnostics */}
          <div className="lg:col-span-7 space-y-5">
            <Card className="p-5 space-y-4 shadow-sm border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Departure Telemetry Radar</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Current Position • {siteLocation.name}</p>
                </div>
                <button
                  onClick={refreshLocation}
                  className="text-xs sm:text-sm font-bold text-brand-600 hover:underline flex items-center gap-1.5"
                >
                  <Radio className="w-4 h-4" />
                  Refresh Telemetry
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-300">
                <InteractiveMap
                  userLocation={coordinates}
                  siteLocation={originLocation}
                  geofenceRadius={500}
                  showGeofence={true}
                  height="340px"
                  showRoute={hasCheckInLocation && hasGps}
                />
              </div>

              {/* Coordinates & Distance Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">GPS Latitude</p>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-1">
                    {hasGps ? activeLat.toFixed(5) : 'Locating...'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">GPS Longitude</p>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-1">
                    {hasGps ? activeLng.toFixed(5) : 'Locating...'}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">GPS Precision</p>
                  <p className="text-sm font-bold text-rose-800 mt-1">
                    ±{coordinates.accuracy || 6}m
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Distance from Check-In</p>
                  <p className="text-sm font-extrabold text-blue-800 mt-1 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    <span>{liveDistanceMeters !== null ? formatDistance(liveDistanceMeters) : '--'}</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Shift Close Protocol */}
            <Card className="p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Shift Completion Protocol
              </h4>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Smart meter work orders synchronized to central server</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Safety gear returned and tools secured at substation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Shift duration and travel distance logged into central payroll</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-emerald-700 font-semibold">Temporary shift photo automatically erased from database</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column (5 cols): Check-Out Action Console */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="p-6 sm:p-8 text-center flex flex-col items-center shadow-card border-slate-200">
              <div className="w-22 h-22 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center text-rose-500 mb-4 relative">
                <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md">
                  <MapPin className="w-8 h-8" />
                </div>
                <span className="absolute inset-0 rounded-full border-2 border-rose-400 opacity-30 animate-ping" />
              </div>

              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
                Ready to Check Out
              </h3>
              <p className="text-sm text-slate-600 font-medium max-w-xs mb-6">
                Your live GPS coordinates will be recorded as your departure point.
              </p>

              {/* Target Location Card */}
              <div className="w-full bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-left space-y-4 mb-6">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Current Location
                    </p>
                    <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {hasGps ? `${activeLat.toFixed(4)}, ${activeLng.toFixed(4)}` : 'Detecting GPS...'}
                    </p>
                    <p className="text-xs text-emerald-700 font-bold mt-0.5">
                      GPS Signal Active (±{coordinates.accuracy || 6}m)
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200" />

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Distance from Check-In Point
                    </p>
                    <p className="text-base font-extrabold text-blue-700 mt-0.5">
                      {liveDistanceMeters !== null ? formatDistance(liveDistanceMeters) : '--'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Measured from punch-in point ({cinLat != null ? `${cinLat.toFixed(4)}, ${cinLng.toFixed(4)}` : 'Substation'})
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200" />

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Deployment Assignment
                    </p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{siteLocation.name}</p>
                    <p className="text-xs text-slate-600 font-medium">{siteLocation.address}</p>
                  </div>
                </div>
              </div>

              {/* Supervisor Mode Indicator */}
              {isSupervisor && (
                <div className="p-3.5 mb-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs w-full">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-extrabold text-blue-950">Supervisor Normal Check-Out</p>
                      <p className="text-[11px] text-blue-700">GPS location lock requirement is bypassed.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white shadow-2xs">
                    Supervisor
                  </span>
                </div>
              )}

              <Button
                variant="danger"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={isSupervisor ? false : (!hasGps || isBefore6PM)}
                onClick={() => setConfirmModalOpen(true)}
                className={
                  (!isSupervisor && (isBefore6PM || !hasGps))
                    ? 'bg-slate-200 border border-slate-300 text-slate-400 font-bold py-4 text-sm cursor-not-allowed select-none shadow-none'
                    : 'bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-4 text-base shadow-md cursor-pointer'
                }
              >
                {isSupervisor
                  ? 'Supervisor Check Out Now'
                  : !hasGps
                  ? 'Acquiring GPS Signal...'
                  : isBefore6PM
                  ? 'Locked: Check-Out Prohibited Before 06:00 PM'
                  : 'Check Out Now'}
              </Button>

              {isBefore6PM && !isSupervisor && (
                <div className="p-3.5 mt-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-amber-800 leading-snug">
                    Shift Policy: Shift completes at 06:00 PM. Checking out before 06:00 PM will mark the day as Half-Day.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-500 font-medium mt-4 leading-relaxed">
                {isSupervisor
                  ? 'Supervisor normal check-out active. Departure time and status will be recorded.'
                  : isBefore6PM
                  ? 'Employees with active shifts are automatically checked out at 06:00 PM.'
                  : 'Your check-out time, location, and date will be automatically recorded in the Adani central database.'}
              </p>
            </Card>

            {/* Shift Recap Widget */}
            <Card className="p-4 sm:p-5 flex items-center justify-between text-sm border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">Shift Timings & Auto-Checkout</p>
                    <span className="text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-300 px-2 py-0.5 rounded-full">
                      Shift Policy
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Standard shift ends at 06:00 PM. All active shifts are automatically checked out after 06:00 PM.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
        )
      ) : (
        /* Completed Summary State */
        <Card className="p-8 text-center flex flex-col items-center max-w-lg mx-auto shadow-xl">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-brand-600 mb-4">
            <Clock className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">Checked Out Successfully!</h3>
          <p className="text-sm text-slate-500 mb-6">
            Your shift attendance has been completed and recorded for {user?.name || (isSupervisor ? 'Supervisor' : 'Rahul Sharma')}.
          </p>

          <div className="w-full bg-slate-50 rounded-2xl p-5 text-xs space-y-3 mb-6 text-left border border-slate-200/80">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Checked Out
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Check-Out Timestamp</span>
              <span className="font-semibold text-slate-900">
                {successData?.checkOutTime || '--'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Total Working Duration</span>
              <span className="font-bold text-brand-600 text-sm">
                {successData?.workingHours || '--'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">{isSupervisor ? 'Duty Field Type' : 'Distance Traveled (Check-In to Departure)'}</span>
              <span className="font-extrabold text-blue-700 text-sm">
                {isSupervisor
                  ? 'Supervisory Substation Oversight'
                  : (successData?.distanceTraveledFormatted || (successData?.distanceTraveledMeters != null ? `${successData.distanceTraveledMeters} m` : (liveDistanceMeters != null ? formatDistance(liveDistanceMeters) : '--')))}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Shift Verification Photo</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ✓ Auto-Deleted from Server
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">{isSupervisor ? 'Verification Mode' : 'Departure Location'}</span>
              <span className="font-mono text-slate-800">
                {isSupervisor
                  ? 'Supervisor Direct Punch (Waived)'
                  : (hasGps ? `${activeLat.toFixed(6)}, ${activeLng.toFixed(6)}` : '--')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
            <Button variant="outline" size="sm" onClick={() => navigate('/attendance')}>
              Today's Status
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/check-in')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center">
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Check In Again
            </Button>
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Shift Check-Out"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">End Current Working Shift?</p>
              <p className="text-xs text-slate-500 mt-1">
                {isSupervisor
                  ? `Are you sure you want to finalize your supervisory shift for today? Your departure time and total shift duration (${calculateShiftDuration()}) will be logged into central operations.`
                  : `Are you sure you want to finalize your shift for today? Your departure GPS coordinates, shift duration, and total travel distance (${liveDistanceMeters !== null ? formatDistance(liveDistanceMeters) : 'calculated on submit'}) will be permanently recorded in the central database.`}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmCheckout}>
              Confirm Check Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CheckOut;
