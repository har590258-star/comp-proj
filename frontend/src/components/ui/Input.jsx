import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  rightElement,
  helperText,
  id,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm sm:text-base font-bold text-slate-800">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <input
          id={id}
          ref={ref}
          className={`
            block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 font-medium
            transition-colors duration-150
            focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed
            ${Icon ? 'pl-11 sm:pl-12' : ''}
            ${rightElement ? 'pr-11 sm:pr-12' : ''}
            ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
