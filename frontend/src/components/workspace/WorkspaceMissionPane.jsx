import React, { useState } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  Target,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  ArrowRight,
  Sparkles,
  BookOpen,
  HelpCircle as QuizIcon,
  CheckSquare,
  Wrench,
  Terminal,
  FileCode2,
  Flame,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { getScenarioSteps } from '../../data/scenarioStepsData';
import Button from '../common/Button';

export const WorkspaceMissionPane = ({
  scenarioId,
  scenario,
  activeStepIndex = 0,
  onSelectStep,
  completedSteps = [],
  onMarkStepCompleted,
  onValidateSolution,
  isValidating = false,
  validationResult = null,
  onSelectWorkbenchTab,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [hintsExpanded, setHintsExpanded] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({}); // { [stepId]: selectedIndex }
  const [quizSubmitted, setQuizSubmitted] = useState({}); // { [stepId]: boolean }

  const scenarioData = getScenarioSteps(scenarioId || scenario?.scenarioId || 'crash-loop-backoff');
  const steps = scenarioData.steps || [];
  const currentStep = steps[activeStepIndex] || steps[0] || {};
  const totalSteps = steps.length;
  const isLastStep = activeStepIndex === totalSteps - 1;
  const isFirstStep = activeStepIndex === 0;

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleQuizSelect = (stepId, optionIdx) => {
    setQuizAnswers((prev) => ({ ...prev, [stepId]: optionIdx }));
    setQuizSubmitted((prev) => ({ ...prev, [stepId]: true }));
    if (onMarkStepCompleted) {
      onMarkStepCompleted(activeStepIndex);
    }
  };

  const handleNext = () => {
    if (onMarkStepCompleted) {
      onMarkStepCompleted(activeStepIndex);
    }
    if (activeStepIndex < totalSteps - 1 && onSelectStep) {
      onSelectStep(activeStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0 && onSelectStep) {
      onSelectStep(activeStepIndex - 1);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#000000] text-slate-200 font-sans select-text">
      {/* 1. TOP STEP NAVIGATION & PROGRESS BREADCRUMB */}
      <div className="px-5 py-3 border-b border-[#1e293b]/80 bg-[#000000] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            STEP {activeStepIndex + 1} OF {totalSteps}
          </span>
          <span className="text-xs font-mono font-bold text-slate-300 truncate">
            {currentStep.type}: {currentStep.title}
          </span>
        </div>

        {/* Step dots indicator */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {steps.map((s, idx) => {
            const isDone = completedSteps.includes(idx);
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => onSelectStep && onSelectStep(idx)}
                title={`Go to step ${idx + 1}: ${s.title}`}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'w-6 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : isDone
                    ? 'bg-emerald-500/60'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 2. SCROLLABLE STEP CONTENT BODY */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar pb-32">
        {/* Step Header */}
        <div className="space-y-2 border-b border-[#1e293b]/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              {scenarioData.name} ({scenarioData.code})
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-[10px] font-mono text-slate-400">
              {currentStep.type}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {currentStep.title}
          </h2>

          {currentStep.subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {currentStep.subtitle}
            </p>
          )}
        </div>

        {/* STEP TYPE 1: LESSON / CONCEPT INTRODUCTION */}
        {currentStep.type === 'LESSON' && (
          <div className="space-y-5">
            {/* Simple Analogy Box */}
            {currentStep.analogy && (
              <div className="p-4 rounded-xl bg-[#080d14] border border-cyan-500/30 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-mono uppercase font-bold text-cyan-300 tracking-wider">
                    Simple Analogy
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentStep.analogy}
                </p>
              </div>
            )}

            {/* Core Explanation */}
            {currentStep.concept && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  How Kubernetes Handles It
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentStep.concept}
                </p>
              </div>
            )}

            {/* Visual Architecture Flow Diagram */}
            {currentStep.flow && (
              <div className="p-4 rounded-xl bg-[#080d14] border border-slate-800 space-y-3">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider text-center">
                  Kubernetes Lifecycle Failure Flow
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-2 text-xs font-mono">
                  {currentStep.flow.map((node, i) => (
                    <React.Fragment key={i}>
                      <div
                        className={`p-2.5 rounded-lg bg-[#000000] border text-center w-36 ${
                          node.color === 'emerald'
                            ? 'border-emerald-500/50 text-emerald-300'
                            : node.color === 'rose'
                            ? 'border-rose-500/50 text-rose-300'
                            : 'border-amber-500/50 text-amber-300'
                        }`}
                      >
                        <span className="font-bold block text-[10px]">{node.label}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {node.sub}
                        </span>
                      </div>

                      {i < currentStep.flow.length - 1 && (
                        <div className="text-slate-500 font-bold hidden sm:block">➔</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {currentStep.keyTakeaways && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  Key Takeaways
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {currentStep.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bad vs Good Code Comparison */}
            {currentStep.comparison && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  Real Manifest Comparison
                </h3>

                {/* Broken Example */}
                <div className="rounded-xl border border-rose-500/30 overflow-hidden bg-[#0d0708]">
                  <div className="px-3 py-2 bg-rose-950/40 border-b border-rose-500/20 text-rose-300 font-mono text-[11px] font-bold flex items-center gap-2">
                    <span>{currentStep.comparison.badTitle}</span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-rose-200 overflow-x-auto">
                    {currentStep.comparison.badCode}
                  </pre>
                  <div className="px-3 py-2 bg-rose-950/20 border-t border-rose-500/10 text-[11px] text-rose-300/90 italic">
                    Reason: {currentStep.comparison.badReason}
                  </div>
                </div>

                {/* Fixed Example */}
                <div className="rounded-xl border border-emerald-500/30 overflow-hidden bg-[#050f0c]">
                  <div className="px-3 py-2 bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-2">
                    <span>{currentStep.comparison.goodTitle}</span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-emerald-200 overflow-x-auto">
                    {currentStep.comparison.goodCode}
                  </pre>
                  <div className="px-3 py-2 bg-emerald-950/20 border-t border-emerald-500/10 text-[11px] text-emerald-300/90 italic">
                    Result: {currentStep.comparison.goodReason}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP TYPE 2: DIAGNOSTICS & CLI COMMANDS */}
        {currentStep.type === 'DIAGNOSTICS' && (
          <div className="space-y-5">
            {currentStep.explanation && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentStep.explanation}
              </p>
            )}

            {/* Click to Copy Recommended Commands */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold block tracking-wider">
                Recommended CLI Diagnostics (Click to copy & run in terminal):
              </span>

              <div className="space-y-2">
                {currentStep.commands?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#080d14] border border-slate-800 hover:border-emerald-500/40 transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-emerald-400 font-semibold truncate">
                        {item.cmd}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.cmd, `cmd-${idx}`)}
                        className="px-2 py-1 rounded bg-[#000000] border border-slate-700 text-slate-400 hover:text-white hover:border-emerald-400 transition-colors text-[10px] font-mono flex items-center gap-1.5 cursor-pointer shrink-0 ml-2"
                      >
                        {copiedCmd === `cmd-${idx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 group-hover:text-emerald-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Real Example Output */}
            {currentStep.exampleOutput && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                  {currentStep.exampleOutput.title}
                </span>
                <div className="p-3 rounded-xl bg-[#000000] border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {currentStep.exampleOutput.code}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP TYPE 3: HANDS-ON TASK */}
        {currentStep.type === 'TASK' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#080d14] border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase font-bold text-emerald-300 tracking-wider">
                  Hands-On Mission Objective
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {currentStep.instruction}
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block tracking-wider">
                Step-by-Step Instructions:
              </span>
              <div className="space-y-2">
                {currentStep.stepsToComplete?.map((stepItem, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#080d14] border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">{stepItem}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Workbench Action Links */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {onSelectWorkbenchTab && (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectWorkbenchTab('terminal')}
                    className="px-3 py-1.5 rounded-lg bg-[#080d14] border border-slate-700 hover:border-emerald-400 text-slate-300 hover:text-emerald-300 font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Focus Terminal Shell</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectWorkbenchTab('editor')}
                    className="px-3 py-1.5 rounded-lg bg-[#080d14] border border-slate-700 hover:border-emerald-400 text-slate-300 hover:text-emerald-300 font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open YAML Editor</span>
                  </button>
                </>
              )}
            </div>

            {currentStep.actionHint && (
              <div className="p-3 rounded-lg bg-[#000000] border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{currentStep.actionHint}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP TYPE 4: INTERACTIVE QUIZ / KNOWLEDGE CHECK */}
        {currentStep.type === 'QUIZ' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#080d14] border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <QuizIcon className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono uppercase font-bold text-amber-300 tracking-wider">
                  Knowledge Check
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                {currentStep.question}
              </p>
            </div>

            {/* Clickable Quiz Options */}
            <div className="space-y-2.5">
              {currentStep.options?.map((optionText, optIdx) => {
                const isSelected = quizAnswers[currentStep.id || activeStepIndex] === optIdx;
                const isSubmitted = quizSubmitted[currentStep.id || activeStepIndex];
                const isCorrect = optIdx === currentStep.correctIndex;

                let optionStyles =
                  'bg-[#080d14] border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-900/60';
                if (isSubmitted) {
                  if (isCorrect) {
                    optionStyles =
                      'bg-emerald-950/30 border-emerald-500/50 text-emerald-200 font-semibold';
                  } else if (isSelected && !isCorrect) {
                    optionStyles = 'bg-rose-950/30 border-rose-500/50 text-rose-200 font-semibold';
                  } else {
                    optionStyles = 'bg-[#080d14] border-slate-800/40 text-slate-500 opacity-60';
                  }
                } else if (isSelected) {
                  optionStyles =
                    'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleQuizSelect(currentStep.id || activeStepIndex, optIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${optionStyles}`}
                  >
                    <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-xs flex-1 leading-relaxed">{optionText}</span>
                    {isSubmitted && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quiz Feedback Explanation */}
            {quizSubmitted[currentStep.id || activeStepIndex] && (
              <div
                className={`p-4 rounded-xl border space-y-1.5 ${
                  quizAnswers[currentStep.id || activeStepIndex] === currentStep.correctIndex
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-xs font-bold">
                  {quizAnswers[currentStep.id || activeStepIndex] === currentStep.correctIndex ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Correct! 🎯</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400">Review Explanation:</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {currentStep.explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP TYPE 5: SOLUTION VALIDATION */}
        {currentStep.type === 'VALIDATION' && (
          <div className="space-y-5">
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentStep.explanation}
            </p>

            {/* Requirements Checklist */}
            <div className="p-4 rounded-xl bg-[#080d14] border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold block tracking-wider">
                Verification Criteria:
              </span>
              <ul className="space-y-2 text-xs">
                {currentStep.requirements?.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-slate-300">
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prominent Run Validation Check Button */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0a1218] to-[#04080c] border border-emerald-500/40 text-center space-y-4 shadow-xl">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white font-mono">
                  Ready to test your fix?
                </h4>
                <p className="text-xs text-slate-400">
                  Our sandbox evaluator runs live diagnostic assertions against your pods.
                </p>
              </div>

              <button
                type="button"
                onClick={onValidateSolution}
                disabled={isValidating}
                className="w-full py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-mono font-black text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Running Evaluator...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Run Validation Check 🚀</span>
                  </>
                )}
              </button>

              {/* Status outcome banner if already evaluated */}
              {validationResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                    validationResult.status === 'PASS'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {validationResult.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold">
                      {validationResult.status === 'PASS' ? 'Scenario Solved! 🎉' : 'Checks Failed'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Score: {validationResult.score || 0}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. SPOILER HINTS ACCORDION (Available on all steps) */}
        <div className="bg-[#080d14] rounded-xl border border-slate-800/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setHintsExpanded(!hintsExpanded)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                <Lightbulb className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                Need a Hint? (Spoiler Protection)
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                hintsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {hintsExpanded && (
            <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2 text-xs text-slate-300">
              <p className="leading-relaxed">
                <strong>Tip 1:</strong> Run <code className="text-emerald-400 font-mono">kubectl describe pod web-app</code> and inspect the <strong>Events</strong> at the bottom.
              </p>
              <p className="leading-relaxed">
                <strong>Tip 2:</strong> Switch to the <strong>YAML Editor</strong> tab on the right to edit the manifest parameters, fix the mismatch, and click <strong>Apply to Cluster</strong>.
              </p>
              <p className="leading-relaxed">
                <strong>Tip 3:</strong> You can ask the built-in <strong>AI Mentor</strong> tab anytime for interactive step-by-step guidance!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. FIXED BOTTOM STEP PROGRESSION FOOTER */}
      <div className="p-3.5 bg-[#000000] border-t border-[#1e293b]/80 flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirstStep}
          className="px-3 py-2 rounded-lg bg-[#080d14] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline-block">
          {activeStepIndex + 1} of {totalSteps}
        </span>

        {isLastStep ? (
          <button
            type="button"
            onClick={onValidateSolution}
            disabled={isValidating}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <span>Validate Fix 🚀</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkspaceMissionPane;
