import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'success' | 'danger' | 'outline' | 'ghost' | 'secondary'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow focus:ring-brand-500 border border-transparent',
    success: 'bg-success hover:bg-success-dark text-white shadow-sm hover:shadow focus:ring-success border border-transparent',
    danger: 'bg-danger hover:bg-danger-dark text-white shadow-sm hover:shadow focus:ring-danger border border-transparent',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm focus:ring-brand-500',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-transparent focus:ring-slate-400',
  };

  const sizes = {
    sm: 'text-xs sm:text-sm px-3.5 py-1.5 gap-1.5 font-semibold',
    md: 'text-sm sm:text-base px-4 py-2.5 gap-2 font-bold',
    lg: 'text-base sm:text-lg px-6 py-3.5 gap-2.5 font-extrabold',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className={`h-4 w-4 ${size === 'lg' ? 'h-5 w-5' : ''}`} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
