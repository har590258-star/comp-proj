import React from 'react';
import { Radio, RadioOff, Clock, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'md', showIcon = true, className = '' }) => {
  const norm = (status || '').toLowerCase().trim();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let customSymbol = null;
  let label = status || 'Unknown';

  if (norm.includes('present') || norm === 'active') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = norm === 'active' ? 'Active' : 'Present';
    customSymbol = (
      <span className="relative flex items-center justify-center flex-shrink-0" title="Live / Active">
        <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
      </span>
    );
  } else if (norm.includes('absent') || norm === 'inactive') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
    label = norm === 'inactive' ? 'Inactive' : 'Absent';
    customSymbol = (
      <span className="relative flex items-center justify-center flex-shrink-0" title="Not Live / Offline">
        <RadioOff className="w-3.5 h-3.5 text-rose-500" />
      </span>
    );
  } else if (norm.includes('checked out') || norm.includes('checkout')) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
    customSymbol = <Clock className="w-3 h-3 flex-shrink-0" />;
    label = 'Checked Out';
  } else if (norm.includes('late')) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    customSymbol = <AlertCircle className="w-3 h-3 flex-shrink-0" />;
    label = 'Late';
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${styles} ${sizes[size] || sizes.md} ${className}`}
    >
      {showIcon && customSymbol}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;

