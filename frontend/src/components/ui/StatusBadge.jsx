import React from 'react';
import { MapPin, Check, X, Clock, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'md', showIcon = true, className = '' }) => {
  const norm = (status || '').toLowerCase().trim();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = null;
  let label = status || 'Unknown';

  if (norm.includes('present') || norm === 'active') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = MapPin;
    label = norm === 'active' ? 'Active' : 'Present';
  } else if (norm.includes('absent') || norm === 'inactive') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = X;
    label = norm === 'inactive' ? 'Inactive' : 'Absent';
  } else if (norm.includes('checked out') || norm.includes('checkout')) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
    Icon = Clock;
    label = 'Checked Out';
  } else if (norm.includes('late')) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = AlertCircle;
    label = 'Late';
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${styles} ${sizes[size] || sizes.md} ${className}`}
    >
      {showIcon && Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
