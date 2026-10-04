import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle, onClick, className = '' }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-brand-500',
      border: 'border-blue-100',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    red: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
    purple: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    neutral: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-100',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      } ${className}`}
    >
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${scheme.bg} ${scheme.text} flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
