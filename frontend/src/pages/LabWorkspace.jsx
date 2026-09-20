import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import WorkspaceNavPane from '../components/workspace/WorkspaceNavPane';
import WorkspaceMissionPane from '../components/workspace/WorkspaceMissionPane';
import WorkspaceLabPane from '../components/workspace/WorkspaceLabPane';
import ValidationModal from '../components/workspace/ValidationModal';
import PostMortemModal from '../components/workspace/PostMortemModal';
import useLabWorkspace, { PROVISIONING_STEPS } from '../hooks/useLabWorkspace';
import labService from '../services/labService';
import Button from '../components/common/Button';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Server,
  GripVertical,
} from 'lucide-react';

export const LabWorkspace = () => {
  const { labId } = useParams();
  const navigate = useNavigate();

  const {
    session,
    isProvisioning,
    provisioningStep,
    isResetting,
    error,
    startOrResumeLab,
    resetLab,
  } = useLabWorkspace(labId);

  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState('terminal');
  const [mobileActiveView, setMobileActiveView] = useState('both'); // 'mission' | 'workbench' | 'both'

  // Interactive Resizable Split-Pane State (Percentage of Center Mission Pane)
  const [splitPercent, setSplitPercent] = useState(48); // 48% Mission, 52% Workbench
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef(null);

  // Mouse Drag Handlers for resizing split pane
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSplit || !splitContainerRef.current) return;
      const containerRect = splitContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const newPercent = (relativeX / containerRect.width) * 100;
      // Clamp split between 15% and 85%
      const clamped = Math.min(Math.max(newPercent, 15), 85);
      setSplitPercent(Math.round(clamped * 10) / 10);
    };

    const handleMouseUp = () => {
      if (isDraggingSplit) {
        setIsDraggingSplit(false);
      }
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSplit]);

  // Double click divider to reset to 50/50
  const handleResetSplit = () => {
    setSplitPercent(50);
  };

  // Step-by-Step Scenario Mission Navigation State
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const handleMarkStepCompleted = useCallback((idx) => {
    setCompletedSteps((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  }, []);

  // Solution Validation & Post-Mortem State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showPostMortemModal, setShowPostMortemModal] = useState(false);
  const [postMortemData, setPostMortemData] = useState(null);
  const [validationHistory, setValidationHistory] = useState([]);

  const handleSelectLab = (selectedId, isLive) => {
    if (isLive && selectedId !== labId) {
      setValidationResult(null);
      setPostMortemData(null);
      setShowValidationModal(false);
      setShowPostMortemModal(false);
      setActiveStepIndex(0);
      setCompletedSteps([]);
      navigate(`/lab/${selectedId}`);
    }
  };

  const handleResetLab = async () => {
    setValidationResult(null);
    setPostMortemData(null);
    setShowValidationModal(false);
    setShowPostMortemModal(false);
    setActiveStepIndex(0);
    setCompletedSteps([]);
    await resetLab();
  };

  const handleValidateSolution = async () => {
    try {
      setIsValidating(true);
      setShowValidationModal(true);
      const res = await labService.validateSolution(labId);
      const resultData = res.data?.data || res.data || {};
      setValidationResult(resultData);
      if (resultData.postMortem) {
        setPostMortemData(resultData.postMortem);
      }
      try {
        const histRes = await labService.getValidationHistory(labId);
        setValidationHistory(histRes.data?.data?.history || histRes.data?.history || []);
      } catch {}
    } catch (valErr) {
      setValidationResult({
        status: 'ERROR',
        summary: valErr.response?.data?.message || 'Validation request failed. Please retry.',
        checks: [],
        evidence: [valErr.message],
        score: 0,
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Fallback scenario data if not yet loaded from session
  const activeScenario = session
    ? {
        scenarioId: session.labId,
        name: session.title,
        difficulty: session.difficulty,
        category: 'Troubleshooting',
        expectedFailure: session.mission?.expectedFailure,
        description: session.mission?.description,
        concept: session.concept,
        objective: session.mission?.objective,
      }
    : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#000000] text-slate-100 overflow-hidden select-none">
      {/* 1. TOP WORKSPACE HEADER */}
      <WorkspaceHeader
        scenarioName={session?.title || labId}
        difficulty={session?.difficulty || 'Beginner'}
        mode={session?.mode || 'simulation'}
        namespace={session?.namespace}
        isNavCollapsed={isNavCollapsed}
        onToggleNav={() => setIsNavCollapsed(!isNavCollapsed)}
        onResetLab={session ? handleResetLab : null}
        isResetting={isResetting}
        onValidateSolution={session ? handleValidateSolution : null}
        isValidating={isValidating}
        validationResult={validationResult}
      />

      {/* Mobile/Tablet View Switcher Bar */}
      <div className="lg:hidden bg-[#000000] border-b border-[#1e293b]/80 px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-mono shrink-0">
        <button
          onClick={() => setMobileActiveView('mission')}
          className={`px-3 py-1 rounded transition-colors ${
            mobileActiveView === 'mission' ? 'bg-emerald-600 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          Mission Briefing
        </button>
        <button
          onClick={() => setMobileActiveView('workbench')}
          className={`px-3 py-1 rounded transition-colors ${
            mobileActiveView === 'workbench' ? 'bg-emerald-600 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          Lab Workbench
        </button>
        <button
          onClick={() => setMobileActiveView('both')}
          className={`px-3 py-1 rounded transition-colors ${
            mobileActiveView === 'both' ? 'bg-emerald-600 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          Split View
        </button>
      </div>

      {/* 2. MAIN WORKSPACE OR PROVISIONING OVERLAY */}
      {error || !session || isProvisioning ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-[#000000] relative overflow-hidden">
          {/* Subtle glowing background aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-md w-full bg-[#080d14] border border-[#1e293b] rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-6 relative z-10 font-sans">
            <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Server className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  Preparing Practice Lab
                </h3>
                <p className="text-xs text-slate-400">
                  Provisioning dedicated tenant environment
                </p>
              </div>
            </div>

            {/* Error state */}
            {error ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-rose-300 font-mono">Provisioning Error</span>
                    <p className="text-rose-200/80 leading-relaxed">{error}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => navigate('/learn')}>
                    Back to Catalog
                  </Button>
                  <Button variant="primary" size="sm" onClick={startOrResumeLab}>
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Lab
                  </Button>
                </div>
              </div>
            ) : (
              /* Step-by-step progress checklist */
              <div className="space-y-4">
                <div className="space-y-2.5">
                  {PROVISIONING_STEPS.map((step) => {
                    const isDone = provisioningStep > step.id;
                    const isCurrent = provisioningStep === step.id;

                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                            : isCurrent
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono">
                              {step.id}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold block truncate">
                            {step.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Zero setup required • Sandbox isolation active
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. MAIN 3-PANE WORKSPACE BODY */
        <div ref={splitContainerRef} className="flex-1 flex overflow-hidden relative select-none">
          {/* LEFT PANE — PRACTICE NAVIGATION ROADMAP & TOPICS */}
          {!isNavCollapsed && (
            <div className="w-56 sm:w-64 shrink-0 h-full transition-all duration-200 ease-in-out border-r border-[#1e293b]/80">
              <WorkspaceNavPane
                activeLabId={labId}
                session={session}
                validationResult={validationResult}
                activeStepIndex={activeStepIndex}
                onSelectStep={setActiveStepIndex}
                completedSteps={completedSteps}
                onSelectLab={handleSelectLab}
              />
            </div>
          )}

          {/* CENTER PANE — MISSION & LEARNING CONTENT (Dynamic Width) */}
          <div
            style={{ width: `${splitPercent}%` }}
            className={`overflow-hidden shrink-0 h-full ${
              isDraggingSplit ? '' : 'transition-[width] duration-150 ease-out'
            } ${
              mobileActiveView === 'workbench' ? 'hidden lg:block' : 'block'
            } ${splitPercent <= 1 ? 'hidden' : ''}`}
          >
            <WorkspaceMissionPane
              scenarioId={labId}
              scenario={activeScenario}
              activeStepIndex={activeStepIndex}
              onSelectStep={setActiveStepIndex}
              completedSteps={completedSteps}
              onMarkStepCompleted={handleMarkStepCompleted}
              onValidateSolution={handleValidateSolution}
              isValidating={isValidating}
              validationResult={validationResult}
              onSelectWorkbenchTab={setActiveWorkbenchTab}
            />
          </div>

          {/* DRAGGABLE VERTICAL SPLIT DIVIDER BAR */}
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleResetSplit}
            title="Drag to resize panes • Double click to center (50/50)"
            className={`hidden lg:flex w-2 shrink-0 h-full bg-[#05080e] hover:bg-emerald-500/30 active:bg-emerald-500/50 cursor-col-resize z-20 items-center justify-center relative select-none transition-colors group ${
              isDraggingSplit ? 'bg-emerald-500/50' : ''
            }`}
          >
            {/* Split border line */}
            <div
              className={`w-[1px] h-full ${
                isDraggingSplit ? 'bg-emerald-400' : 'bg-[#1e293b] group-hover:bg-emerald-500/70'
              }`}
            />

            {/* Centered grip handle pill */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-9 rounded-full border flex items-center justify-center transition-all ${
                isDraggingSplit
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-110'
                  : 'bg-[#080d14] border-slate-750 text-slate-400 group-hover:border-emerald-400 group-hover:text-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              }`}
            >
              <GripVertical className="w-3 h-3" />
            </div>

            {/* Split Percent floating badge during active drag */}
            {isDraggingSplit && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#000000] border border-emerald-400 text-emerald-300 font-mono text-[10px] font-bold shadow-2xl pointer-events-none whitespace-nowrap z-30 flex items-center gap-1.5">
                <span>{Math.round(splitPercent)}% Briefing</span>
                <span className="text-slate-500">•</span>
                <span>{Math.round(100 - splitPercent)}% Workbench</span>
              </div>
            )}
          </div>

          {/* RIGHT PANE — LAB WORKBENCH TABS (Terminal | Editor | Scratchpad | AI Mentor) */}
          <div
            style={{ width: splitPercent <= 1 ? '100%' : `${100 - splitPercent}%` }}
            className={`overflow-hidden flex-1 h-full ${
              isDraggingSplit ? '' : 'transition-[width] duration-150 ease-out'
            } ${
              mobileActiveView === 'mission' ? 'hidden lg:block' : 'block'
            }`}
          >
            <WorkspaceLabPane
              scenario={activeScenario}
              session={session}
              activeTab={activeWorkbenchTab}
              onSelectTab={setActiveWorkbenchTab}
              splitPercent={splitPercent}
              onSetSplitPercent={setSplitPercent}
            />
          </div>

          {/* Mouse event shield during dragging */}
          {isDraggingSplit && (
            <div className="absolute inset-0 z-30 cursor-col-resize pointer-events-auto bg-transparent" />
          )}
        </div>
      )}

      {/* SOLUTION VALIDATION MODAL */}
      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        isValidating={isValidating}
        result={validationResult}
        onRetry={handleValidateSolution}
        onOpenPostMortem={() => {
          setShowValidationModal(false);
          setShowPostMortemModal(true);
        }}
        onSwitchToAI={() => setActiveWorkbenchTab('aimentor')}
        validationHistory={validationHistory}
      />

      {/* GUIDED POST-MORTEM MODAL */}
      <PostMortemModal
        isOpen={showPostMortemModal}
        onClose={() => setShowPostMortemModal(false)}
        postMortem={postMortemData}
        onEditScratchpad={() => setActiveWorkbenchTab('scratchpad')}
      />
    </div>
  );
};

export default LabWorkspace;
