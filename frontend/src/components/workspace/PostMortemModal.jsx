import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  X,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Clock,
  Layers,
  FileText,
  HelpCircle,
  Award,
  ArrowRight,
} from 'lucide-react';
import Button from '../common/Button';

export const PostMortemModal = ({ isOpen, onClose, postMortem, onEditScratchpad }) => {
  if (!isOpen || !postMortem) return null;

  const sections = postMortem.sections || [];
  const scratchpad = postMortem.scratchpadNotes || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#000000] border border-[#1e293b] rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 font-sans">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-[#1e293b] bg-[#000000] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Solution Review
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {postMortem.scenarioId}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 font-mono mt-0.5">
                {postMortem.scenarioName || 'Kubernetes Troubleshooting Solution Review'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#080d14] px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-300">
                Score: {postMortem.score || 95}/100
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm select-text bg-[#000000]">
          {/* INTRO SUMMARY */}
          <div className="p-4 rounded-xl bg-[#080d14] border border-[#1e293b] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Root-Cause Investigation Summary
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Review this guided summary to consolidate the lessons learned during this troubleshooting session.
              </p>
            </div>
            <div className="text-right font-mono text-xs text-slate-400 shrink-0">
              <span>Attempt #{postMortem.attemptNumber || 1}</span>
            </div>
          </div>

          {/* 6 STRUCTURED REFLECTION SECTIONS */}
          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#080d14] border border-[#1e293b]/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {sec.title}
                  </h3>
                  {sec.source && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#000000] text-slate-400 border border-slate-800">
                      {sec.source}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-6">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          {/* LEARNER SCRATCHPAD SNAPSHOT */}
          {(scratchpad.hypothesis || scratchpad.rootCause || scratchpad.plannedFix) && (
            <div className="p-4 rounded-xl bg-[#080d14] border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Your Investigation Notes (Scratchpad)
                </h4>
                {onEditScratchpad && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditScratchpad();
                    }}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit Notes</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {scratchpad.hypothesis && (
                  <div className="p-2.5 rounded-lg bg-[#000000] border border-slate-800/80">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                      Working Hypothesis
                    </span>
                    <p className="text-slate-200">{scratchpad.hypothesis}</p>
                  </div>
                )}
                {scratchpad.rootCause && (
                  <div className="p-2.5 rounded-lg bg-[#000000] border border-slate-800/80">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                      Identified Root Cause
                    </span>
                    <p className="text-slate-200">{scratchpad.rootCause}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-[#1e293b] bg-[#000000] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            KubeMentor Guided Troubleshooting Loop • Part 8
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold"
          >
            Back to Workspace
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostMortemModal;
