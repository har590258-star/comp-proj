import React from 'react';

const Card = ({ children, className = '', onClick, hover = false, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 sm:p-5
        ${hover ? 'hover:shadow-card-hover hover:border-slate-300 transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
