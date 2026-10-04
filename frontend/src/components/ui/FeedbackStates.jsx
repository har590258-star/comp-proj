import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import Button from './Button';

export const LoadingSpinner = ({ text = 'Loading data...', size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-3 text-slate-500 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-brand-500 ${sizeMap[size] || sizeMap.md}`} />
      {text && <p className="text-xs sm:text-sm font-medium text-slate-500">{text}</p>}
    </div>
  );
};

export const EmptyState = ({
  title = 'No records found',
  description = 'There is currently no data available to display.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'Unable to complete your request. Please check your connection and try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-rose-50/50 rounded-2xl border border-rose-100 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100/70 flex items-center justify-center text-rose-600 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-600 max-w-sm mb-5">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
