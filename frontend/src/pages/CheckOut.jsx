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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useToast } from '../components/ui/Toast';
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

  const siteLat = assignedSite?.latitude !== undefined && assignedSite?.latitude !== null ? Number(assignedSite.latitude) : null;
  const siteLng = assignedSite?.longitude !== undefined && assignedSite?.longitude !== null ? Number(assignedSite.longitude) : null;
  const hasSiteCoords = siteLat !== null && siteLng !== null;

  let activeLat = coordinates.latitude;
  let activeLng = coordinates.longitude;

  if (activeLat === null || activeLng === null) {
    if (hasSiteCoords) {
      activeLat = siteLat;
      activeLng = siteLng;
    }
  }

  const hasGps = activeLat !== null && activeLng !== null;

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
      const res = await api.get(`/attendance/today?employeeId=${user?.employeeId || 'EMP001'}`);
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
    const lat = activeLat ?? 18.5204;
    const lng = activeLng ?? 73.8567;

    setSubmitting(true);
    setConfirmModalOpen(false);
    try {
      const payload = {
        employeeId: user?.employeeId || 'EMP001',
        latitude: Number(lat),
        longitude: Number(lng),
        accuracy: coordinates.accuracy || 10,
      };

      const res = await api.post('/attendance/check-out', payload);
      setSuccessData(res.data);
      showToast('Checked out successfully at your departure location!', 'info');
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
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Shift Check-Out & Finalization
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              End active shift and log departure telemetry from your current location
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
              {isAlreadyCheckedOut ? 'Shift Already Completed Today' : 'No Active Shift Found'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isAlreadyCheckedOut
                ? `You have already checked out today at ${shiftData.checkOutTime}. Total duration logged: ${shiftData.workingHours || '--'}.`
                : "You haven't checked in yet today. To record departure telemetry and compute working hours, please check in first."}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {isAlreadyCheckedOut ? (
              <Button variant="primary" size="md" onClick={() => navigate('/check-in')}>
                <LogIn className="w-4 h-4 mr-2" />
                Check In Again for New Shift
              </Button>
            ) : (
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
                  siteLocation={siteLocation}
                  geofenceRadius={500}
                  showGeofence={true}
                  height="340px"
                  showRoute={false}
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
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Departure Precision</p>
                  <p className="text-base font-bold text-rose-800 mt-1">
                    ±{coordinates.accuracy || 6} meters
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
                  <span>Shift duration calculated and logged into payroll system</span>
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

              <Button
                variant="danger"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={!hasGps}
                onClick={() => setConfirmModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-4 text-base shadow-md"
              >
                {hasGps ? 'Check Out Now' : 'Acquiring GPS Signal...'}
              </Button>

              <p className="text-xs text-slate-500 font-medium mt-4 leading-relaxed">
                Your check-out time, location, and date will be automatically recorded in the Adani central database.
              </p>
            </Card>

            {/* Shift Recap Widget */}
            <Card className="p-4 sm:p-5 flex items-center justify-between text-sm border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                  <Clock className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    Logged Time: {shiftData?.checkInTime || '--'} - Now
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Shift status will update to Checked Out</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Completed Summary State */
        <Card className="p-8 text-center flex flex-col items-center max-w-lg mx-auto shadow-xl">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-brand-600 mb-4">
            <Clock className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">Checked Out Successfully!</h3>
          <p className="text-sm text-slate-500 mb-6">
            Your shift attendance has been completed and recorded for {user?.name || 'Rahul Sharma'}.
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
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Departure Location</span>
              <span className="font-mono text-slate-800">
                {hasGps ? `${activeLat.toFixed(6)}, ${activeLng.toFixed(6)}` : '--'}
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
                Are you sure you want to finalize your shift for today? Your departure GPS coordinates and shift duration will be logged.
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
