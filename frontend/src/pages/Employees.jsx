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
} from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { LoadingSpinner, EmptyState } from '../components/ui/FeedbackStates';
import { useToast } from '../components/ui/Toast';

const Employees = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [employees, setEmployees] = useState([
    { id: '1', employeeId: 'EMP001', name: 'Rahul Sharma', designation: 'Field Technician', site: 'Pune - Phase 1', assignedSiteId: 'site_pune_1', email: 'rahul.sharma@adani.com', phone: '9876543210', role: 'technician', status: 'Active' },
    { id: '2', employeeId: 'EMP002', name: 'Amit Kumar', designation: 'Field Technician', site: 'Pune - Phase 1', assignedSiteId: 'site_pune_1', email: 'amit.kumar@adani.com', phone: '9876543211', role: 'technician', status: 'Active' },
    { id: '3', employeeId: 'EMP003', name: 'Sandeep Yadav', designation: 'Field Technician', site: 'Pune - Phase 2', assignedSiteId: 'site_pune_2', email: 'sandeep.yadav@adani.com', phone: '9876543212', role: 'technician', status: 'Active' },
    { id: '4', employeeId: 'EMP004', name: 'Vikash Singh', designation: 'Field Technician', site: 'Pune - Phase 2', assignedSiteId: 'site_pune_2', email: 'vikash.singh@adani.com', phone: '9876543213', role: 'technician', status: 'Active' },
    { id: '5', employeeId: 'EMP005', name: 'Neha Patil', designation: 'Supervisor', site: 'Pune - Phase 1', assignedSiteId: 'site_pune_1', email: 'neha.patil@adani.com', phone: '9876543214', role: 'technician', status: 'Active' },
  ]);

  const [sitesList, setSitesList] = useState([
    { label: 'Pune - Phase 1', value: 'site_pune_1' },
    { label: 'Pune - Phase 2', value: 'site_pune_2' },
    { label: 'Mumbai - Central Hub', value: 'site_mumbai_1' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empToDelete, setEmpToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    designation: 'Field Technician',
    role: 'technician',
    assignedSiteId: 'site_pune_1',
    status: 'Active',
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
        const mapped = res.data.map((e) => ({
          id: e.id,
          employeeId: e.employeeId,
          name: e.name,
          designation: e.designation || 'Field Technician',
          site: e.assignedSiteName || 'Pune - Phase 1',
          assignedSiteId: e.assignedSiteId || 'site_pune_1',
          email: e.email,
          phone: e.phone,
          role: e.role,
          status: e.status || 'Active',
        }));
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
        setSitesList(res.data.map((s) => ({ label: s.name, value: s.id })));
      }
    } catch (e) {}
  };

  const openAddModal = () => {
    setEditingEmp(null);
    setFormData({
      employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      email: '',
      phone: '',
      designation: 'Field Technician',
      role: 'technician',
      assignedSiteId: sitesList[0]?.value || 'site_pune_1',
      status: 'Active',
    });
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmp(emp);
    setFormData({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email || '',
      phone: emp.phone || '',
      designation: emp.designation,
      role: emp.role,
      assignedSiteId: emp.assignedSiteId || 'site_pune_1',
      status: emp.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.employeeId.trim()) {
      showToast('Name and Employee ID are required.', 'error');
      return;
    }

    const assignedSite = sitesList.find((s) => s.value === formData.assignedSiteId);
    const siteName = assignedSite ? assignedSite.label : 'Pune - Phase 1';

    try {
      if (editingEmp) {
        await api.put(`/employees/${editingEmp.id}`, {
          ...formData,
          assignedSiteName: siteName,
        });
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingEmp.id ? { ...emp, ...formData, site: siteName } : emp
          )
        );
        showToast(`Employee ${formData.name} updated successfully!`);
      } else {
        const payload = {
          ...formData,
          assignedSiteName: siteName,
        };
        const res = await api.post('/employees', payload);
        const newEmp = {
          id: res.data?.id || `emp_${Date.now()}`,
          ...formData,
          site: siteName,
        };
        setEmployees((prev) => [newEmp, ...prev]);
        showToast(`Employee ${formData.name} enrolled successfully!`);
      }
      setModalOpen(false);
    } catch (err) {
      // Local optimistic update
      const newEmp = {
        id: editingEmp ? editingEmp.id : `emp_${Date.now()}`,
        ...formData,
        site: siteName,
      };
      if (editingEmp) {
        setEmployees((prev) => prev.map((e) => (e.id === editingEmp.id ? newEmp : e)));
      } else {
        setEmployees((prev) => [newEmp, ...prev]);
      }
      showToast(editingEmp ? 'Employee updated' : 'Employee added');
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
                  <p className="text-[11px] text-brand-600 font-medium mt-0.5">{emp.site}</p>
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
                { label: 'Field Technician', value: 'Field Technician' },
                { label: 'Supervisor', value: 'Supervisor' },
                { label: 'Meter Quality Engineer', value: 'Meter Quality Engineer' },
                { label: 'Operations Lead', value: 'Operations Lead' },
              ]}
            />
            <Select
              label="Assigned Site"
              value={formData.assignedSiteId}
              onChange={(e) => setFormData({ ...formData, assignedSiteId: e.target.value })}
              options={sitesList}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="System Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { label: 'Field Technician (Mobile App Access)', value: 'technician' },
                { label: 'Administrator (Full Access)', value: 'admin' },
              ]}
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
