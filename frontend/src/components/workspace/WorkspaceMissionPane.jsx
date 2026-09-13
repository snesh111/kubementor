import React from 'react';
import {
  HelpCircle,
  AlertTriangle,
  Activity,
  Target,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Flame,
  Bomb,
  WifiOff,
  Lock,
  StopCircle,
  FileText,
  ChevronRight,
  Terminal as TerminalIcon,
  Sparkles,
} from 'lucide-react';

export const WorkspaceMissionPane = ({ scenario }) => {
  if (!scenario) {
    return (
      <div className="p-6 text-center text-slate-400 font-sans text-xs">
        Loading scenario details...
      </div>
    );
  }

  const concept = scenario.concept || {};
  const whyList = concept.whyItHappens || [
    'Application startup error or fatal exception on boot',
    'Port collision or missing required runtime environment variables',
    'Failing liveness probe or dependency unavailability',
  ];

  return (
    <div className="h-full overflow-y-auto p-5 space-y-6 text-slate-200 font-sans leading-relaxed text-xs select-text">
      {/* 1. Header & Badges */}
      <div className="space-y-2 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            {scenario.category || 'Troubleshooting'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {scenario.difficulty || 'Beginner'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" /> {scenario.estTime || '15 mins'}
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          {scenario.name}
        </h2>
        <p className="text-slate-300 text-xs leading-relaxed">
          {scenario.description}
        </p>
      </div>

      {/* 2. Target Failure State Card */}
      {scenario.expectedFailure && (
        <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 flex-1">
            <span className="text-[10px] uppercase font-mono text-rose-400 font-bold block">
              Observed Failure Condition
            </span>
            <span className="font-mono font-bold text-rose-200 text-xs">
              {scenario.expectedFailure}
            </span>
          </div>
        </div>
      )}

      {/* 3. What is this error? */}
      <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <h3 className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" /> What is {scenario.name}?
        </h3>
        <p className="text-slate-300 leading-relaxed text-xs">
          {concept.whatIsIt ||
            'This failure state occurs when a Kubernetes container process encounters an issue during startup or runtime, preventing the pod from remaining in a healthy Ready state.'}
        </p>
      </div>

      {/* 4. Why does it happen? */}
      <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <h3 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Common Causes
        </h3>
        <ul className="space-y-1.5 text-slate-300 text-xs">
          {whyList.map((cause, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-400 font-bold shrink-0">•</span>
              <span>{cause}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. When does it happen & Kubernetes behavior */}
      {(concept.whenItHappens || concept.productionImpact) && (
        <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <h3 className="text-xs font-bold text-purple-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Kubernetes Lifecycle & Impact
          </h3>
          {concept.whenItHappens && (
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong className="text-slate-200">Lifecycle Trigger: </strong>
              {concept.whenItHappens}
            </p>
          )}
          {concept.productionImpact && (
            <p className="text-slate-300 text-xs leading-relaxed pt-1">
              <strong className="text-slate-200">Production Impact: </strong>
              {concept.productionImpact}
            </p>
          )}
        </div>
      )}

      {/* 6. YOUR MISSION */}
      <div className="p-4 bg-gradient-to-br from-indigo-950/40 to-slate-900 rounded-xl border border-indigo-500/40 space-y-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">
            <Target className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-bold text-indigo-200 uppercase font-mono tracking-wider">
            Your Mission
          </h3>
        </div>

        <p className="text-slate-200 leading-relaxed text-xs">
          The workload in your practice namespace is currently down. Investigate the live pod state, container logs, and lifecycle events. Identify the misconfiguration and restore the application to a healthy <span className="font-mono text-emerald-400 font-bold">Running (1/1 Ready)</span> state.
        </p>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
            Investigation Methodology:
          </span>
          <ol className="space-y-1 text-[11px] text-slate-300">
            <li className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0">1</span>
              <span>Inspect pod status & restart count with <code className="text-cyan-300 font-mono">kubectl get pods</code></span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0">2</span>
              <span>Examine termination reasons with <code className="text-cyan-300 font-mono">kubectl describe pod</code></span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0">3</span>
              <span>Inspect crash logs with <code className="text-cyan-300 font-mono">kubectl logs --previous</code></span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0">4</span>
              <span>Fix manifest in the <strong>YAML Editor</strong> tab and validate the solution</span>
            </li>
          </ol>
        </div>
      </div>

      {/* 7. Current Mission Status */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-amber-300 font-bold">Investigation Phase</span>
        </div>
        <span className="text-slate-500">Ready for CLI Investigation</span>
      </div>
    </div>
  );
};

export default WorkspaceMissionPane;
