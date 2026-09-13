import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Terminal,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
  Activity,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import Button from '../common/Button';

export const WorkspaceHeader = ({
  scenarioName = 'Kubernetes Practice Lab',
  difficulty = 'Beginner',
  mode = 'simulation',
  namespace,
  isNavCollapsed,
  onToggleNav,
  onResetLab,
  isResetting,
}) => {
  const navigate = useNavigate();

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Advanced':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Brand + Toggle Nav */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleNav}
          title={isNavCollapsed ? 'Expand Navigation (Left)' : 'Collapse Navigation (Left)'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          {isNavCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        <NavLink to="/learn" className="flex items-center gap-2.5 group">
          <div className="p-1.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg text-white shadow-sm shadow-cyan-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-bold text-sm text-white tracking-wide">
              Kube<span className="text-cyan-400">Mentor</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Lab
            </span>
          </div>
        </NavLink>

        <div className="h-4 w-px bg-slate-800 hidden md:block"></div>

        {/* Current Lab Title & Badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {scenarioName}
          </h1>
          <span
            className={`hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDifficultyBadge(
              difficulty
            )}`}
          >
            {difficulty}
          </span>
        </div>
      </div>

      {/* Right: Lab Status, Reset & Exit CTA */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Environment mode pill */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-400 font-semibold">● Lab Running</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            {mode === 'kubernetes' ? 'Live Kubernetes' : 'Simulation Sandbox'}
          </span>
          {namespace && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 text-[11px] truncate max-w-[120px]">{namespace}</span>
            </>
          )}
        </div>

        {/* Reset Lab Action */}
        {onResetLab && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onResetLab}
            disabled={isResetting}
            className="text-xs font-semibold hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
            title="Reset lab to initial failure state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset Lab'}</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/learn')}
          className="text-xs font-semibold hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exit Lab</span>
        </Button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
