import React from 'react';
import { NavLink } from 'react-router-dom';
import { FolderKanban, LayoutDashboard, AlertTriangle, Cpu, Rocket, User } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Control Center', path: '/', icon: LayoutDashboard },
    { label: 'Scenarios', path: '/scenarios', icon: AlertTriangle },
    { label: 'AI Analyzer', path: '/analyzer', icon: Cpu },
    { label: 'Deploy Simulation', path: '/deployment', icon: Rocket },
    { label: 'My Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
          DevOps Workspace
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <p className="text-xs font-semibold text-slate-300">Simulation Cluster</p>
            <p className="text-[10px] text-slate-500">Status: Active & Isolated</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
