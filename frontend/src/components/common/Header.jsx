import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Terminal, User, LogOut, Settings, FolderKanban } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <NavLink to="/learn" className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-wide">
              Kube<span className="text-cyan-400">Mentor</span>
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              Practice
            </span>
          </div>
        </NavLink>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <NavLink
          to="/learn"
          className={({ isActive }) =>
            `text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Terminal className="w-3.5 h-3.5" /> Practice Labs
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              isActive ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <FolderKanban className="w-3.5 h-3.5" /> Custom Workspaces
        </NavLink>

        <div className="h-6 w-px bg-slate-800"></div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-300">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.name || 'DevOps User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {user?.email || 'devops@kubementor.io'}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
              <NavLink
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <User className="w-4 h-4 text-cyan-400" /> Account Profile
              </NavLink>
              <NavLink
                to="/projects"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <FolderKanban className="w-4 h-4 text-blue-400" /> My Projects
              </NavLink>
              <div className="my-1 border-t border-slate-800"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
