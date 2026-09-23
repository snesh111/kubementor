import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Terminal,
  FolderKanban,
  Cpu,
  Rocket,
  User,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Practice Labs',
      path: '/learn',
      icon: Terminal,
      activeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dotColor: 'text-emerald-400',
    },
    {
      label: 'Playgrounds (BYOA)',
      path: '/byoa',
      icon: Sparkles,
      activeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      dotColor: 'text-purple-400',
    },
    {
      label: 'Learner Progress',
      path: '/progress',
      icon: TrendingUp,
      activeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      dotColor: 'text-blue-400',
    },
    {
      label: 'Workspaces',
      path: '/projects',
      icon: FolderKanban,
      activeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dotColor: 'text-amber-400',
    },
    {
      label: 'AI Analyzer',
      path: '/analyzer',
      icon: Cpu,
      activeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      dotColor: 'text-cyan-400',
    },
    {
      label: 'Deploy Simulation',
      path: '/deployment',
      icon: Rocket,
      activeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      dotColor: 'text-indigo-400',
    },
    {
      label: 'My Profile',
      path: '/profile',
      icon: User,
      activeColor: 'bg-slate-700/30 text-slate-200 border-slate-600/40',
      dotColor: 'text-slate-400',
    },
  ];

  return (
    <aside className="w-64 bg-[#080b11]/80 backdrop-blur-md border-r border-slate-800/80 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 shrink-0 font-sans z-30 select-none">
      <div className="p-3.5 flex-1 overflow-y-auto space-y-1">
        <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 py-2">
          DevOps Platform
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              location.pathname === item.path ||
              (item.path === '/learn' && (location.pathname === '/' || location.pathname.startsWith('/learn'))) ||
              (item.path === '/projects' && location.pathname.startsWith('/projects'));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  isItemActive
                    ? `${item.activeColor} shadow-sm font-bold`
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isItemActive && (
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor?.replace('text-', 'bg-') || 'bg-emerald-400'}`}></span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 bg-[#0b0f17] rounded-xl border border-slate-800/80 flex items-center gap-2.5 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono font-bold text-slate-200 truncate">Simulation Cluster</p>
            <p className="text-[10px] font-mono text-emerald-400/90 truncate">Active &amp; Isolated</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
