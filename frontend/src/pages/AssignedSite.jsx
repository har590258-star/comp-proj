import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  User,
  Navigation,
  Share2,
  Shield,
  Phone,
  Mail,
  Compass,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistanceMeters, formatDistance } from '../utils/geoUtils';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InteractiveMap from '../components/maps/InteractiveMap';
import { useToast } from '../components/ui/Toast';

const AssignedSite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { coordinates, refreshLocation } = useGeolocation();

  const [site, setSite] = useState({
    id: user?.assignedSiteId || 'site_pune_1',
    name: user?.assignedSiteName || 'Pune - Phase 1',
    code: 'ADN-PS-001',
    address: 'Hinjewadi, Pune, Maharashtra',
    distance: '--',
    manager: 'Suresh Patil',
    managerPhone: '+91 98220 12345',
    managerEmail: 'suresh.patil@adani.com',
    workingHours: '09:00 AM - 06:00 PM',
    latitude: 18.5204,
    longitude: 73.8567,
    attendanceRadius: 500,
    imageUrl: '/assets/site_photo.jpg',
    assignedStaffCount: 16,
  });

  const hasLiveGps = coordinates.latitude !== null && coordinates.longitude !== null;

  // Real-time distance calculation between live user GPS and assigned site
  const distanceMeters = useMemo(() => {
    if (hasLiveGps && site.latitude && site.longitude) {
      return calculateDistanceMeters(
        coordinates.latitude,
        coordinates.longitude,
        site.latitude,
        site.longitude
      );
    }
    return null;
  }, [hasLiveGps, coordinates.latitude, coordinates.longitude, site.latitude, site.longitude]);

  const formattedDistance = distanceMeters !== null ? formatDistance(distanceMeters) : 'Acquiring GPS...';
  const isInGeofence = distanceMeters !== null && distanceMeters <= (site.attendanceRadius || 500);

  useEffect(() => {
    fetchAssignedSite();
  }, [user]);

  const fetchAssignedSite = async () => {
    try {
      // Fetch only the single substation assigned by the admin
      const res = await api.get('/sites', {
        params: { employee_id: user?.employeeId }
      });
      if (res.data && res.data.length > 0) {
        setSiteData(res.data[0]);
      } else if (user?.assignedSiteName) {
        setSite((prev) => ({
          ...prev,
          id: user?.assignedSiteId || prev.id,
          name: user?.assignedSiteName || prev.name,
        }));
      }
    } catch (e) {
      console.warn('Fallback to baseline assigned site');
    }
  };

  const setSiteData = (s) => {
    setSite({
      id: s.id,
      name: s.name,
      code: s.code,
      address: s.address,
      distance: s.distance || '2.4 km',
      manager: s.manager || 'Site Operations Manager',
      managerPhone: s.managerPhone || '+91 98220 12345',
      managerEmail: s.managerEmail || 'ops@adani.com',
      workingHours: s.workingHours || '09:00 AM - 06:00 PM',
      latitude: s.latitude,
      longitude: s.longitude,
      attendanceRadius: s.attendanceRadius || 500,
      imageUrl: s.imageUrl || '/assets/site_photo.jpg',
      assignedStaffCount: s.assignedEmployeesCount || 12,
    });
  };

  const isAssigned = user?.assignedSiteId ? site.id === user.assignedSiteId : site.id === 'site_pune_1';

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}`;
    window.open(url, '_blank');
    showToast(`Launching navigation to ${site.name}`, 'info');
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Header matching Screen 8 */}
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
              Assigned Substation Site
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Site technical specifications, geofence, and navigation directions
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(`${site.name}: ${site.address}`);
            showToast('Site address copied to clipboard');
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-colors border border-slate-200"
          title="Share Site Info"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Substation Verification Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Official Deployment Substation:
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {site.name} <span className="font-mono text-xs text-brand-600 font-bold">({site.code || 'ADN-SITE'})</span>
            </span>
          </div>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Admin Authorized Assignment
          </span>
        </div>
      </div>

      {/* Two-Column Responsive Enterprise Web Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Site Hero Banner & Key Specifications */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-0 overflow-hidden shadow-card border border-slate-200/80">
            {/* Top Site Image from PDF Screen 8 */}
            <div className="relative h-56 sm:h-64 w-full bg-slate-800 overflow-hidden">
              <img
                src={site.imageUrl}
                alt={site.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

              <div className="absolute top-4 right-4 bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                Phase 1 Active Substation
              </div>

              <div className="absolute bottom-4 left-4 text-white">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {site.code}
                </span>
                <h3 className="text-2xl font-bold tracking-tight mt-1">{site.name}</h3>
              </div>
            </div>

            {/* Address & Distance Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-slate-600 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span className="font-semibold text-slate-800">{site.address}</span>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap border flex items-center gap-1.5 ${
                  isInGeofence
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}
              >
                {isInGeofence ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{formattedDistance} from your live location</span>
              </span>
            </div>

            {/* Site Details Key-Value Table matching Screen 8 */}
            <div className="p-4 sm:p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Site Specifications & Live Proximity
              </h4>

              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Site Code</span>
                  <span className="font-semibold font-mono text-slate-800">{site.code}</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Your Live GPS</span>
                  <span className="font-mono font-bold text-brand-600">
                    {hasLiveGps
                      ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
                      : 'Acquiring satellite lock...'}
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Substation Coordinates</span>
                  <span className="font-mono text-slate-700">
                    {typeof site.latitude === 'number' ? site.latitude.toFixed(4) : site.latitude},{' '}
                    {typeof site.longitude === 'number' ? site.longitude.toFixed(4) : site.longitude}
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Distance to Substation</span>
                  <span className={`font-mono font-extrabold ${isInGeofence ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {formattedDistance}
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Geofence Status</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                      isInGeofence
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isInGeofence ? 'In Range (Authorized <500m)' : `Outside Geofence (${formattedDistance})`}
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Site Manager</span>
                  <span className="font-semibold text-slate-800">{site.manager}</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Working Hours</span>
                  <span className="font-semibold text-slate-800">{site.workingHours}</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Staff Assigned</span>
                  <span className="font-semibold text-brand-600">{site.assignedStaffCount} Field Technicians</span>
                </div>
              </div>

              {/* Button: "Get Directions" */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={Navigation}
                  onClick={handleGetDirections}
                  className="bg-brand-500 hover:bg-brand-600 text-sm font-semibold shadow-md"
                >
                  Get Directions (Mappls / Google Maps)
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (6 cols): Interactive Substation Map & Navigation Preview */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-4 space-y-3 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Live GPS & Substation Route Map</h4>
                <p className="text-xs text-slate-500">
                  {hasLiveGps
                    ? `Live: ${formattedDistance} from assigned substation`
                    : 'Acquiring satellite lock...'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    refreshLocation();
                    showToast('Device GPS refreshed.', 'info');
                  }}
                  className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                  title="Refresh GPS Position"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isInGeofence
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-amber-700 bg-amber-50 border border-amber-200'
                  }`}
                >
                  {isInGeofence ? 'In 500m Zone' : 'Outside Geofence'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <InteractiveMap
                userLocation={hasLiveGps ? {
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  title: 'Your Live Location',
                } : null}
                siteLocation={{
                  latitude: site.latitude,
                  longitude: site.longitude,
                  name: site.name,
                  address: site.address,
                }}
                height="420px"
                showRoute={true}
                geofenceRadius={site.attendanceRadius || 500}
              />
            </div>

            <p className="text-xs text-slate-500 pt-1 leading-relaxed">
              {hasLiveGps
                ? isInGeofence
                  ? `You are currently within the ${site.attendanceRadius || 500}m authorized geofence of ${site.name}.`
                  : `You are currently ${formattedDistance} away from ${site.name}. Attendance check-in requires physically being within ${site.attendanceRadius || 500} meters of the substation.`
                : `Field technicians must be within ${site.attendanceRadius || 500} meters of this marker to submit attendance.`}
            </p>
          </Card>

          {/* Site Manager Direct Contact Card */}
          <Card className="p-5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm">
                SP
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{site.manager}</p>
                <p className="text-slate-500">Site Operations Supervisor • Pune - Phase 1</p>
                <p className="text-[11px] text-brand-600 mt-0.5">{site.managerPhone}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Phone}
              onClick={() => showToast(`Calling ${site.manager}...`)}
              className="text-xs"
            >
              Contact
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignedSite;
