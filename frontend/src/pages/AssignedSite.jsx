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
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [assignedSites, setAssignedSites] = useState([]);
  const [activeSiteIndex, setActiveSiteIndex] = useState(0);

  const [site, setSite] = useState(() => {
    try {
      const saved = sessionStorage.getItem('adani_assigned_site') || localStorage.getItem('adani_assigned_site');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      id: user?.assignedSiteId || 'site_2949e4fc',
      name: user?.assignedSiteName || 'Surat ST-1',
      code: 'ADN-SITE-010',
      address: 'Adajan, Surat, Gujarat',
      distance: '--',
      manager: 'Dhaval Patel',
      managerPhone: '+91 98220 12345',
      managerEmail: 'ops.surat@adani.com',
      workingHours: '09:00 AM - 06:00 PM',
      latitude: 21.1926,
      longitude: 72.7997,
      attendanceRadius: 500,
      imageUrl: '/assets/site_photo.jpg',
      assignedStaffCount: 16,
    };
  });

  const { coordinates, refreshLocation } = useGeolocation({ assignedSite: site });

  // Anchor live coordinates to assigned site
  const siteLat = site.latitude !== undefined && site.latitude !== null ? Number(site.latitude) : null;
  const siteLng = site.longitude !== undefined && site.longitude !== null ? Number(site.longitude) : null;
  const hasSiteCoords = siteLat !== null && siteLng !== null;

  let activeLat = coordinates.latitude;
  let activeLng = coordinates.longitude;

  if (activeLat === null || activeLng === null) {
    if (hasSiteCoords) {
      activeLat = siteLat;
      activeLng = siteLng;
    }
  }

  const hasLiveGps = activeLat !== null && activeLng !== null;

  // Real-time distance calculation between live user GPS and assigned site
  const distanceMeters = useMemo(() => {
    if (hasLiveGps && siteLat !== null && siteLng !== null) {
      return calculateDistanceMeters(activeLat, activeLng, siteLat, siteLng);
    }
    return null;
  }, [hasLiveGps, activeLat, activeLng, siteLat, siteLng]);

  const formattedDistance = distanceMeters !== null ? formatDistance(distanceMeters) : 'Acquiring GPS...';
  const isInGeofence = distanceMeters !== null && distanceMeters <= (site.attendanceRadius || 500);

  useEffect(() => {
    if (refreshUser) refreshUser();
    fetchAssignedSite();
  }, [user?.employeeId, user?.assignedSiteId, user?.assignedSiteIds]);

  const fetchAssignedSite = async () => {
    try {
      const empId = user?.employeeId || 'EMP001';
      // 1. Fetch authorized assigned sites for this technician
      const res = await api.get('/sites', {
        params: { employee_id: empId }
      });
      if (res.data && res.data.length > 0) {
        setAssignedSites(res.data);
        setSiteData(res.data[0]);
        return;
      }

      // 2. Fallback: Query /employees/${empId}
      const empRes = await api.get(`/employees/${empId}`);
      if (empRes.data?.assignedSites && empRes.data.assignedSites.length > 0) {
        setAssignedSites(empRes.data.assignedSites);
        setSiteData(empRes.data.assignedSites[0]);
        return;
      }
      if (empRes.data?.assignedSiteIds && empRes.data.assignedSiteIds.length > 0) {
        const fetchedList = [];
        for (const sid of empRes.data.assignedSiteIds) {
          try {
            const sRes = await api.get(`/sites/${sid}`);
            if (sRes.data) fetchedList.push(sRes.data);
          } catch (_) {}
        }
        if (fetchedList.length > 0) {
          setAssignedSites(fetchedList);
          setSiteData(fetchedList[0]);
          return;
        }
      }
    } catch (e) {
      console.warn('Fallback to baseline assigned site');
    }
  };

  const setSiteData = (s) => {
    try {
      sessionStorage.setItem('adani_assigned_site', JSON.stringify(s));
      localStorage.setItem('adani_assigned_site', JSON.stringify(s));
    } catch (_) {}
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

  const selectActiveSite = (idx) => {
    if (assignedSites[idx]) {
      setActiveSiteIndex(idx);
      setSiteData(assignedSites[idx]);
    }
  };

  const isAssigned = 
    (user?.assignedSiteIds && user.assignedSiteIds.includes(site.id)) ||
    (user?.assignedSiteId && site.id === user.assignedSiteId) ||
    assignedSites.some(s => s.id === site.id);

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

      {/* Multiple Substation Switcher Bar when user has >1 assigned sites */}
      {assignedSites.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-brand-600" />
              Your Authorized Substations ({assignedSites.length} Assigned)
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Click any substation to inspect live geofence, coordinates & navigation
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {assignedSites.map((sItem, sIdx) => {
              const isSelected = activeSiteIndex === sIdx;
              const sLat = Number(sItem.latitude);
              const sLng = Number(sItem.longitude);
              const sDistMeters = (hasLiveGps && !isNaN(sLat) && !isNaN(sLng))
                ? calculateDistanceMeters(activeLat, activeLng, sLat, sLng)
                : null;
              const sDist = sDistMeters !== null ? formatDistance(sDistMeters) : null;
              const sInGeofence = sDistMeters !== null && sDistMeters <= (sItem.attendanceRadius || 500);

              return (
                <button
                  key={sItem.id || sIdx}
                  type="button"
                  onClick={() => selectActiveSite(sIdx)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-xs ring-1 ring-brand-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <span className="block leading-tight">{sItem.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">
                      {sItem.code || 'ADN-SITE'}
                    </span>
                  </div>
                  {sDist && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      sInGeofence
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isSelected
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {sDist}
                    </span>
                  )}
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Substation Verification Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Currently Selected Substation:
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
                      ? `${activeLat.toFixed(4)}, ${activeLng.toFixed(4)}`
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
                    if (refreshUser) refreshUser();
                    fetchAssignedSite();
                    showToast('Device GPS and site assignment refreshed.', 'info');
                  }}
                  className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                  title="Refresh GPS Position & Site Data"
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
                  latitude: activeLat,
                  longitude: activeLng,
                  title: 'Your Live Location (Bangalore)',
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

      {/* Complete Overview of All Authorized Substations */}
      {assignedSites.length > 1 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <span>All Authorized Substations ({assignedSites.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                You are assigned to work across {assignedSites.length} official substations. You can check in at any of these authorized locations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedSites.map((sub, sIdx) => {
              const isSelected = activeSiteIndex === sIdx;
              const sLat = Number(sub.latitude);
              const sLng = Number(sub.longitude);
              const sDistMeters = (hasLiveGps && !isNaN(sLat) && !isNaN(sLng))
                ? calculateDistanceMeters(activeLat, activeLng, sLat, sLng)
                : null;
              const sDist = sDistMeters !== null ? formatDistance(sDistMeters) : '--';
              const sInGeofence = sDistMeters !== null && sDistMeters <= (sub.attendanceRadius || 500);

              return (
                <Card
                  key={sub.id || sIdx}
                  className={`p-4 space-y-3 transition-all border ${
                    isSelected
                      ? 'border-brand-500 shadow-sm ring-1 ring-brand-500 bg-brand-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{sub.name}</h4>
                      <span className="font-mono text-[10px] text-brand-600 font-bold block mt-0.5">
                        {sub.code || 'ADN-SITE'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        sInGeofence
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {sInGeofence ? '✓ In Geofence' : 'Outside Radius'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{sub.address || 'Field Substation'}</span>
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Distance:</span>
                      <span className="font-mono font-bold text-slate-700">{sDist}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Allowed Radius:</span>
                      <span className="font-mono font-semibold text-slate-700">{sub.attendanceRadius || 500}m</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant={isSelected ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => selectActiveSite(sIdx)}
                      className="flex-1 text-xs py-1.5"
                    >
                      {isSelected ? 'Viewing' : 'View on Map'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/check-in?siteId=${sub.id}`)}
                      className="flex-1 text-xs py-1.5 bg-emerald-600 hover:bg-emerald-500"
                    >
                      Check-In Here
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedSite;
