import React, { useState } from 'react';
import {
  SplitSquareVertical,
  BookOpen,
  Cpu,
  Bot,
  Terminal,
  FileCode2,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Send,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import ScenarioLearningGuide from './ScenarioLearningGuide';
import Card from '../common/Card';
import Button from '../common/Button';

export const ScenarioWorkbench = ({
  scenario,
  activeAttempt,
  contextSnapshot,
  aiDiagnosis,
  aiHints,
  onDiagnose,
  onRequestHint,
  onChat,
  onValidate,
  validating,
  validationResult,
  onCancelScenario,
  chatLoading,
}) => {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'guide' | 'simulation'
  const [chatInput, setChatInput] = useState('');

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    onChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="space-y-4">
      {/* Workbench Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <SplitSquareVertical className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Interactive Learning Lab & Simulation Workbench</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Live Session
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Learn concepts side-by-side with real-time Kubernetes telemetry & AI Mentoring
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Split Dual-Pane
          </button>
          <button
            type="button"
            onClick={() => setViewMode('guide')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
              viewMode === 'guide'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guide Only
          </button>
          <button
            type="button"
            onClick={() => setViewMode('simulation')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
              viewMode === 'simulation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulation Lab Only
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Grid */}
      <div
        className={`grid gap-4 ${
          viewMode === 'split'
            ? 'grid-cols-1 lg:grid-cols-12'
            : 'grid-cols-1'
        }`}
      >
        {/* Left Pane: Educational Learning Guide */}
        {(viewMode === 'split' || viewMode === 'guide') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'col-span-1'} space-y-4`}>
            <ScenarioLearningGuide scenario={scenario} />
          </div>
        )}

        {/* Right Pane: Live Telemetry & AI Diagnostic Workbench */}
        {(viewMode === 'split' || viewMode === 'simulation') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'col-span-1'} space-y-4`}>
            {/* Live Pod Telemetry & Logs */}
            <Card className="bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Live Pod Telemetry & Event Stream
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  Attempt #{activeAttempt?._id?.slice(-6) || 'Active'}
                </span>
              </div>

              {contextSnapshot ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                      <span className="text-slate-500 block text-[10px]">FAILURE STATE</span>
                      <span className="text-rose-400 font-bold">
                        {contextSnapshot.context?.observedFailure?.status || scenario?.expectedFailure || 'Failure Injected'}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                      <span className="text-slate-500 block text-[10px]">POD RESTARTS</span>
                      <span className="text-amber-400 font-bold">
                        {contextSnapshot.context?.pods?.[0]?.restarts ?? 4} Restart(s)
                      </span>
                    </div>
                  </div>

                  {/* Logs terminal box */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px]">
                    <div className="text-slate-500 text-[10px] uppercase mb-1 flex items-center justify-between">
                      <span>Container Logs (Tail)</span>
                      <span className="text-emerald-400 text-[10px]">exit code {contextSnapshot.context?.pods?.[0]?.containers?.[0]?.exitCode ?? 1}</span>
                    </div>
                    <pre className="text-rose-300 whitespace-pre-wrap overflow-x-auto max-h-32 text-xs">
                      {typeof contextSnapshot.context?.logs?.content === 'string'
                        ? contextSnapshot.context.logs.content
                        : 'Application startup error. Container process terminated.'}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Loading telemetry snapshot...</p>
              )}
            </Card>

            {/* AI Mentor Progressive Hints & Assistance */}
            <Card className="bg-slate-900 border-indigo-900/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                    AI Mentor Progressive Guidance
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <Button
                      key={level}
                      variant="outline"
                      size="xs"
                      onClick={() => onRequestHint(level)}
                      className="text-[10px] px-2 py-0.5"
                    >
                      Hint L{level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* AI Hints Display */}
              {aiHints && Object.keys(aiHints).length > 0 && (
                <div className="space-y-2 mb-3">
                  {Object.entries(aiHints).map(([lvl, hintText]) => (
                    <div
                      key={lvl}
                      className="bg-indigo-950/30 border border-indigo-800/40 p-2.5 rounded-lg text-xs"
                    >
                      <span className="font-bold text-indigo-300 font-mono text-[10px] block mb-1">
                        LEVEL {lvl} HINT
                      </span>
                      <p className="text-indigo-200">{hintText}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Interactive Chat Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask the AI Mentor about this failure..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!chatInput.trim() || chatLoading}
                  isLoading={chatLoading}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </Card>

            {/* Solution Validation Loop */}
            <Card className="bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Validate Your YAML Fix
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Apply your corrected Kubernetes manifest and run validation tests
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelScenario}
                    className="text-xs text-slate-400"
                  >
                    Exit Lab
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onValidate}
                    isLoading={validating}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Validate Solution
                  </Button>
                </div>
              </div>

              {validationResult && (
                <div
                  className={`mt-3 p-3 rounded-lg border text-xs ${
                    validationResult.passed
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {validationResult.passed ? '🎉 Scenario Solved!' : '❌ Checks Failed'}
                  </div>
                  <p>{validationResult.message || (validationResult.passed ? 'All pods restored and running healthy.' : 'Validation checks failed. Inspect container status and logs.')}</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioWorkbench;
