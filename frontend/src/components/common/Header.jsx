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
  Sun,
  Moon,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import AuthModal from './AuthModal';
import KubeMentorBrandLogo from './KubeMentorBrandLogo';

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
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/learn');
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
    <>
      <header className="h-16 bg-[#000000]/95 backdrop-blur-md border-b border-[#1e293b]/70 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 font-sans">
        {/* 1. Left Logo + Global Search Bar */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          {/* Brand Keycap Logo for KubeMentor */}
          <NavLink to="/learn" className="flex items-center group shrink-0">
            <KubeMentorBrandLogo size="sm" showText={true} />
          </NavLink>

          {/* Interactive Search Bar */}
          <div className="relative flex-1 hidden md:block max-w-xs" ref={searchRef}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search labs, topics, playgrounds..."
                className="w-full bg-[#0a0e17] border border-slate-800/90 focus:border-emerald-500/60 rounded-full pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
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
                        className="w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-slate-900/80 transition-colors group cursor-pointer"
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

        {/* 2. KubeMentor Core Navigation Options with Active Pill Styling */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-300">
          <NavLink
            to="/skills"
            className={({ isActive }) =>
              `transition-all px-3 py-1.5 rounded-lg text-xs font-semibold ${
                isActive
                  ? 'bg-[#141b26] border border-slate-700/80 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`
            }
          >
            Skills
          </NavLink>

          <NavLink
            to="/learn"
            className={({ isActive }) =>
              `transition-all px-3 py-1.5 rounded-lg text-xs font-semibold ${
                isActive
                  ? 'bg-[#141b26] border border-slate-700/80 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`
            }
          >
            Practice Labs
          </NavLink>

          <NavLink
            to="/byoa"
            className={({ isActive }) =>
              `transition-all px-3 py-1.5 rounded-lg text-xs font-semibold hidden sm:block ${
                isActive
                  ? 'bg-[#141b26] border border-slate-700/80 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`
            }
          >
            Playground
          </NavLink>

          {/* Dark/Light Toggle Icon */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 dark:hover:bg-slate-900 transition-all cursor-pointer group"
            title={isDarkMode ? 'Switch to Light (White) Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? (
              <Moon className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-transform duration-300 group-hover:-rotate-12" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 group-hover:text-amber-600 transition-transform duration-300 group-hover:rotate-45" />
            )}
          </button>

          {/* Sign In Button or Profile Avatar */}
          {isAuthenticated ? (
            <div className="relative ml-1">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800/60 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center border border-emerald-400/40 shadow-sm">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#0c1017] border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white leading-tight truncate">
                      {user?.name || (user?.email ? user.email.split('@')[0] : 'Kubernetes Learner')}
                    </p>
                    {user?.email && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <NavLink
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Account Profile
                  </NavLink>
                  <NavLink
                    to="/projects"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-blue-400" /> My Workspaces
                  </NavLink>
                  <div className="my-1 border-t border-slate-800"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="ml-1 px-4 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Interactive Sign In Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

export default Header;
