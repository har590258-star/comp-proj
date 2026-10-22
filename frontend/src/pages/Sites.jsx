import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Plus,
  MapPin,
  Clock,
  User,
  Shield,
  Edit2,
  Trash2,
  Navigation,
  ExternalLink,
  LocateFixed,
  Sparkles,
  Search,
  X,
  Loader2,
  Users,
  Check,
  CheckCircle2,
  UserCheck,
  Filter,
  ArrowRight,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import InteractiveMap from '../components/maps/InteractiveMap';
import { LoadingSpinner, EmptyState } from '../components/ui/FeedbackStates';
import { useToast } from '../components/ui/Toast';

const PRESET_LOCATIONS = [
  { name: 'Surat ST-1', latitude: 21.1926, longitude: 72.7997, address: 'Adajan, Surat, Gujarat' },
  { name: 'Pune Phase 1', latitude: 18.5204, longitude: 73.8567, address: 'Hinjewadi, Pune, Maharashtra' },
  { name: 'Pune Phase 2', latitude: 18.5590, longitude: 73.7868, address: 'Baner, Pune, Maharashtra' },
  { name: 'Ahmedabad Solar', latitude: 23.0225, longitude: 72.5714, address: 'SG Highway, Ahmedabad, Gujarat' },
  { name: 'Mumbai Central Hub', latitude: 19.0657, longitude: 72.8687, address: 'Bandra Kurla Complex, Mumbai, Maharashtra' },
];

const LOCAL_SEARCH_INDEX = [
  { name: 'Surat ST-1 Substation', address: 'Adajan, Surat, Gujarat', latitude: 21.1926, longitude: 72.7997 },
  { name: 'Surat Central', address: 'Surat, Gujarat, India', latitude: 21.1702, longitude: 72.8311 },
  { name: 'Hazira Industrial Zone', address: 'Hazira, Surat, Gujarat', latitude: 21.1098, longitude: 72.6465 },
  { name: 'Mundra Port & SEZ', address: 'Mundra, Kutch, Gujarat', latitude: 22.8396, longitude: 69.7246 },
  { name: 'Ahmedabad Solar Substation', address: 'SG Highway, Ahmedabad, Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Ahmedabad Central', address: 'Ahmedabad, Gujarat, India', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Gandhinagar Energy Park', address: 'Gandhinagar, Gujarat', latitude: 23.2156, longitude: 72.6369 },
  { name: 'Vadodara Distribution Hub', address: 'Vadodara, Gujarat', latitude: 22.3072, longitude: 73.1812 },
  { name: 'Dahej Industrial Zone', address: 'Dahej, Bharuch, Gujarat', latitude: 21.7126, longitude: 72.5855 },
  { name: 'Rajkot Substation', address: 'Rajkot, Gujarat', latitude: 22.3039, longitude: 70.8022 },
  { name: 'Pune Phase 1 (Hinjewadi)', address: 'Hinjewadi Tech Park, Pune, Maharashtra', latitude: 18.5913, longitude: 73.7389 },
  { name: 'Pune Phase 2 (Baner)', address: 'Baner, Pune, Maharashtra', latitude: 18.5590, longitude: 73.7868 },
  { name: 'Pune Central', address: 'Shivajinagar, Pune, Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Mumbai Central Hub (BKC)', address: 'Bandra Kurla Complex, Mumbai, Maharashtra', latitude: 19.0657, longitude: 72.8687 },
  { name: 'Andheri West Substation', address: 'Andheri West, Mumbai, Maharashtra', latitude: 19.1136, longitude: 72.8697 },
  { name: 'Navi Mumbai Data Center', address: 'Airoli, Navi Mumbai, Maharashtra', latitude: 19.1559, longitude: 72.9986 },
  { name: 'Nagpur Solar Park', address: 'MIHAN, Nagpur, Maharashtra', latitude: 21.0545, longitude: 79.0558 },
  { name: 'Delhi NCR Hub', address: 'Barakhamba Road, Connaught Place, New Delhi', latitude: 28.6304, longitude: 77.2177 },
  { name: 'Gurugram Smart Hub', address: 'Cyber City, Gurugram, Haryana', latitude: 28.4950, longitude: 77.0895 },
  { name: 'Noida Tech Center', address: 'Sector 62, Noida, Uttar Pradesh', latitude: 28.6280, longitude: 77.3649 },
  { name: 'Jaipur Distribution Hub', address: 'Sitapura Industrial Area, Jaipur, Rajasthan', latitude: 26.7900, longitude: 75.8400 },
  { name: 'Bengaluru Tech Substation', address: 'Whitefield, Bengaluru, Karnataka', latitude: 12.9698, longitude: 77.7499 },
  { name: 'Hyderabad Substation', address: 'HITEC City, Hyderabad, Telangana', latitude: 17.4435, longitude: 78.3772 },
  { name: 'Chennai Grid', address: 'OMR, Chennai, Tamil Nadu', latitude: 12.9150, longitude: 80.2280 },
  { name: 'Kolkata Regional Hub', address: 'Salt Lake Sector V, Kolkata, West Bengal', latitude: 22.5867, longitude: 88.4312 },
];

const Sites = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSupervisor, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('sites'); // 'sites' | 'assignments'

  const [sites, setSites] = useState([
    {
      id: 'site_pune_1',
      name: 'Pune - Phase 1',
      code: 'ADN-PS-001',
      address: 'Hinjewadi, Pune, Maharashtra',
      latitude: 18.5204,
      longitude: 73.8567,
      manager: 'Suresh Patil',
      workingHours: '09:00 AM - 06:00 PM',
      attendanceRadius: 500,
      status: 'Active',
      assignedEmployeesCount: 16,
      imageUrl: '/assets/site_photo.jpg',
    },
    {
      id: 'site_pune_2',
      name: 'Pune - Phase 2',
      code: 'ADN-PS-002',
      address: 'Baner, Pune, Maharashtra',
      latitude: 18.5590,
      longitude: 73.7868,
      manager: 'Rajesh Deshmukh',
      workingHours: '09:00 AM - 06:00 PM',
      attendanceRadius: 600,
      status: 'Active',
      assignedEmployeesCount: 10,
      imageUrl: '/assets/site_photo.jpg',
    },
    {
      id: 'site_mumbai_1',
      name: 'Mumbai - Central Hub',
      code: 'ADN-MH-001',
      address: 'Bandra Kurla Complex, Mumbai, Maharashtra',
      latitude: 19.0657,
      longitude: 72.8687,
      manager: 'Ramesh Kulkarni',
      workingHours: '09:00 AM - 06:00 PM',
      attendanceRadius: 500,
      status: 'Active',
      assignedEmployeesCount: 2,
      imageUrl: '/assets/site_photo.jpg',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [siteToDelete, setSiteToDelete] = useState(null);

  // Employee Site Allocation State
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empSiteFilter, setEmpSiteFilter] = useState('all');
  const [empRoleFilter, setEmpRoleFilter] = useState('all');

  // Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedEmpForReassign, setSelectedEmpForReassign] = useState(null);
  const [targetPrimarySiteId, setTargetPrimarySiteId] = useState('');
  const [targetAllowedSiteIds, setTargetAllowedSiteIds] = useState([]);
  const [savingReassign, setSavingReassign] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    latitude: 18.5204,
    longitude: 73.8567,
    manager: '',
    workingHours: '09:00 AM - 06:00 PM',
    attendanceRadius: 500,
    status: 'Active',
  });

  useEffect(() => {
    fetchSites();
    fetchEmployees();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sites');
      if (res.data && res.data.length > 0) {
        setSites(res.data);
      }
    } catch (e) {
      console.warn('Using baseline sites');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmpLoading(true);
      const res = await api.get('/employees');
      if (res.data && Array.isArray(res.data)) {
        setEmployees(res.data);
      }
    } catch (e) {
      console.warn('Could not load employees:', e);
    } finally {
      setEmpLoading(false);
    }
  };

  const openReassignModal = (emp) => {
    setSelectedEmpForReassign(emp);
    const primId = emp.assignedSiteId || sites[0]?.id || 'site_pune_1';
    setTargetPrimarySiteId(primId);
    let allowed = Array.isArray(emp.assignedSiteIds) && emp.assignedSiteIds.length > 0
      ? [...emp.assignedSiteIds]
      : (primId ? [primId] : []);
    if (primId && !allowed.includes(primId)) {
      allowed.unshift(primId);
    }
    setTargetAllowedSiteIds(allowed);
    setReassignModalOpen(true);
  };

  const handleSelectPrimarySite = (siteId) => {
    setTargetPrimarySiteId(siteId);
    if (siteId && !targetAllowedSiteIds.includes(siteId)) {
      setTargetAllowedSiteIds((prev) => [siteId, ...prev]);
    }
  };

  const toggleAllowedSite = (siteId) => {
    if (targetAllowedSiteIds.includes(siteId)) {
      if (siteId === targetPrimarySiteId) {
        const remaining = targetAllowedSiteIds.filter((id) => id !== siteId);
        if (remaining.length > 0) {
          setTargetPrimarySiteId(remaining[0]);
          setTargetAllowedSiteIds(remaining);
        } else {
          showToast('Employee must have at least one assigned site.', 'error');
        }
      } else {
        setTargetAllowedSiteIds((prev) => prev.filter((id) => id !== siteId));
      }
    } else {
      setTargetAllowedSiteIds((prev) => [...prev, siteId]);
    }
  };

  const handleSaveReassignment = async (e) => {
    e.preventDefault();
    if (!selectedEmpForReassign || !targetPrimarySiteId) {
      showToast('Please select a primary designated site', 'error');
      return;
    }

    try {
      setSavingReassign(true);
      const finalSiteIds = [
        targetPrimarySiteId,
        ...targetAllowedSiteIds.filter((id) => id !== targetPrimarySiteId),
      ];

      const chosenSite = sites.find((s) => s.id === targetPrimarySiteId);
      const payload = {
        assignedSiteId: targetPrimarySiteId,
        assignedSiteName: chosenSite?.name || selectedEmpForReassign.assignedSiteName,
        assignedSiteIds: finalSiteIds,
      };

      const empIdentifier = selectedEmpForReassign.id || selectedEmpForReassign.employeeId;
      await api.put(`/employees/${empIdentifier}`, payload);

      showToast(`Sites updated for ${selectedEmpForReassign.name}!`, 'success');
      setReassignModalOpen(false);

      // Refresh data
      await fetchEmployees();
      await fetchSites();
      if (user?.employeeId === selectedEmpForReassign.employeeId && refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      console.error('Failed to update employee sites:', err);
      showToast('Failed to update employee sites', 'error');
    } finally {
      setSavingReassign(false);
    }
  };

  // Filtered employees calculation
  const filteredEmployees = employees.filter((emp) => {
    if (empSearchQuery.trim()) {
      const q = empSearchQuery.toLowerCase();
      const matchName = emp.name?.toLowerCase().includes(q);
      const matchId = emp.employeeId?.toLowerCase().includes(q);
      const matchPhone = emp.phone?.toLowerCase().includes(q);
      const matchDesig = emp.designation?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPhone && !matchDesig) return false;
    }

    if (empSiteFilter !== 'all') {
      const inPrimary = emp.assignedSiteId === empSiteFilter;
      const inAllowed = Array.isArray(emp.assignedSiteIds) && emp.assignedSiteIds.includes(empSiteFilter);
      const matchSiteDoc = sites.find((s) => s.id === empSiteFilter);
      const inName = matchSiteDoc && (emp.assignedSiteName === matchSiteDoc.name || (Array.isArray(emp.assignedSiteNames) && emp.assignedSiteNames.includes(matchSiteDoc.name)));
      if (!inPrimary && !inAllowed && !inName) return false;
    }

    if (empRoleFilter !== 'all') {
      if (emp.role !== empRoleFilter) return false;
    }

    return true;
  });

  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);

  const openAddModal = () => {
    setEditingSite(null);
    setSearchLocationQuery('');
    setSearchResults([]);
    setShowResultsDropdown(false);
    setFormData({
      name: '',
      code: `ADN-SITE-00${sites.length + 1}`,
      address: '',
      latitude: 21.1926,
      longitude: 72.7997,
      manager: '',
      workingHours: '09:00 AM - 06:00 PM',
      attendanceRadius: 500,
      status: 'Active',
    });
    setModalOpen(true);
  };

  const openEditModal = (site) => {
    setEditingSite(site);
    setSearchLocationQuery(site.name || '');
    setSearchResults([]);
    setShowResultsDropdown(false);
    setFormData({
      name: site.name,
      code: site.code,
      address: site.address,
      latitude: Number(site.latitude) || 21.1926,
      longitude: Number(site.longitude) || 72.7997,
      manager: site.manager,
      workingHours: site.workingHours,
      attendanceRadius: Number(site.attendanceRadius) || 500,
      status: site.status,
    });
    setModalOpen(true);
  };

  const searchTimeoutRef = React.useRef(null);

  const handleQueryChange = (val) => {
    setSearchLocationQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearchLocation(val, false);
      }, 350);
    } else {
      setSearchResults([]);
      setShowResultsDropdown(false);
    }
  };

  const handleSearchLocation = async (queryOverride, autoSelect = false) => {
    const q = (typeof queryOverride === 'string' ? queryOverride : searchLocationQuery).trim();
    if (!q || q.length < 2) {
      return;
    }

    setSearching(true);
    setShowResultsDropdown(true);

    // 1. Search local curated dictionary for instant result
    const qLower = q.toLowerCase();
    const localMatches = LOCAL_SEARCH_INDEX.filter(
      (item) =>
        item.name.toLowerCase().includes(qLower) ||
        item.address.toLowerCase().includes(qLower)
    );

    let onlineResults = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=4&countrycodes=in&addressdetails=1`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        onlineResults = data.map((item) => ({
          name: item.display_name.split(',')[0],
          address: item.display_name,
          latitude: Number(parseFloat(item.lat).toFixed(6)),
          longitude: Number(parseFloat(item.lon).toFixed(6)),
        }));
      }
    } catch (err) {
      // Ignore network abort, fallback to local index
    } finally {
      setSearching(false);
    }

    // Merge online + local
    const combined = [...onlineResults];
    for (const lm of localMatches) {
      if (!combined.some((c) => Math.abs(c.latitude - lm.latitude) < 0.01 && Math.abs(c.longitude - lm.longitude) < 0.01)) {
        combined.push(lm);
      }
    }

    // Keep strictly 2 search options
    const top2Results = combined.slice(0, 2);
    setSearchResults(top2Results);

    // If autoSelect (user pressed Enter or clicked Search & Navigate)
    if (autoSelect && top2Results.length > 0) {
      selectLocation(top2Results[0], q);
    } else if (autoSelect && q) {
      // If no geocoder match found but user searched, still name whatever is searched
      setFormData((prev) => ({
        ...prev,
        name: q,
        address: prev.address || q,
      }));
    }
  };

  const selectLocation = (loc, customName) => {
    // Name whatever is searched
    const siteName = (customName || searchLocationQuery || '').trim() || loc.name;
    setFormData((prev) => ({
      ...prev,
      name: siteName,
      address: loc.address || siteName,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
    setSearchLocationQuery(siteName);
    setShowResultsDropdown(false);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const shortName = data.name || data.address?.suburb || data.address?.road || data.display_name.split(',')[0];
          return {
            displayName: data.display_name,
            shortName: shortName ? shortName.trim() : '',
          };
        }
      }
    } catch (_) {}
    return null;
  };

  const handlePinCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setSearching(true);
    showToast('Acquiring device GPS position...', 'info');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        // Immediately update coordinates
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        // Set placeholder while reverse geocoding resolves
        const initialText = `${lat}, ${lng}`;
        setSearchLocationQuery(initialText);
        setFormData((prev) => ({
          ...prev,
          address: initialText,
        }));

        // Reverse-geocode to fetch real street / city address
        const rev = await reverseGeocode(lat, lng);
        setSearching(false);

        if (rev && rev.displayName) {
          setSearchLocationQuery(rev.displayName);
          setFormData((prev) => ({
            ...prev,
            address: rev.displayName,
            name: prev.name ? prev.name : (rev.shortName || rev.displayName.split(',')[0]),
          }));
          showToast(`📍 Current location pinned: ${rev.shortName || 'GPS Location'}`, 'success');
        } else {
          // If reverse geocoding is unavailable, check local preset nearby
          const nearbyPreset = PRESET_LOCATIONS.find(
            (p) => Math.abs(p.latitude - lat) < 0.05 && Math.abs(p.longitude - lng) < 0.05
          );
          if (nearbyPreset) {
            setSearchLocationQuery(nearbyPreset.address);
            setFormData((prev) => ({
              ...prev,
              address: nearbyPreset.address,
              name: prev.name ? prev.name : nearbyPreset.name,
            }));
            showToast(`📍 Pinned near ${nearbyPreset.name}`, 'success');
          } else {
            const gpsLabel = `Current Location (${lat}, ${lng})`;
            setSearchLocationQuery(gpsLabel);
            setFormData((prev) => ({
              ...prev,
              address: gpsLabel,
              name: prev.name ? prev.name : 'Current Site Location',
            }));
            showToast(`📍 GPS tagged: ${lat}, ${lng}`, 'success');
          }
        }
      },
      (err) => {
        setSearching(false);
        showToast(`Could not acquire GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const applyPresetLocation = (preset) => {
    setFormData((prev) => ({
      ...prev,
      latitude: preset.latitude,
      longitude: preset.longitude,
      address: prev.address ? prev.address : preset.address,
    }));
    setSearchLocationQuery(preset.name);
    setShowResultsDropdown(false);
    showToast(`📍 Tagged ${preset.name} coordinates`, 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalAddress = (formData.address || searchLocationQuery || '').trim();
    const finalName = (formData.name || searchLocationQuery || finalAddress).trim();

    if (!finalName || !formData.code.trim()) {
      showToast('Site name and code are required.', 'error');
      return;
    }

    const payload = {
      ...formData,
      name: finalName,
      address: finalAddress || 'Field Operational Zone',
      latitude: Number(parseFloat(formData.latitude).toFixed(6)),
      longitude: Number(parseFloat(formData.longitude).toFixed(6)),
      attendanceRadius: parseFloat(formData.attendanceRadius) || 500,
    };

    try {
      if (editingSite) {
        await api.put(`/sites/${editingSite.id}`, payload);
        setSites((prev) =>
          prev.map((s) => (s.id === editingSite.id ? { ...s, ...payload } : s))
        );
        showToast(`Site ${payload.name} updated with tagged location!`);
      } else {
        const res = await api.post('/sites', payload);
        const newSite = {
          id: res.data?.id || `site_${Date.now()}`,
          assignedEmployeesCount: 0,
          ...payload,
        };
        setSites((prev) => [...prev, newSite]);
        showToast(`Site ${payload.name} created with tagged location!`);
      }
      setModalOpen(false);
    } catch (err) {
      // Optimistic update
      const newSite = {
        id: editingSite ? editingSite.id : `site_${Date.now()}`,
        assignedEmployeesCount: editingSite?.assignedEmployeesCount || 0,
        ...payload,
      };
      if (editingSite) {
        setSites((prev) => prev.map((s) => (s.id === editingSite.id ? newSite : s)));
      } else {
        setSites((prev) => [...prev, newSite]);
      }
      showToast(editingSite ? 'Site updated' : 'Site added');
      setModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!siteToDelete) return;
    try {
      await api.delete(`/sites/${siteToDelete.id}`);
      setSites((prev) => prev.filter((s) => s.id !== siteToDelete.id));
      showToast(`Site ${siteToDelete.name} deleted.`);
    } catch (e) {
      setSites((prev) => prev.filter((s) => s.id !== siteToDelete.id));
      showToast(`Site ${siteToDelete.name} deleted.`);
    } finally {
      setDeleteConfirmOpen(false);
      setSiteToDelete(null);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors border border-slate-200 shadow-2xs"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Site Management</h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80">
                {isSupervisor ? 'Supervisor Workspace' : 'Operations Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Smart Meter substations, geofencing & employee site allocations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'assignments' && (
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                fetchEmployees();
                fetchSites();
                showToast('Employee allocations synchronized', 'info');
              }}
              className="text-xs font-bold"
            >
              Sync Staff
            </Button>
          )}

          {activeTab === 'sites' && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openAddModal}
              className="bg-brand-500 text-xs font-semibold"
            >
              Add New Site
            </Button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('sites')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'sites'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Project Sites & Geofences</span>
          <span
            className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'sites' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {sites.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'assignments'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Site Allocation</span>
          <span
            className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'assignments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {employees.length}
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: Project Sites & Geofences Grid */}
      {/* ==================================================================== */}
      {activeTab === 'sites' && (
        <>
          {loading ? (
            <LoadingSpinner text="Loading project sites..." />
          ) : sites.length === 0 ? (
            <EmptyState
              title="No sites configured"
              description="Create your first project site to begin monitoring field technicians."
              actionLabel="Add Site"
              onAction={openAddModal}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sites.map((site) => (
                <Card key={site.id} className="p-0 overflow-hidden shadow-card flex flex-col justify-between">
                  {/* Site Image Header */}
                  <div className="relative h-36 w-full bg-slate-800 overflow-hidden">
                    <img
                      src={site.imageUrl || '/assets/site_photo.jpg'}
                      alt={site.name}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/20 to-transparent"></div>
                    <div className="absolute top-2.5 right-2.5">
                      <StatusBadge status={site.status} size="sm" />
                    </div>
                    <div className="absolute bottom-2.5 left-3 text-white">
                      <h4 className="text-sm font-bold tracking-tight">{site.name}</h4>
                      <p className="text-[10px] text-slate-300 font-mono">{site.code}</p>
                    </div>
                  </div>

                  {/* Site Details Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <span className="truncate">{site.address}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Manager:
                        </span>
                        <span className="font-semibold text-slate-800">{site.manager}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Hours:
                        </span>
                        <span className="font-semibold text-slate-800">{site.workingHours}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> Allowed Radius:
                        </span>
                        <span className="font-bold text-emerald-600">{site.attendanceRadius || 500}m</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 pt-1.5 border-t border-slate-100">
                        <span className="flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-brand-600" /> GPS Tag:
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                          title="View pinned location on Google Maps"
                        >
                          <span>{Number(site.latitude || 0).toFixed(4)}, {Number(site.longitude || 0).toFixed(4)}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </div>
                    </div>

                    {/* Footer Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEmpSiteFilter(site.id);
                          setActiveTab('assignments');
                        }}
                        className="text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer group"
                        title="View and reassign staff allocated to this site"
                      >
                        <Users className="w-3.5 h-3.5 text-brand-600 group-hover:scale-110 transition-transform" />
                        <span>{site.assignedEmployeesCount || 0} Staff Allocated</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEmpSiteFilter(site.id);
                            setActiveTab('assignments');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                          title="Allocate Employees to this Site"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(site)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Edit Site"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSiteToDelete(site);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Site"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: Employee Site Allocation (Supervisor / Admin Site Management) */}
      {/* ==================================================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Top KPI Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5 border-l-4 border-l-brand-600 bg-white">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Field Staff</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{employees.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">Installers & supervisors</p>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-emerald-600 bg-white">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Substations</p>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{sites.length}</p>
              <p className="text-[10px] text-slate-400 mt-1">Geofenced work zones</p>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-purple-600 bg-white">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Multi-Site Permitted</p>
              <p className="text-xl font-black text-purple-700 mt-0.5">
                {employees.filter((e) => (e.assignedSiteIds || []).length > 1).length}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Access to &gt;1 substation</p>
            </Card>

            <Card className="p-3.5 border-l-4 border-l-amber-600 bg-white">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supervisors</p>
              <p className="text-xl font-black text-amber-700 mt-0.5">
                {employees.filter((e) => e.role === 'supervisor').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Area operations leads</p>
            </Card>
          </div>

          {/* Search & Filter Toolbar */}
          <Card className="p-4 bg-white shadow-2xs">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, employee ID, phone or designation..."
                  value={empSearchQuery}
                  onChange={(e) => setEmpSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                />
                {empSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEmpSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={empSiteFilter}
                    onChange={(e) => setEmpSiteFilter(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="all">All Sites ({employees.length})</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.assignedEmployeesCount || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={empRoleFilter}
                  onChange={(e) => setEmpRoleFilter(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="technician">Technicians</option>
                  <option value="supervisor">Supervisors</option>
                </select>

                {(empSearchQuery || empSiteFilter !== 'all' || empRoleFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmpSearchQuery('');
                      setEmpSiteFilter('all');
                      setEmpRoleFilter('all');
                    }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 px-2.5 py-2 rounded-xl hover:bg-brand-50 border border-brand-200/60 whitespace-nowrap cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Employee List / Table */}
          {empLoading ? (
            <LoadingSpinner text="Loading employee allocations..." />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              title="No employees match your filter"
              description="Try adjusting your search query or selecting a different site filter."
              actionLabel="Show All Employees"
              onAction={() => {
                setEmpSearchQuery('');
                setEmpSiteFilter('all');
                setEmpRoleFilter('all');
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Employee / Role</th>
                      <th className="px-4 py-3.5">Primary Assigned Site</th>
                      <th className="px-4 py-3.5">Permitted Check-In Sites</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredEmployees.map((emp) => {
                      const isCurrentUser = user?.employeeId === emp.employeeId;
                      const isSuper = emp.role === 'supervisor';
                      const allowedSites = Array.isArray(emp.assignedSites) && emp.assignedSites.length > 0
                        ? emp.assignedSites.map((s) => s.name || s.id)
                        : (Array.isArray(emp.assignedSiteNames) && emp.assignedSiteNames.length > 0
                            ? emp.assignedSiteNames
                            : [emp.assignedSiteName || 'Pune - Phase 1']);

                      return (
                        <tr key={emp.employeeId} className={`hover:bg-slate-50/80 transition-colors ${isCurrentUser ? 'bg-brand-50/20' : ''}`}>
                          {/* Employee Info */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                                  isSuper
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-brand-100 text-brand-800 border-brand-200'
                                }`}
                              >
                                {emp.name ? emp.name.slice(0, 2).toUpperCase() : 'AD'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900 text-sm truncate">{emp.name}</p>
                                  {isCurrentUser && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                                  <span>{emp.employeeId}</span>
                                  <span>•</span>
                                  <span className="text-slate-600 font-sans font-medium">{emp.designation || 'Field Engineer'}</span>
                                  <span>•</span>
                                  <span
                                    className={`font-sans font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                      isSuper ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {isSuper ? 'Supervisor' : 'Technician'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Primary Assigned Site */}
                          <td className="px-4 py-3.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-50 border border-brand-200/80 text-brand-800 font-bold text-xs shadow-2xs">
                              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {emp.assignedSiteName || 'Unassigned'}
                              </span>
                            </div>
                          </td>

                          {/* Permitted Check-in Sites */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                              {allowedSites.slice(0, 2).map((siteName, idx) => (
                                <span
                                  key={`${siteName}-${idx}`}
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 truncate max-w-[140px]"
                                  title={siteName}
                                >
                                  {siteName}
                                </span>
                              ))}
                              {allowedSites.length > 2 && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200"
                                  title={allowedSites.join(', ')}
                                >
                                  +{allowedSites.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="px-4 py-3.5 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReassignModal(emp)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 border-brand-200 hover:bg-brand-50 hover:border-brand-300 shadow-2xs cursor-pointer"
                            >
                              <Building2 className="w-3.5 h-3.5 text-brand-600" />
                              <span>Change Sites</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Site Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSite ? `Edit Site: ${editingSite.name}` : 'Add New Operational Site'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Site Name"
              placeholder="e.g. Surat ST-1 / Pune - Phase 1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Site Code"
              placeholder="ADN-SITE-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>

          {/* Unified Location & Address Search Bar (Single Search Option) */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Site Location & Address</span>
              </label>

              <button
                type="button"
                onClick={handlePinCurrentLocation}
                disabled={searching}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200 transition-colors w-fit shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {searching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5 text-brand-600" />
                )}
                <span>Pin My Current GPS</span>
              </button>
            </div>

            {/* Single Location Search Input */}
            <div className="relative">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {searching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Search or enter location (e.g. Mission Road, Adajan Surat, Hinjewadi Pune...)"
                    value={searchLocationQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                        handleSearchLocation(searchLocationQuery, true);
                      }
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowResultsDropdown(true);
                    }}
                    required
                    className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-2xs placeholder:text-slate-400 text-slate-900 font-medium"
                  />
                  {searchLocationQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchLocationQuery('');
                        setFormData((prev) => ({ ...prev, address: '' }));
                        setSearchResults([]);
                        setShowResultsDropdown(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                    handleSearchLocation(searchLocationQuery, true);
                  }}
                  className="bg-brand-500 hover:bg-brand-600 text-xs font-bold px-3.5 py-2.5 rounded-xl flex-shrink-0"
                >
                  Search & Navigate
                </Button>
              </div>

              {/* Suggestions Dropdown */}
              {showResultsDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-[1100] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                    <span>Matching Locations:</span>
                    <button
                      type="button"
                      onClick={() => setShowResultsDropdown(false)}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                  {searchResults.slice(0, 2).map((res, idx) => (
                    <button
                      key={`${res.name}-${idx}`}
                      type="button"
                      onClick={() => selectLocation(res, searchLocationQuery)}
                      className="w-full text-left px-3 py-2.5 hover:bg-brand-50/80 transition-colors flex items-start gap-2.5 group"
                    >
                      <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-brand-600">
                            {res.name}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded whitespace-nowrap">
                            {res.latitude.toFixed(4)}, {res.longitude.toFixed(4)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {res.address}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Embedded Leaflet Map with draggable marker & 500m geofence */}
            <div className="rounded-xl overflow-hidden border border-slate-300 shadow-inner">
              <InteractiveMap
                height="240px"
                siteLocation={{
                  name: formData.name || 'Tagged Site',
                  latitude: Number(formData.latitude) || 21.1926,
                  longitude: Number(formData.longitude) || 72.7997,
                  attendanceRadius: Number(formData.attendanceRadius) || 500,
                }}
                geofenceRadius={Number(formData.attendanceRadius) || 500}
                showGeofence={true}
                isPicker={true}
                onLocationSelect={async (coords) => {
                  const lat = Number(Number(coords.latitude).toFixed(6));
                  const lng = Number(Number(coords.longitude).toFixed(6));
                  setFormData((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                  }));
                  const quickLabel = `${lat}, ${lng}`;
                  setSearchLocationQuery(quickLabel);
                  setFormData((prev) => ({ ...prev, address: quickLabel }));
                  const rev = await reverseGeocode(lat, lng);
                  if (rev && rev.displayName) {
                    setSearchLocationQuery(rev.displayName);
                    setFormData((prev) => ({
                      ...prev,
                      address: rev.displayName,
                      name: prev.name ? prev.name : rev.shortName,
                    }));
                  }
                }}
              />
            </div>

            {/* Tagged Coordinates Badge & Geofence Feedback */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-slate-500 font-medium">GPS Coordinates:</span>
                <span className="font-mono font-bold text-slate-900">
                  {Number(formData.latitude || 0).toFixed(6)}, {Number(formData.longitude || 0).toFixed(6)}
                </span>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-600" />
                {formData.attendanceRadius || 500}m Geofence Perimeter
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider flex-shrink-0">
                Quick Pins:
              </span>
              {PRESET_LOCATIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPresetLocation(preset)}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/50 text-slate-600 font-medium whitespace-nowrap transition-colors shadow-2xs text-[11px]"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate input boxes (two-way synced with map) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) =>
                setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
              }
              required
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) =>
                setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Site Manager"
              placeholder="Suresh Patil"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              required
            />
            <Input
              label="Working Hours"
              placeholder="09:00 AM - 06:00 PM"
              value={formData.workingHours}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Attendance Radius (meters)"
              type="number"
              value={formData.attendanceRadius}
              onChange={(e) => setFormData({ ...formData, attendanceRadius: parseInt(e.target.value) || 500 })}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingSite ? 'Save Changes' : 'Create Site'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Site Reassignment Modal */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title={
          selectedEmpForReassign
            ? `Change Site Assignment — ${selectedEmpForReassign.name}`
            : 'Change Employee Site Assignment'
        }
      >
        {selectedEmpForReassign && (
          <form onSubmit={handleSaveReassignment} className="space-y-4">
            {/* Employee Profile Banner */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div
                className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 border ${
                  selectedEmpForReassign.role === 'supervisor'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-brand-100 text-brand-800 border-brand-200'
                }`}
              >
                {selectedEmpForReassign.name ? selectedEmpForReassign.name.slice(0, 2).toUpperCase() : 'EM'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {selectedEmpForReassign.name}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      selectedEmpForReassign.role === 'supervisor'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-brand-100 text-brand-800'
                    }`}
                  >
                    {selectedEmpForReassign.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: <span className="font-bold text-slate-700">{selectedEmpForReassign.employeeId}</span> •{' '}
                  <span className="font-sans font-medium text-slate-600">
                    {selectedEmpForReassign.designation || 'Field Engineer'}
                  </span>
                </p>
              </div>
            </div>

            {/* Field 1: Primary Designated Worksite */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>Primary Assigned Worksite (Main Base)</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Required</span>
              </label>
              <select
                value={targetPrimarySiteId}
                onChange={(e) => handleSelectPrimarySite(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-slate-900 shadow-2xs cursor-pointer"
              >
                <option value="" disabled>Select primary substation...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code || 'Substation'}) — {s.address}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 leading-normal">
                This is the employee's default work location for daily shift rosters, salary calculation, and automated attendance checks.
              </p>
            </div>

            {/* Field 2: Permitted Multi-Site Check-In Access */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authorized Check-In Sites (Multi-Site Geofence)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetAllowedSiteIds(sites.map((s) => s.id))}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    Select All Sites
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetAllowedSiteIds(targetPrimarySiteId ? [targetPrimarySiteId] : [])}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    Primary Only
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Select all substation sites where this employee is authorized to punch Check-In or Check-Out:
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sites.map((site) => {
                  const isChecked = targetAllowedSiteIds.includes(site.id);
                  const isPrimary = targetPrimarySiteId === site.id;

                  return (
                    <div
                      key={site.id}
                      onClick={() => toggleAllowedSite(site.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? isPrimary
                            ? 'bg-brand-50/70 border-brand-300 shadow-2xs'
                            : 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by wrapper
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer pointer-events-none"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {site.name}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {isPrimary && (
                              <span className="text-[10px] font-black bg-brand-600 text-white px-2 py-0.2 rounded-full shadow-2xs">
                                Primary Site
                              </span>
                            )}
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                              {site.attendanceRadius || 500}m
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {site.address}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReassignModalOpen(false)}
                disabled={savingReassign}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={savingReassign || !targetPrimarySiteId}
                className="bg-brand-600 font-bold"
              >
                {savingReassign ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Site Assignment'
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Site Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Are you sure you want to remove <span className="font-bold text-slate-900">{siteToDelete?.name}</span>? Technicians assigned to this site will need to be reallocated.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sites;
