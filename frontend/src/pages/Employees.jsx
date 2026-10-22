import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
  MapPin,
  Navigation,
  Map,
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import InteractiveMap from '../components/maps/InteractiveMap';
import { LoadingSpinner, EmptyState } from '../components/ui/FeedbackStates';
import { useToast } from '../components/ui/Toast';

const Employees = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [employees, setEmployees] = useState([
    { id: '1', employeeId: 'b4S/Adani/01', name: 'Rohit Sharma', designation: 'Junior Engineer', site: 'Surat ST-1', assignedSiteId: 'site_surat_1', email: 'rohit.sharma@adani.com', phone: '9876543210', role: 'technician', circle: 'Gujarat Circle', division: 'Surat Division', status: 'Present', latitude: 21.1926, longitude: 72.7997, locationAddress: 'Adajan, Surat, Gujarat' },
    { id: '2', employeeId: 'b4S/Adani/02', name: 'Amit Kumar', designation: 'Junior Engineer', site: 'Pune - Phase 1', assignedSiteId: 'site_pune_1', email: 'amit.kumar@adani.com', phone: '9876543211', role: 'technician', circle: 'Prc', division: 'Office', status: 'Present', latitude: 18.5204, longitude: 73.8567, locationAddress: 'Hinjewadi, Pune, Maharashtra' },
    { id: '3', employeeId: 'b4S/Adani/03', name: 'Sandeep Yadav', designation: 'Junior Engineer', site: 'Pune - Phase 2', assignedSiteId: 'site_pune_2', email: 'sandeep.yadav@adani.com', phone: '9876543212', role: 'technician', circle: 'Prc', division: 'Bundgarden', status: 'Present', latitude: 18.5590, longitude: 73.7868, locationAddress: 'Baner, Pune, Maharashtra' },
    { id: '4', employeeId: 'b4S/Adani/04', name: 'Vikash Singh', designation: 'Junior Engineer', site: 'Pune - Phase 2', assignedSiteId: 'site_pune_2', email: 'vikash.singh@adani.com', phone: '9876543213', role: 'technician', circle: 'Prc', division: 'Bundgarden', status: 'Absent', latitude: 18.5590, longitude: 73.7868, locationAddress: 'Baner, Pune, Maharashtra' },
    { id: '5', employeeId: 'b4S/Adani/05', name: 'Neha Patil', designation: 'Division Head', site: 'Pune - Phase 1', assignedSiteId: 'site_pune_1', email: 'neha.patil@adani.com', phone: '9876543214', role: 'technician', circle: 'Prc', division: 'Office', status: 'Present', latitude: 18.5204, longitude: 73.8567, locationAddress: 'Hinjewadi, Pune, Maharashtra' },
  ]);

  const [sitesList, setSitesList] = useState([
    { label: 'Surat ST-1', value: 'site_surat_1', code: 'ADN-SITE-010', latitude: 21.1926, longitude: 72.7997, address: 'Adajan, Surat, Gujarat' },
    { label: 'Pune - Phase 1', value: 'site_pune_1', code: 'ADN-PS-001', latitude: 18.5204, longitude: 73.8567, address: 'Hinjewadi, Pune, Maharashtra' },
    { label: 'Pune - Phase 2', value: 'site_pune_2', code: 'ADN-PS-002', latitude: 18.5590, longitude: 73.7868, address: 'Baner, Pune, Maharashtra' },
    { label: 'Mumbai - Central Hub', value: 'site_mumbai_1', code: 'ADN-MH-001', latitude: 19.0657, longitude: 72.8687, address: 'Bandra Kurla Complex, Mumbai, Maharashtra' },
    { label: 'Ahmedabad - Solar Phase 1', value: 'site_ahm_1', code: 'ADN-AHM-001', latitude: 23.0225, longitude: 72.5714, address: 'SG Highway, Ahmedabad, Gujarat' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empToDelete, setEmpToDelete] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [savingSiteCoords, setSavingSiteCoords] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    designation: 'Field Technician',
    role: 'technician',
    assignedSiteIds: ['site_surat_1'],
    status: 'Present',
    latitude: 21.1926,
    longitude: 72.7997,
    locationAddress: 'Adajan, Surat, Gujarat',
  });

  useEffect(() => {
    fetchEmployees();
    fetchSites();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map((e) => {
          const rawStatus = (e.status || '').toLowerCase().trim();
          const mappedStatus =
            rawStatus === 'inactive' || rawStatus === 'absent' ? 'Absent' : 'Present';
          
          const rawSiteIds = (e.assignedSiteIds && e.assignedSiteIds.length > 0)
            ? e.assignedSiteIds
            : (e.assignedSiteId ? [e.assignedSiteId] : ['site_pune_1']);
          
          const rawSiteNames = (e.assignedSiteNames && e.assignedSiteNames.length > 0)
            ? e.assignedSiteNames
            : (e.assignedSiteName ? [e.assignedSiteName] : [e.site || 'Pune - Phase 1']);

          return {
            id: e.id,
            employeeId: e.employeeId,
            name: e.name,
            designation: e.designation || 'Field Technician',
            site: rawSiteNames[0] || 'Pune - Phase 1',
            assignedSiteId: rawSiteIds[0] || 'site_pune_1',
            assignedSiteIds: rawSiteIds,
            assignedSiteNames: rawSiteNames,
            assignedSites: e.assignedSites || [],
            email: e.email,
            phone: e.phone,
            circle: e.circle || '',
            division: e.division || '',
            role: e.role,
            status: mappedStatus,
            latitude: e.latitude != null ? Number(e.latitude) : null,
            longitude: e.longitude != null ? Number(e.longitude) : null,
            locationAddress: e.locationAddress || '',
          };
        });
        setEmployees(mapped);

      }
    } catch (e) {
      console.warn('Using baseline employee roster');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await api.get('/sites');
      if (res.data && res.data.length > 0) {
        setSitesList(
          res.data.map((s) => ({
            label: s.name,
            value: s.id,
            code: s.code,
            latitude: s.latitude,
            longitude: s.longitude,
            address: s.address,
            attendanceRadius: s.attendanceRadius,
          }))
        );
      }
    } catch (e) {}
  };

  const syncWithSiteCoords = (siteId) => {
    const targetId = siteId || formData.assignedSiteIds?.[0];
    const site = sitesList.find((s) => s.value === targetId);
    if (site && site.latitude != null && site.longitude != null) {
      setFormData((prev) => ({
        ...prev,
        latitude: site.latitude,
        longitude: site.longitude,
        locationAddress: site.address || site.label || prev.locationAddress,
      }));
      showToast(`Coordinates set to ${site.label} (${site.latitude}, ${site.longitude})`, 'info');
    } else {
      showToast('No coordinates available for the selected site.', 'warning');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          locationAddress: prev.locationAddress || 'Current GPS Device Location',
        }));
        setDetectingLocation(false);
        showToast(`Captured GPS location: ${lat}, ${lng}`, 'success');
      },
      () => {
        setDetectingLocation(false);
        showToast('Unable to capture location. Check browser permissions.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleSiteSelection = (siteId) => {
    const clickedSite = sitesList.find((s) => s.value === siteId);
    setFormData((prev) => {
      const current = prev.assignedSiteIds || [];
      let updatedSiteIds;
      const isDeselecting = current.includes(siteId);

      if (isDeselecting) {
        if (current.length === 1) {
          showToast('At least one site must remain assigned.', 'warning');
          return prev;
        }
        updatedSiteIds = current.filter((id) => id !== siteId);
        const nextPrimarySite = sitesList.find((s) => s.value === updatedSiteIds[0]);
        const nextHasCoords = nextPrimarySite?.latitude != null && nextPrimarySite?.longitude != null && !isNaN(Number(nextPrimarySite.latitude));
        return {
          ...prev,
          assignedSiteIds: updatedSiteIds,
          latitude: nextHasCoords ? Number(nextPrimarySite.latitude) : '',
          longitude: nextHasCoords ? Number(nextPrimarySite.longitude) : '',
          locationAddress: nextPrimarySite?.address || nextPrimarySite?.label || '',
        };
      } else {
        // Put the newly clicked site at the front as the primary assigned site
        updatedSiteIds = [siteId, ...current.filter((id) => id !== siteId)];
        const hasCoords = clickedSite?.latitude != null && clickedSite?.longitude != null && !isNaN(Number(clickedSite.latitude));
        return {
          ...prev,
          assignedSiteIds: updatedSiteIds,
          latitude: hasCoords ? Number(clickedSite.latitude) : '',
          longitude: hasCoords ? Number(clickedSite.longitude) : '',
          locationAddress: clickedSite?.address || clickedSite?.label || '',
        };
      }
    });

    if (clickedSite) {
      if (clickedSite.latitude != null && clickedSite.longitude != null && !isNaN(Number(clickedSite.latitude))) {
        showToast(`Selected "${clickedSite.label}" — GPS coordinates loaded (${clickedSite.latitude}, ${clickedSite.longitude})`, 'info');
      } else {
        showToast(`"${clickedSite.label}" has no GPS coordinates configured. Please enter or pin them below.`, 'warning');
      }
    }
  };

  const saveCoordinatesToSite = async () => {
    const primaryId = formData.assignedSiteIds?.[0];
    const targetSite = sitesList.find((s) => s.value === primaryId);
    if (!targetSite) {
      showToast('No assigned site selected.', 'warning');
      return;
    }
    if (formData.latitude === '' || formData.longitude === '' || isNaN(Number(formData.latitude)) || isNaN(Number(formData.longitude))) {
      showToast('Please enter valid Latitude and Longitude first.', 'error');
      return;
    }

    const lat = Number(Number(formData.latitude).toFixed(6));
    const lng = Number(Number(formData.longitude).toFixed(6));

    try {
      setSavingSiteCoords(true);
      await api.put(`/sites/${targetSite.value}`, {
        latitude: lat,
        longitude: lng,
      });

      // Update sitesList locally so the site card reflects the new coordinates
      setSitesList((prev) =>
        prev.map((s) => (s.value === targetSite.value ? { ...s, latitude: lat, longitude: lng } : s))
      );
      showToast(`Saved coordinates (${lat}, ${lng}) to "${targetSite.label}" successfully!`, 'success');
    } catch (e) {
      // Optimistic update locally
      setSitesList((prev) =>
        prev.map((s) => (s.value === targetSite.value ? { ...s, latitude: lat, longitude: lng } : s))
      );
      showToast(`Updated "${targetSite.label}" with coordinates (${lat}, ${lng})`, 'success');
    } finally {
      setSavingSiteCoords(false);
    }
  };

  const openAddModal = () => {
    setEditingEmp(null);
    const defaultSite = sitesList[0] || { value: 'site_surat_1', latitude: 21.1926, longitude: 72.7997, address: 'Adajan, Surat, Gujarat' };
    setFormData({
      employeeId: `b4S/Adani/${String(Math.floor(1 + Math.random() * 99)).padStart(2, '0')}`,
      name: '',
      email: '',
      phone: '',
      designation: 'Junior Engineer',
      circle: 'Prc',
      division: 'Office',
      role: 'technician',
      assignedSiteIds: [defaultSite.value],
      status: 'Present',
      latitude: defaultSite.latitude ?? 21.1926,
      longitude: defaultSite.longitude ?? 72.7997,
      locationAddress: defaultSite.address || defaultSite.label || '',
    });
    setShowMapPicker(false);
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmp(emp);
    const rawStatus = (emp.status || '').toLowerCase().trim();
    const currentStatus =
      rawStatus === 'inactive' || rawStatus === 'absent' ? 'Absent' : 'Present';
    
    const initialSiteIds = (emp.assignedSiteIds && emp.assignedSiteIds.length > 0)
      ? emp.assignedSiteIds
      : (emp.assignedSiteId ? [emp.assignedSiteId] : ['site_surat_1']);

    const matchedSite = sitesList.find((s) => s.value === initialSiteIds[0]);

    setFormData({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email || '',
      phone: emp.phone || '',
      designation: emp.designation || 'Junior Engineer',
      circle: emp.circle || (emp.site?.includes('Pune') ? 'Prc' : emp.site?.includes('Mumbai') ? 'Rastapeth' : 'Prc'),
      division: emp.division || (emp.site?.includes('Pune') ? 'Pune Division' : emp.site || 'Office'),
      role: emp.role,
      assignedSiteIds: initialSiteIds,
      status: currentStatus,
      latitude: emp.latitude != null ? emp.latitude : (matchedSite?.latitude ?? 21.1926),
      longitude: emp.longitude != null ? emp.longitude : (matchedSite?.longitude ?? 72.7997),
      locationAddress: emp.locationAddress || matchedSite?.address || '',
    });
    setShowMapPicker(false);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.employeeId.trim()) {
      showToast('Name and Employee ID are required.', 'error');
      return;
    }
    if (!formData.assignedSiteIds || formData.assignedSiteIds.length === 0) {
      showToast('Please select at least one assigned substation site.', 'error');
      return;
    }

    const selectedSiteNames = formData.assignedSiteIds.map(
      (sid) => sitesList.find((s) => s.value === sid)?.label || sid
    );
    const primarySiteId = formData.assignedSiteIds[0] || 'site_surat_1';
    const primarySiteName = selectedSiteNames[0] || 'Surat ST-1';

    const parsedLat = formData.latitude !== '' && formData.latitude != null && !isNaN(Number(formData.latitude))
      ? Number(formData.latitude)
      : null;
    const parsedLng = formData.longitude !== '' && formData.longitude != null && !isNaN(Number(formData.longitude))
      ? Number(formData.longitude)
      : null;

    const payload = {
      ...formData,
      latitude: parsedLat,
      longitude: parsedLng,
      locationAddress: formData.locationAddress || '',
      assignedSiteId: primarySiteId,
      assignedSiteName: primarySiteName,
      assignedSiteIds: formData.assignedSiteIds,
      assignedSiteNames: selectedSiteNames,
    };

    try {
      if (editingEmp) {
        await api.put(`/employees/${editingEmp.id}`, payload);
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingEmp.id
              ? {
                  ...emp,
                  ...payload,
                  site: primarySiteName,
                }
              : emp
          )
        );
        showToast(`Employee ${formData.name} updated with specified coordinates!`);
      } else {
        const res = await api.post('/employees', payload);
        const newEmp = {
          id: res.data?.id || `emp_${Date.now()}`,
          ...payload,
          site: primarySiteName,
        };
        setEmployees((prev) => [newEmp, ...prev]);
        showToast(`Employee ${formData.name} enrolled with specified coordinates!`);
      }
      setModalOpen(false);
    } catch (err) {
      const newEmp = {
        id: editingEmp ? editingEmp.id : `emp_${Date.now()}`,
        ...payload,
        site: primarySiteName,
      };
      if (editingEmp) {
        setEmployees((prev) => prev.map((e) => (e.id === editingEmp.id ? newEmp : e)));
      } else {
        setEmployees((prev) => [newEmp, ...prev]);
      }
      showToast(editingEmp ? 'Employee updated' : 'Employee enrolled');
      setModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!empToDelete) return;
    try {
      await api.delete(`/employees/${empToDelete.id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== empToDelete.id));
      showToast(`Employee ${empToDelete.name} deleted.`);
    } catch (e) {
      setEmployees((prev) => prev.filter((e) => e.id !== empToDelete.id));
      showToast(`Employee ${empToDelete.name} removed.`);
    } finally {
      setDeleteConfirmOpen(false);
      setEmpToDelete(null);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.site.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Header matching Screen 10 */}
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
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Employees</h2>
            <p className="text-xs text-slate-500">Field staff & technicians roster</p>
          </div>
        </div>

        {/* Blue "+" Add Button matching Screen 10 */}
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={openAddModal}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-3 sm:px-4 py-2 text-xs font-semibold shadow-xs"
        >
          <span className="hidden sm:inline">Add Employee</span>
        </Button>
      </div>

      {/* Search Input matching Screen 10 */}
      <div className="w-full">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or ID..."
        />
      </div>

      {/* Employee List Container matching PDF Screen 10 */}
      <Card className="p-0 overflow-hidden shadow-card divide-y divide-slate-100">
        {loading ? (
          <LoadingSpinner text="Loading technicians..." />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="No staff members matched your search query."
            actionLabel="Add New Employee"
            onAction={openAddModal}
          />
        ) : (
          filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
            >
              {/* Left: Avatar & Identity matching Screen 10 */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs flex-shrink-0">
                  {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{emp.name}</h4>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{emp.employeeId}</span> |{' '}
                    <span>{emp.designation}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {(emp.assignedSiteNames && emp.assignedSiteNames.length > 0
                      ? emp.assignedSiteNames
                      : [emp.site || 'Surat ST-1']
                    ).map((sName, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-lg border border-brand-200"
                      >
                        <Building2 className="w-3 h-3 text-brand-500" />
                        {sName}
                      </span>
                    ))}
                    {emp.latitude != null && emp.longitude != null && !isNaN(Number(emp.latitude)) && (
                      <a
                        href={`https://www.google.com/maps?q=${emp.latitude},${emp.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                        title="View specified GPS coordinates on Google Maps"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{Number(emp.latitude).toFixed(4)}, {Number(emp.longitude).toFixed(4)}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Status badge & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pl-14 sm:pl-0">
                <StatusBadge status={emp.status} size="sm" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(emp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit Employee"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEmpToDelete(emp);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Employee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmp ? `Edit: ${editingEmp.name}` : 'Add New Field Technician'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
            />
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="rahul.sharma@adani.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              options={[
                { label: 'Junior Engineer', value: 'Junior Engineer' },
                { label: 'Division Head', value: 'Division Head' },
                { label: 'Field Technician', value: 'Field Technician' },
                { label: 'Supervisor', value: 'Supervisor' },
                { label: 'Store keeper', value: 'Store keeper' },
                { label: 'Asst.Store Keeper', value: 'Asst.Store Keeper' },
                { label: 'MIS Executive', value: 'MIS Executive' },
                { label: 'Project Coordinator', value: 'Project Coordinator' },
                { label: 'Project Manager', value: 'Project Manager' },
                { label: 'Meter Quality Engineer', value: 'Meter Quality Engineer' },
                { label: 'Operations Lead', value: 'Operations Lead' },
              ]}
            />
            <Select
              label="System Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { label: 'Field Technician (Mobile App Access)', value: 'technician' },
                { label: 'Field Supervisor (Team & Site Management)', value: 'supervisor' },
                { label: 'Administrator (Full Access)', value: 'admin' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="CIRCLE (e.g. Rastapeth, Prc)"
              placeholder="Rastapeth or Prc"
              value={formData.circle || ''}
              onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
            />
            <Input
              label="Division (e.g. Bundgarden, Padmavati Division, Office)"
              placeholder="Bundgarden, Pune Division, Office"
              value={formData.division || ''}
              onChange={(e) => setFormData({ ...formData, division: e.target.value })}
            />
          </div>

          {/* Multiple Site Assignment Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Assigned Substations & Sites ({formData.assignedSiteIds?.length || 0} selected)
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Click to assign multiple sites</span>
            </div>
            
            {/* Selected site tags */}
            {formData.assignedSiteIds && formData.assignedSiteIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {formData.assignedSiteIds.map((sid) => {
                  const sObj = sitesList.find((s) => s.value === sid);
                  const sLabel = sObj ? sObj.label : sid;
                  return (
                    <span
                      key={sid}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-200 shadow-2xs"
                    >
                      <Building2 className="w-3.5 h-3.5 text-brand-600" />
                      <span>{sLabel}</span>
                      <button
                        type="button"
                        onClick={() => toggleSiteSelection(sid)}
                        className="hover:text-rose-600 ml-0.5 text-slate-400 font-bold"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Sites selection grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
              {sitesList.map((siteOpt) => {
                const isSelected = formData.assignedSiteIds?.includes(siteOpt.value);
                const hasSiteCoords = siteOpt.latitude != null && siteOpt.longitude != null && !isNaN(Number(siteOpt.latitude)) && Number(siteOpt.latitude) !== 0;
                return (
                  <button
                    type="button"
                    key={siteOpt.value}
                    onClick={() => toggleSiteSelection(siteOpt.value)}
                    className={`flex items-start justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-white border-brand-500 text-brand-900 shadow-xs ring-1 ring-brand-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-2 overflow-hidden flex-1 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all mt-0.5 flex-shrink-0 ${
                          isSelected
                            ? 'bg-brand-600 border-brand-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle className="w-3 h-3" />}
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        <span className="font-bold block truncate text-slate-900">{siteOpt.label}</span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {siteOpt.code && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {siteOpt.code}
                            </span>
                          )}
                          {hasSiteCoords ? (
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded flex items-center gap-0.5 whitespace-nowrap">
                              <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                              {Number(siteOpt.latitude).toFixed(3)}, {Number(siteOpt.longitude).toFixed(3)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded font-medium whitespace-nowrap">
                              ⚠️ No GPS coords
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded shrink-0 ml-1">
                        Assigned
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specified Location & Coordinates (Lat / Long) */}
          {(() => {
            const primarySite = sitesList.find((s) => s.value === formData.assignedSiteIds?.[0]);
            const primaryHasCoords = primarySite?.latitude != null && primarySite?.longitude != null && !isNaN(Number(primarySite.latitude)) && Number(primarySite.latitude) !== 0;

            return (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-800 block">
                          Specified Location Coordinates (Lat / Long)
                        </label>
                        {primarySite && (
                          <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.2 rounded">
                            {primarySite.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Geofenced baseline for mobile attendance & tracking
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => syncWithSiteCoords()}
                      className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-white hover:bg-brand-50 border border-brand-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      title="Auto-fill coordinates from primary assigned substation"
                    >
                      <Building2 className="w-3 h-3 text-brand-600" />
                      <span>Sync Site Coords</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={detectingLocation}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      title="Use current GPS device position"
                    >
                      <Navigation className={`w-3 h-3 text-sky-500 ${detectingLocation ? 'animate-spin' : ''}`} />
                      <span>{detectingLocation ? 'Locating...' : 'My GPS'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors flex items-center gap-1 shadow-2xs ${
                        showMapPicker
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Open interactive map to choose coordinates"
                    >
                      <Map className="w-3 h-3" />
                      <span>{showMapPicker ? 'Hide Map' : 'Map Pin'}</span>
                    </button>
                  </div>
                </div>

                {/* Alert when primary selected site is missing coordinates */}
                {primarySite && !primaryHasCoords && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 animate-fadeIn">
                    <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold">Coordinates missing for "{primarySite.label}"!</span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        This substation location does not have GPS coordinates stored. Enter Latitude & Longitude below or use "My GPS" / "Map Pin", then click "Save to Site" to register coordinates for this location.
                      </p>
                    </div>
                  </div>
                )}

                {/* Embedded Interactive Map Picker when toggled */}
                {showMapPicker && (
                  <div className="space-y-1.5 pt-1">
                    <div className="rounded-xl overflow-hidden border border-slate-300 shadow-inner">
                      <InteractiveMap
                        height="200px"
                        siteLocation={{
                          name: formData.name ? `${formData.name}'s Specified Site` : (primarySite?.label || 'Specified Location'),
                          latitude: Number(formData.latitude) || 21.1926,
                          longitude: Number(formData.longitude) || 72.7997,
                          attendanceRadius: 500,
                        }}
                        geofenceRadius={500}
                        showGeofence={true}
                        isPicker={true}
                        onLocationSelect={(coords) => {
                          setFormData((prev) => ({
                            ...prev,
                            latitude: Number(Number(coords.latitude).toFixed(6)),
                            longitude: Number(Number(coords.longitude).toFixed(6)),
                          }));
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>🎯 Click anywhere on the map or drag the pin to set coordinates.</span>
                      <span className="font-semibold text-brand-600">500m geofence preview</span>
                    </div>
                  </div>
                )}

                {/* Lat & Long Input fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Input
                      label="Latitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 21.192600"
                      value={formData.latitude !== null && formData.latitude !== undefined ? formData.latitude : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latitude: e.target.value === '' ? '' : parseFloat(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Longitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 72.799700"
                      value={formData.longitude !== null && formData.longitude !== undefined ? formData.longitude : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          longitude: e.target.value === '' ? '' : parseFloat(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Location Description / Address */}
                <Input
                  label="Specified Location Name / Landmark (Optional)"
                  placeholder="e.g. Surat ST-1 Substation, Adajan Ring Road"
                  value={formData.locationAddress || ''}
                  onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                />

                {/* Save to Site Database Button */}
                {primarySite && formData.latitude !== '' && formData.longitude !== '' && !isNaN(Number(formData.latitude)) && !isNaN(Number(formData.longitude)) && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={saveCoordinatesToSite}
                      disabled={savingSiteCoords}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 bg-white hover:bg-brand-50 border border-brand-200 rounded-lg transition-colors shadow-2xs hover:border-brand-300"
                      title="Save these coordinates back to the site record in database"
                    >
                      <Building2 className="w-3.5 h-3.5 text-brand-600" />
                      <span>{savingSiteCoords ? 'Saving to Site...' : `Save Coordinates to "${primarySite.label}"`}</span>
                    </button>
                    <span className="text-[11px] text-slate-500 font-medium">Updates site profile permanently</span>
                  </div>
                )}

                {/* Live Coordinate Badge / Feedback */}
                {formData.latitude !== '' && formData.longitude !== '' && !isNaN(Number(formData.latitude)) && !isNaN(Number(formData.longitude)) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-slate-500 font-medium">Tagged GPS:</span>
                      <span className="font-bold text-slate-900">
                        {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 font-bold hover:underline"
                    >
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>View on Google Maps ↗</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })()}

          <div>
            <Select
              label="Shift Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { label: 'Present', value: 'Present' },
                { label: 'Absent', value: 'Absent' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingEmp ? 'Save Changes' : 'Enroll Technician'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Employee Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Are you sure you want to remove <span className="font-bold text-slate-900">{empToDelete?.name}</span> ({empToDelete?.employeeId})? This will deactivate their attendance records and access.
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

export default Employees;
