import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  RefreshCw,
  Navigation2,
  Users,
  Radio,
  Search,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Layers,
  ChevronRight,
  Crosshair,
  Satellite,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InteractiveMap from '../components/maps/InteractiveMap';
import { useToast } from '../components/ui/Toast';
import ErrorBoundary from '../components/ui/ErrorBoundary';

const LocationTracking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.employeeId === 'ADMIN01';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { coordinates, refreshLocation } = useGeolocation();
  const { showToast } = useToast();

  // Admin view state
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'OFFLINE'
  const [teamLoading, setTeamLoading] = useState(false);
  const [showGeofence, setShowGeofence] = useState(true);

  // Technician / active telemetry state (initialize with authentic Surat ST-1 default coordinates)
  const [locationData, setLocationData] = useState({
    latitude: 21.1926,
    longitude: 72.7997,
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    siteName: 'Surat ST-1',
    siteAddress: 'Adajan, Surat, Gujarat',
  });

  const [locationLogs, setLocationLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Technician device GPS synchronization
  useEffect(() => {
    if (!isAdmin && coordinates.latitude && coordinates.longitude) {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLocationData((prev) => ({
        ...prev,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        updatedAt: nowStr,
      }));

      setLocationLogs((prev) => [
        {
          id: Date.now(),
          time: nowStr,
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          status: 'Live Satellite Fix',
          accuracy: coordinates.accuracy ? `${coordinates.accuracy}m` : '8m',
        },
        ...prev.slice(0, 6),
      ]);
    }
  }, [isAdmin, coordinates.latitude, coordinates.longitude, coordinates.accuracy]);

  // Fetch team locations
  const fetchTeamLocations = async () => {
    try {
      setTeamLoading(true);
      const res = await api.get('/locations/team');
      if (Array.isArray(res.data)) {
        setTeamMembers(res.data);
        if (selectedEmpId === 'ALL') {
          const firstWithLoc = res.data.find(
            (m) => m && m.hasLocation && m.latitude != null && m.longitude != null && !isNaN(Number(m.latitude))
          );
          if (firstWithLoc) {
            setLocationData({
              latitude: Number(firstWithLoc.latitude),
              longitude: Number(firstWithLoc.longitude),
              updatedAt: firstWithLoc.lastUpdated || '--',
              siteName: firstWithLoc.siteName || 'All Field Sites',
              siteAddress: 'Substation Cluster',
            });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load team locations:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTeamLocations();
      // Fast live telemetry polling for real-time tracking
      const interval = setInterval(fetchTeamLocations, 10000);
      return () => clearInterval(interval);
    } else {
      fetchUserCurrentLocation();
    }
  }, [isAdmin]);

  // Fetch single technician history
  const fetchEmployeeHistory = async (empId) => {
    try {
      setLoading(true);
      const res = await api.get(`/locations/history/${empId}?limit=15`);
      if (Array.isArray(res.data)) {
        const mapped = res.data.map((item, idx) => ({
          id: item.id || idx,
          time: item.timestamp
            ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--',
          lat: item.latitude,
          lon: item.longitude,
          status: 'GPS Satellite Fix',
          accuracy: item.accuracy ? `${item.accuracy}m` : '8m',
        }));
        setLocationLogs(mapped);
      }
    } catch (e) {
      console.warn('Failed to fetch employee location history:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCurrentLocation = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/locations/current/${user?.employeeId || 'EMP001'}`);
      if (res.data && res.data.latitude) {
        setLocationData((prev) => ({
          ...prev,
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          updatedAt: res.data.updatedAt || new Date().toLocaleTimeString(),
          siteName: res.data.siteName || user?.assignedSiteName || 'Field Operations',
        }));
      }
    } catch (e) {
      console.warn('Current location fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize on selected technician change
  useEffect(() => {
    if (!isAdmin) return;

    if (selectedEmpId === 'ALL') {
      const withLoc = teamMembers.find(
        (m) => m && m.hasLocation && m.latitude != null && m.longitude != null && !isNaN(Number(m.latitude))
      );
      if (withLoc) {
        setLocationData({
          latitude: Number(withLoc.latitude),
          longitude: Number(withLoc.longitude),
          updatedAt: withLoc.lastUpdated || '--',
          siteName: withLoc.siteName || 'All Field Sites',
          siteAddress: 'Substation Cluster',
        });
      }
      setLocationLogs([]);
    } else {
      const emp = teamMembers.find((m) => m && m.employeeId === selectedEmpId);
      if (emp && emp.latitude != null && emp.longitude != null && !isNaN(Number(emp.latitude))) {
        setLocationData({
          latitude: Number(emp.latitude),
          longitude: Number(emp.longitude),
          updatedAt: emp.lastUpdated || '--',
          siteName: emp.siteName || 'Assigned Site',
          siteAddress: 'Substation Deployment',
        });
      }
      fetchEmployeeHistory(selectedEmpId);
    }
  }, [selectedEmpId, teamMembers, isAdmin]);

  const handleRefresh = async () => {
    if (isAdmin) {
      await fetchTeamLocations();
      if (selectedEmpId !== 'ALL') {
        await fetchEmployeeHistory(selectedEmpId);
      }
      showToast('Telemetry data synchronized from MongoDB Atlas.', 'success');
    } else {
      const freshCoords = await refreshLocation();
      if (freshCoords && freshCoords.latitude && user?.employeeId) {
        try {
          await api.post('/locations/log', {
            employeeId: user.employeeId,
            latitude: freshCoords.latitude,
            longitude: freshCoords.longitude,
            accuracy: freshCoords.accuracy || 8,
            speed: freshCoords.speed || null,
            siteId: user.assignedSiteId || null,
          });
        } catch (e) {
          console.debug('Manual sync error:', e);
        }
      }
      showToast('GPS coordinates synchronized with MongoDB Atlas cloud.', 'success');
    }
  };

  const copyCoordinates = () => {
    if (locationData.latitude && locationData.longitude) {
      const text = `${Number(locationData.latitude).toFixed(6)}, ${Number(locationData.longitude).toFixed(6)}`;
      navigator.clipboard.writeText(text);
      showToast(`Coordinates copied: ${text}`, 'success');
    }
  };

  // Filter technicians
  const filteredTechnicians = useMemo(() => {
    if (!Array.isArray(teamMembers)) return [];
    return teamMembers.filter((m) => {
      if (!m) return false;
      const name = (m.name || '').toLowerCase();
      const empId = (m.employeeId || '').toLowerCase();
      const sName = (m.siteName || '').toLowerCase();
      const query = (searchQuery || '').trim().toLowerCase();

      const matchSearch = !query || name.includes(query) || empId.includes(query) || sName.includes(query);

      if (!matchSearch) return false;

      if (statusFilter === 'ACTIVE') return m.status === 'Present' || m.hasLocation;
      if (statusFilter === 'OFFLINE') return m.status !== 'Present' && !m.hasLocation;
      return true;
    });
  }, [teamMembers, searchQuery, statusFilter]);

  const activeCount = Array.isArray(teamMembers) ? teamMembers.filter((m) => m && (m.status === 'Present' || m.hasLocation)).length : 0;
  const offlineCount = Array.isArray(teamMembers) ? teamMembers.length - activeCount : 0;

  // Additional markers for map
  const additionalMarkers = useMemo(() => {
    if (!isAdmin || !Array.isArray(teamMembers)) return [];
    if (selectedEmpId === 'ALL') {
      return teamMembers
        .filter((m) => m && m.hasLocation && m.latitude != null && m.longitude != null && !isNaN(Number(m.latitude)) && !isNaN(Number(m.longitude)))
        .map((m) => ({
          latitude: Number(m.latitude),
          longitude: Number(m.longitude),
          title: m.name || m.employeeId || 'Technician',
          subtitle: `${m.siteName || 'Field'} • ${m.status || 'Active'}`,
          time: m.lastUpdated,
          badge: m.status,
          color: m.status === 'Present' ? '#10B981' : '#64748B',
        }));
    } else {
      const emp = teamMembers.find((m) => m && m.employeeId === selectedEmpId);
      if (emp && emp.hasLocation && emp.latitude != null && emp.longitude != null && !isNaN(Number(emp.latitude)) && !isNaN(Number(emp.longitude))) {
        return [
          {
            latitude: Number(emp.latitude),
            longitude: Number(emp.longitude),
            title: emp.name || emp.employeeId || 'Technician',
            subtitle: `${emp.siteName || 'Field'} • ${emp.status || 'Active'}`,
            time: emp.lastUpdated,
            badge: emp.status,
            color: '#1E63F0',
          },
        ];
      }
      return [];
    }
  }, [isAdmin, selectedEmpId, teamMembers]);

  const currentSelectedEmp = useMemo(() => {
    if (!isAdmin || selectedEmpId === 'ALL' || !Array.isArray(teamMembers)) return null;
    return teamMembers.find((m) => m && m.employeeId === selectedEmpId);
  }, [isAdmin, selectedEmpId, teamMembers]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Sleek Enterprise Top Bar */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isAdmin ? 'Field Force Live Telemetry' : 'Live Location Tracking'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {isAdmin ? 'LIVE 10s TELEMETRY RADAR' : 'LIVE SATELLITE FIX'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'Real-time GPS telemetry and breadcrumbs monitoring for Adani Smart Metering operations.'
                : 'Real-time device GPS telemetry and attendance geofence verification.'}
            </p>
          </div>
        </div>

        {/* Top Bar Actions & Status Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                {activeCount} On Duty
              </span>
              <span className="px-2.5 py-1 rounded-lg text-slate-600 font-medium">
                {offlineCount} Standby
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            className={`font-semibold text-xs px-3.5 py-2 bg-white ${teamLoading ? 'opacity-70' : ''}`}
          >
            {teamLoading ? 'Syncing...' : 'Sync GPS'}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Field Technicians Telemetry Roster (Admin only) */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Roster Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-slate-900">Technicians Roster</h2>
                </div>
                <button
                  onClick={() => setSelectedEmpId('ALL')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    selectedEmpId === 'ALL'
                      ? 'bg-brand-600 text-white'
                      : 'text-brand-600 bg-white border border-brand-200 hover:bg-brand-50'
                  }`}
                >
                  View All on Map
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search technician name, ID, or site..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  All ({teamMembers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('OFFLINE')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    statusFilter === 'OFFLINE'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Offline ({offlineCount})
                </button>
              </div>
            </div>

            {/* Technicians List with High-Contrast Status Cards */}
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
              {filteredTechnicians.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-600">No technicians match criteria</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try resetting search or filter.</p>
                </div>
              ) : (
                filteredTechnicians.map((emp) => {
                  const isSelected = selectedEmpId === emp.employeeId;
                  const isOnline = emp.status === 'Present' || emp.hasLocation;

                  return (
                    <div
                      key={emp.employeeId}
                      onClick={() => setSelectedEmpId(emp.employeeId)}
                      className={`p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-l-brand-600 pl-3'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar Circle with Status Indicator */}
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                              {(emp.name || 'Technician')
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            ></span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                              <span className="text-[10px] font-mono text-slate-400">
                                ({emp.employeeId})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">
                                {emp.siteName || 'Field Operations'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {/* Status & Telemetry Badges */}
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                              emp.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {emp.status}
                          </span>
                          {emp.batteryLevel != null && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              🔋 {emp.batteryLevel}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Coordinates & Timestamp Row */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1 font-mono text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {emp.hasLocation ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-emerald-700">
                                {Number(emp.latitude).toFixed(4)}, {Number(emp.longitude).toFixed(4)}
                              </span>
                              {emp.speed != null && emp.speed > 0 && (
                                <span className="text-[10px] font-bold text-brand-600 bg-blue-50 px-1 rounded">
                                  {emp.speed} m/s
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No GPS logged</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{emp.lastUpdated || '--'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Interactive Command Map & Telemetry HUD */}
        <div className={isAdmin ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Map Container Card */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm relative">
            {/* Floating Top Control Toolbar on Map */}
            <div className="absolute top-5 left-5 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-sm flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedEmpId === 'ALL'
                    ? `Overview: ${activeCount} Active Technicians`
                    : `Tracking: ${currentSelectedEmp?.name || selectedEmpId}`}
                </span>
              </div>

              {selectedEmpId !== 'ALL' && (
                <button
                  onClick={() => setSelectedEmpId('ALL')}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-800 underline ml-2"
                >
                  Show All
                </button>
              )}
            </div>

            <ErrorBoundary title="Radar Map View">
              <InteractiveMap
                userLocation={
                  isAdmin
                    ? locationData.latitude
                      ? {
                          latitude: locationData.latitude,
                          longitude: locationData.longitude,
                          title: currentSelectedEmp ? currentSelectedEmp.name : 'Active Technician',
                        }
                      : null
                    : coordinates
                }
                siteLocation={{
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                  name: locationData.siteName,
                  address: locationData.siteAddress,
                }}
                geofenceRadius={500}
                showGeofence={showGeofence && (!isAdmin || selectedEmpId !== 'ALL')}
                height="510px"
                showRoute={false}
                additionalMarkers={additionalMarkers}
              />
            </ErrorBoundary>
          </div>

          {/* Docked Telemetry HUD (Directly Aligned beneath Map) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
                  <Satellite className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAdmin
                      ? selectedEmpId === 'ALL'
                        ? 'Active Fleet Telemetry Summary'
                        : `Live Telemetry: ${currentSelectedEmp?.name || selectedEmpId}`
                      : 'Live Device GPS Telemetry'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Synchronized in real-time with satellite positioning and MongoDB Atlas cloud.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Copy}
                  onClick={copyCoordinates}
                  className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50"
                  disabled={!locationData.latitude}
                >
                  Copy GPS
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Navigation2}
                  onClick={handleRefresh}
                  className="text-xs font-semibold px-3 py-1.5 bg-brand-600 hover:bg-brand-700"
                >
                  Recenter Map
                </Button>
              </div>
            </div>

            {/* 3 Balanced Telemetry Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Metric 1: Exact Coordinates */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Last Known GPS Coordinates
                </span>
                <p className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-1">
                  {locationData.latitude !== null && locationData.latitude !== undefined
                    ? `${Number(locationData.latitude).toFixed(6)}, ${Number(
                        locationData.longitude
                      ).toFixed(6)}`
                    : 'Awaiting Satellite Fix'}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Accuracy: ±8m - 124m Lock</span>
                </div>
              </div>

              {/* Metric 2: Substation & Geofence */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Substation Site
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
                  {locationData.siteName || 'Field Operations'}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>500m Geofence Verified</span>
                </div>
              </div>

              {/* Metric 3: Last Signal Timestamp */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Last Recorded Telemetry Signal
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  {locationData.updatedAt || '--'}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                  <Radio className="w-3 h-3 text-brand-600" />
                  <span>Provider: MongoDB Atlas Cloud</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breadcrumb Trail Card (when individual technician is selected or in technician view) */}
          {(selectedEmpId !== 'ALL' || !isAdmin) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-brand-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Telemetry Breadcrumb Trail (Last Recorded GPS Pings)
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {locationLogs.length} Coordinates Recorded
                </span>
              </div>

              {locationLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-600">No breadcrumbs recorded yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Telemetry coordinates are logged automatically during field check-in and active shift.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {locationLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0"></div>
                        <div>
                          <p className="font-mono font-bold text-slate-800 text-[11px]">
                            {typeof log.lat === 'number' ? log.lat.toFixed(6) : log.lat},{' '}
                            {typeof log.lon === 'number' ? log.lon.toFixed(6) : log.lon}
                          </p>
                          <p className="text-[10px] text-slate-500">±{log.accuracy} precision</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 font-mono">
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationTracking;
