import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Navigation,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Phone,
  Mail,
  Battery,
  ShieldCheck,
  User,
  ArrowRight,
  Radio,
  Layers,
} from 'lucide-react';
import ShiftRouteMap from '../maps/ShiftRouteMap';
import StatusBadge from './StatusBadge';
import Button from './Button';

const EmployeeShiftRouteModal = ({
  isOpen,
  onClose,
  data,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !data) return null;

  const hasRouteCoords = Boolean(
    data.checkInLocation?.latitude != null || data.checkOutLocation?.latitude != null
  );

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
              {data.name ? data.name.slice(0, 2).toUpperCase() : 'FT'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {data.name}
                </h3>
                <StatusBadge status={data.status} size="sm" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {data.employeeId}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-600">{data.designation || 'Field Technician'}</span>
                {data.date && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">{data.date}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Employee Key Profile & Telemetry Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-800 truncate">
                <Phone className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span>{data.phone || '+91 98765 43210'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-800 truncate">
                <Mail className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span className="truncate">{data.email || `${data.employeeId.toLowerCase().replace('/', '')}@adani.com`}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Division / Circle</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-800 truncate">
                <Building2 className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span>{data.division || data.circle || 'Surat Division'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Device Battery</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-700">
                <Battery className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{data.batteryLevel != null ? `${data.batteryLevel}%` : '85% Active'}</span>
              </div>
            </div>
          </div>

          {/* Shift Details & Cross-Site Route Breakdown */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Shift Travel & Substation Audit</span>
              <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Distance: {data.distanceTraveledFormatted || '--'}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Check-In */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Check-In Substation</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1 truncate">{data.site || 'Site A'}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>Time: <strong className="text-slate-800">{data.checkIn || '--'}</strong></span>
                </div>
                {data.checkInLocation && (
                  <p className="text-[10px] font-mono text-emerald-700 mt-1 truncate">
                    GPS: {data.checkInLocation.latitude?.toFixed(6)}, {data.checkInLocation.longitude?.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Check-Out */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Check-Out Substation</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1 truncate">{data.checkOutSite || data.site || 'Site B'}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>Time: <strong className="text-slate-800">{data.checkOut || '--'}</strong></span>
                </div>
                {data.checkOutLocation && (
                  <p className="text-[10px] font-mono text-blue-700 mt-1 truncate">
                    GPS: {data.checkOutLocation.latitude?.toFixed(6)}, {data.checkOutLocation.longitude?.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Shift Metrics */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Working Duration</span>
                  </div>
                  <p className="text-base font-black text-indigo-900 mt-1 font-mono">
                    {data.workingHours || '--'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Shift Route:</span>
                  <span className="font-bold text-slate-800 font-mono">{data.distanceTraveledFormatted || '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Route Map */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-brand-600" />
                <span>Map Route & Travel Path (Check-In ➔ Check-Out)</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Leaflet + Mappls GIS
              </span>
            </div>

            <ShiftRouteMap
              checkInLocation={data.checkInLocation}
              checkOutLocation={data.checkOutLocation}
              checkInSiteName={data.site}
              checkOutSiteName={data.checkOutSite || data.site}
              checkInTime={data.checkIn}
              checkOutTime={data.checkOut}
              distanceFormatted={data.distanceTraveledFormatted}
              workingHours={data.workingHours}
              height="340px"
            />
          </div>
        </div>

        {/* Footer with Action Navigation */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/tracking');
              }}
              className="text-xs font-bold text-brand-700 bg-white border-brand-200 hover:bg-brand-50 flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-brand-600" />
              <span>Track Live GPS Map</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/history');
              }}
              className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 flex items-center gap-1.5"
            >
              <span>View Attendance Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Button>
          </div>

          <Button variant="primary" size="sm" onClick={onClose} className="text-xs font-semibold px-5">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeShiftRouteModal;
