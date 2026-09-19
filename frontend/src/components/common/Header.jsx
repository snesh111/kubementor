import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Terminal,
  User,
  LogOut,
  Settings,
  FolderKanban,
  TrendingUp,
  Sparkles,
  Search,
  X,
  Play,
  Cpu,
  Layers,
  Wrench,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const QUICK_SEARCH_ITEMS = [
  { id: 'crash-loop-backoff', name: 'CrashLoopBackOff', category: 'Live Lab', path: '/lab/crash-loop-backoff', icon: Wrench },
  { id: 'image-pull-backoff', name: 'ImagePullBackOff', category: 'Live Lab', path: '/lab/image-pull-backoff', icon: Wrench },
  { id: 'oom-killed', name: 'OOMKilled Container', category: 'Live Lab', path: '/lab/oom-killed', icon: Wrench },
  { id: 'missing-configmap', name: 'Missing ConfigMap', category: 'Live Lab', path: '/lab/missing-configmap', icon: Wrench },
  { id: 'service-connectivity', name: 'Service Connectivity', category: 'Live Lab', path: '/lab/service-connectivity', icon: Wrench },
  { id: 'ingress-tls-failure', name: 'Ingress TLS Failure', category: 'Live Lab', path: '/lab/ingress-tls-failure', icon: Wrench },
  { id: 'byoa', name: 'Bring Your Own App (Playground)', category: 'Playground', path: '/byoa', icon: Sparkles },
  { id: 'progress', name: 'Learner Mastery & Analytics', category: 'Progress', path: '/progress', icon: TrendingUp },
];

export const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredSearchResults = searchQuery.trim()
    ? QUICK_SEARCH_ITEMS.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-[#080b11]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 font-sans">
      {/* 1. Left Logo + Global Search Bar */}
      <div className="flex items-center gap-4 sm:gap-6 flex-1 max-w-xl">
        {/* Brand Pill */}
        <NavLink to="/learn" className="flex items-center gap-2 group shrink-0">
          <div className="px-2.5 py-1 bg-[#121926] border border-slate-700/80 rounded-lg flex items-center gap-1.5 shadow-sm group-hover:border-emerald-500/50 transition-colors">
            <span className="text-slate-400 font-mono text-xs font-bold">&gt;_</span>
            <span className="text-emerald-400 font-mono text-xs font-bold tracking-tight">Kube</span>
            <span className="text-white font-mono text-xs font-bold tracking-tight">Mentor</span>
          </div>
        </NavLink>

        {/* Interactive Search Bar matching escbash.com */}
        <div className="relative flex-1 hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search labs, topics, playgrounds..."
              className="w-full bg-[#0d121c] border border-slate-800 focus:border-emerald-500/60 rounded-full pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchOpen && searchQuery && (
            <div className="absolute left-0 right-0 mt-2 bg-[#0c1017] border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 max-h-72 overflow-y-auto">
              {filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((res) => {
                  const ItemIcon = res.icon;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        navigate(res.path);
                      }}
                      className="w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-slate-900/80 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <ItemIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
                        <span className="text-xs text-slate-200 font-medium group-hover:text-white">
                          {res.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {res.category}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3.5 py-3 text-center text-xs text-slate-500 font-mono">
                  No matching labs or topics found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Nav Items with Colorful Status Dots */}
      <div className="flex items-center gap-1 sm:gap-3">
        <NavLink
          to="/learn"
          className={({ isActive }) =>
            `text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`
          }
        >
          <span className="text-emerald-400 text-[10px]">●</span>
          <span>Practice Labs</span>
        </NavLink>

        <NavLink
          to="/byoa"
          className={({ isActive }) =>
            `text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              isActive
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`
          }
        >
          <span className="text-purple-400 text-[10px]">●</span>
          <span>Playgrounds</span>
        </NavLink>

        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              isActive
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`
          }
        >
          <span className="text-blue-400 text-[10px]">●</span>
          <span>Progress</span>
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg hidden sm:flex items-center gap-1.5 transition-colors ${
              isActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`
          }
        >
          <span className="text-amber-400 text-[10px]">●</span>
          <span>Workspaces</span>
        </NavLink>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block"></div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800/60 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center border border-emerald-400/40 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'K'}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#0c1017] border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white leading-tight truncate">
                  {user?.name || 'DevOps User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {user?.email || 'devops@kubementor.io'}
                </p>
              </div>

              <NavLink
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" /> Account Profile
              </NavLink>
              <NavLink
                to="/projects"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <FolderKanban className="w-3.5 h-3.5 text-blue-400" /> My Projects
              </NavLink>
              <div className="my-1 border-t border-slate-800"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
