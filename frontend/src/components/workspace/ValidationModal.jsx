import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  Bot,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  Activity,
  History,
  TrendingUp,
} from 'lucide-react';
import Button from '../common/Button';

export const ValidationModal = ({
  isOpen,
  onClose,
  isValidating,
  result,
  onRetry,
  onOpenPostMortem,
  onSwitchToAI,
  validationHistory = [],
}) => {
  if (!isOpen) return null;

  const isPass = result?.status === 'PASS';
  const isPartial = result?.status === 'PARTIAL';
  const isFail = result?.status === 'FAIL';
  const isError = result?.status === 'ERROR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#000000] border border-[#1e293b] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 font-sans">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#000000]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                isValidating
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isPass
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isError
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {isValidating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPass ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isError ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono">
                {isValidating
                  ? 'Validating Cluster State...'
                  : isPass
                  ? 'Solution Validated'
                  : isPartial
                  ? 'Partial Solution Detected'
                  : isError
                  ? 'Validation Unavailable'
                  : 'Solution Not Fixed Yet'}
              </h2>
              <p className="text-xs text-slate-400">
                {isValidating
                  ? 'Polling authoritative runtime state & sandbox telemetry'
                  : `Attempt #${result?.attemptNumber || 1} • ${result?.scenarioName || 'Kubernetes Lab'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isValidating}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm select-text bg-[#000000]">
          {/* LOADING STATE */}
          {isValidating && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                <Activity className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200 font-mono">
                  Inspecting Kubernetes Sandbox
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Checking pod readiness, container exit codes, service endpoints, and TLS configurations...
                </p>
              </div>
            </div>
          )}

          {/* VALIDATION RESULT DETAILS */}
          {!isValidating && result && (
            <>
              {/* STATUS BANNER & SCORE */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isPass
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : isError
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-wide font-mono">
                      {isPass ? 'PASS' : isError ? 'ERROR' : isPartial ? 'PARTIAL' : 'FAIL'}
                    </span>
                    <span className="text-xs opacity-75">•</span>
                    <span className="text-xs">{result.summary}</span>
                  </div>
                  {result.nextAction && (
                    <p className="text-xs opacity-90 leading-relaxed font-mono">
                      {result.nextAction}
                    </p>
                  )}
                </div>

                {/* Score badge */}
                <div className="bg-[#080d14] px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3 shrink-0">
                  <TrendingUp className={`w-4 h-4 ${isPass ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block leading-tight">
                      Score
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-100">
                      {result.score ?? (isPass ? 95 : 35)}
                      <span className="text-xs text-slate-500">/100</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* DETERMINISTIC RUNTIME CHECKS */}
              {result.checks && result.checks.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Authoritative Runtime Checks
                  </h4>

                  <div className="space-y-2">
                    {result.checks.map((check, idx) => {
                      const checkPassed = check.status === 'PASS';
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                            checkPassed
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {checkPassed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-200 block font-mono">
                                {check.name}
                              </span>
                              {check.description && (
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {check.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right font-mono text-[11px] shrink-0">
                            <span className="text-slate-500">Actual: </span>
                            <span className={checkPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {String(check.actual)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* OBSERVED TELEMETRY EVIDENCE */}
              {result.evidence && result.evidence.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Observed Telemetry Evidence
                  </h4>
                  <div className="p-3 bg-[#080d14] rounded-xl border border-slate-800 space-y-1 font-mono text-xs text-slate-300">
                    {result.evidence.map((ev, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {!isValidating && (
          <div className="px-6 py-4 border-t border-[#1e293b] bg-[#000000] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isPass ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenPostMortem}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>View Solution Review</span>
                  </Button>
                </>
              ) : (
                <>
                  {onSwitchToAI && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onSwitchToAI();
                      }}
                      className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 border-emerald-500/30 flex items-center gap-2"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Ask AI Mentor</span>
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onRetry}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-Validate Solution</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationModal;
