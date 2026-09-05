import React from 'react';

export const Card = ({ children, title, subtitle, className = '', headerAction }) => {
  return (
    <div className={`glass-card p-5 ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
