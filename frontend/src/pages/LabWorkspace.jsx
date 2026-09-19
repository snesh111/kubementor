import React, { useState } from 'react';
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
  Terminal,
  RotateCcw,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
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
      navigate(`/lab/${selectedId}`);
    }
  };

  const handleResetLab = async () => {
    setValidationResult(null);
    setPostMortemData(null);
    setShowValidationModal(false);
    setShowPostMortemModal(false);
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
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
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
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-mono shrink-0">
        <button
          onClick={() => setMobileActiveView('mission')}
          className={`px-3 py-1 rounded transition-colors ${
            mobileActiveView === 'mission' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
          }`}
        >
          Mission Briefing
        </button>
        <button
          onClick={() => setMobileActiveView('workbench')}
          className={`px-3 py-1 rounded transition-colors ${
            mobileActiveView === 'workbench' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
          }`}
        >
          Lab Workbench
        </button>
        <button
          onClick={() => setMobileActiveView('both')}
          className={`px-3 py-1 rounded transition-colors ${
            mobileActiveView === 'both' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
          }`}
        >
          Split View
        </button>
      </div>

      {/* 2. MAIN WORKSPACE OR PROVISIONING OVERLAY */}
      {error || !session || isProvisioning ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
          {/* Subtle glowing background aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-6 relative z-10 font-sans">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
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
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANE — PRACTICE NAVIGATION ROADMAP & TOPICS */}
          {!isNavCollapsed && (
            <div className="w-56 sm:w-64 shrink-0 h-full transition-all duration-200 ease-in-out">
              <WorkspaceNavPane
                activeLabId={labId}
                session={session}
                validationResult={validationResult}
                activeWorkbenchTab={activeWorkbenchTab}
                onSelectTab={setActiveWorkbenchTab}
                onSelectLab={handleSelectLab}
                onValidateSolution={handleValidateSolution}
                onOpenPostMortem={() => setShowPostMortemModal(true)}
              />
            </div>
          )}

          {/* CENTER PANE — MISSION & LEARNING CONTENT */}
          <div
            className={`flex-1 overflow-hidden transition-all ${
              mobileActiveView === 'workbench' ? 'hidden lg:block' : 'block'
            } lg:w-[45%] border-r border-slate-800/80`}
          >
            <WorkspaceMissionPane scenario={activeScenario} />
          </div>

          {/* RIGHT PANE — LAB WORKBENCH TABS (Terminal | Editor | Scratchpad | AI Mentor) */}
          <div
            className={`flex-1 overflow-hidden transition-all ${
              mobileActiveView === 'mission' ? 'hidden lg:block' : 'block'
            } lg:w-[45%]`}
          >
            <WorkspaceLabPane
              scenario={activeScenario}
              session={session}
              activeTab={activeWorkbenchTab}
              onSelectTab={setActiveWorkbenchTab}
            />
          </div>
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
