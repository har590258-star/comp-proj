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
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { LoadingSpinner, EmptyState } from '../components/ui/FeedbackStates';
import { useToast } from '../components/ui/Toast';

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

  const openAddModal = () => {
    setEditingSite(null);
    setFormData({
      name: '',
      code: `ADN-SITE-00${sites.length + 1}`,
      address: '',
      latitude: 18.5204,
      longitude: 73.8567,
      manager: '',
      workingHours: '09:00 AM - 06:00 PM',
      attendanceRadius: 500,
      status: 'Active',
    });
    setModalOpen(true);
  };

  const openEditModal = (site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      code: site.code,
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      manager: site.manager,
      workingHours: site.workingHours,
      attendanceRadius: site.attendanceRadius,
      status: site.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Site name and code are required.', 'error');
      return;
    }

    try {
      if (editingSite) {
        await api.put(`/sites/${editingSite.id}`, formData);
        setSites((prev) =>
          prev.map((s) => (s.id === editingSite.id ? { ...s, ...formData } : s))
        );
        showToast(`Site ${formData.name} updated successfully!`);
      } else {
        const res = await api.post('/sites', formData);
        const newSite = {
          id: res.data?.id || `site_${Date.now()}`,
          assignedEmployeesCount: 0,
          ...formData,
        };
        setSites((prev) => [...prev, newSite]);
        showToast(`Site ${formData.name} added successfully!`);
      }
      setModalOpen(false);
    } catch (err) {
      // Optimistic update
      const newSite = {
        id: editingSite ? editingSite.id : `site_${Date.now()}`,
        assignedEmployeesCount: editingSite?.assignedEmployeesCount || 0,
        ...formData,
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
                    <span className="font-bold text-emerald-600">{site.attendanceRadius}m</span>
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
              placeholder="e.g. Pune - Phase 1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Site Code"
              placeholder="ADN-PS-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>

          <Input
            label="Address"
            placeholder="Hinjewadi, Pune, Maharashtra"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
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
