import React, { useState, useEffect } from 'react';
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
  Info,
} from 'lucide-react';
import Button from '../common/Button';
import SandboxInfoModal from './SandboxInfoModal';

export const WorkspaceHeader = ({
  scenarioName = 'Kubernetes Practice Lab',
  difficulty = 'Beginner',
  mode = 'simulation',
  namespace,
  isNavCollapsed,
  onToggleNav,
  onResetLab,
  isResetting,
  onValidateSolution,
  isValidating,
  validationResult,
}) => {
  const navigate = useNavigate();
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // 60-minute session countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState(3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const isPassed = validationResult?.status === 'PASS';

  return (
    <>
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
            <h1 className="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
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

        {/* Right: Sandbox Status, Session Countdown, Validation CTA, Reset & Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Environment & Session Timer Pill (Clickable for details) */}
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            title="Click to view Sandbox architecture and 1-hour session duration details"
            className="hidden lg:flex items-center gap-2 bg-slate-950 hover:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 text-xs font-mono transition-all group cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-semibold group-hover:text-cyan-300 transition-colors">
              {mode === 'kubernetes' ? 'Live K8s' : 'Sandbox'}
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Clock className="w-3 h-3 text-amber-400/80" />
              <span>{formatTimer(secondsRemaining)}</span>
            </span>
            <Info className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors ml-0.5" />
          </button>

          {/* Validate Solution CTA Button */}
          {onValidateSolution && (
            <Button
              variant="primary"
              size="sm"
              onClick={onValidateSolution}
              disabled={isValidating}
              className={`text-xs font-bold font-mono px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-all ${
                isPassed
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20'
              }`}
              title="Check authoritative cluster runtime state to validate solution"
            >
              {isValidating ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : isPassed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Validated (PASS)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validate My Solution</span>
                </>
              )}
            </Button>
          )}

          {/* Reset Lab Action */}
          {onResetLab && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onResetLab}
              disabled={isResetting || isValidating}
              className="text-xs font-semibold hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
              title="Reset lab to initial failure state"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset'}</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/learn')}
            className="text-xs font-semibold hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </header>

      {/* Sandbox Info & Lifecycle Modal */}
      <SandboxInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        namespace={namespace}
        mode={mode}
        sessionMinutes={60}
      />
    </>
  );
};

export default WorkspaceHeader;

