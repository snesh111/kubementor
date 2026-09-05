import React from 'react';

export const LoadingSpinner = ({ label = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses[size]} border-slate-700 border-t-cyan-400 rounded-full animate-spin`}
      ></div>
      {label && <p className="text-xs text-slate-400 font-mono tracking-wide">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
