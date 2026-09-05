import React from 'react';
import { Outlet } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
          <Terminal className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Kube<span className="text-cyan-400">Mentor</span>
        </h1>
      </div>

      <div className="w-full max-w-md glass-card p-8 border border-slate-800 shadow-2xl relative z-10">
        <Outlet />
      </div>

      <p className="mt-8 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} KubeMentor Platform. All rights reserved.
      </p>
    </div>
  );
};

export default AuthLayout;
