import React from 'react';
import { X, Navigation, Calendar, Clock, MapPin } from 'lucide-react';
import ShiftRouteMap from '../maps/ShiftRouteMap';
import Button from './Button';

const ShiftRouteModal = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Shift Travel Route & Distance
              </h3>
              <p className="text-xs text-slate-500">
                {record.employeeName ? `${record.employeeName} • ` : ''}{record.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Check-In Site</span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">{record.site || 'Check-In'}</p>
              <p className="text-[11px] font-mono text-emerald-600 mt-0.5">{record.checkIn}</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Check-Out Site</span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">{record.checkOutSite || record.site || 'Check-Out'}</p>
              <p className="text-[11px] font-mono text-blue-600 mt-0.5">{record.checkOut}</p>
            </div>

            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Distance Traveled</span>
              <p className="text-sm sm:text-base font-black text-indigo-700 mt-0.5 font-mono">{record.distanceTraveled || '--'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Duration: {record.hours || '--'}</p>
            </div>
          </div>

          {/* Interactive Map */}
          <div>
            <ShiftRouteMap
              checkInLocation={record.checkInLocation}
              checkOutLocation={record.checkOutLocation}
              checkInSiteName={record.site}
              checkOutSiteName={record.checkOutSite || record.site}
              checkInTime={record.checkIn}
              checkOutTime={record.checkOut}
              distanceFormatted={record.distanceTraveled}
              workingHours={record.hours}
              height="360px"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShiftRouteModal;
