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
} from 'lucide-react';
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
  const { showToast } = useToast();

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

  const handlePinCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    showToast('Acquiring device GPS position...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        showToast(`📍 GPS tagged: ${lat}, ${lng}`, 'success');
      },
      (err) => {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Site Management</h2>
            <p className="text-xs text-slate-500">Smart Meter infrastructure sites & geofences</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={openAddModal}
          className="bg-brand-500 text-xs font-semibold"
        >
          Add New Site
        </Button>
      </div>

      {/* Grid of Site Cards */}
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
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                    {site.assignedEmployeesCount || 0} Staff Assigned
                  </span>

                  <div className="flex items-center gap-1">
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
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200 transition-colors w-fit shadow-2xs"
              >
                <LocateFixed className="w-3.5 h-3.5 text-brand-600" />
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
                onLocationSelect={(coords) => {
                  setFormData((prev) => ({
                    ...prev,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  }));
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
