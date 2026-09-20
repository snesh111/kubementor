import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#000000] stars-bg flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Subtle Starry Cosmic Background Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.06),rgba(0,0,0,0))] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Centered Auth Modal for KubeMentor */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <Outlet />
      </div>

      <p className="mt-8 text-[11px] font-mono text-slate-600">
        &copy; {new Date().getFullYear()} KubeMentor Platform &bull; Hands-on Kubernetes Simulation
      </p>
    </div>
  );
};

export default AuthLayout;


