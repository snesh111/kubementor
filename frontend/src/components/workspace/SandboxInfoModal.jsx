import React from 'react';
import {
  X,
  Clock,
  ShieldCheck,
  Server,
  Layers,
  Cpu,
  Boxes,
  Info,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import Button from '../common/Button';

export const SandboxInfoModal = ({
  isOpen,
  onClose,
  namespace = 'kubementor-sandbox',
  mode = 'simulation',
  sessionMinutes = 60,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Sandbox Runtime & Lifecycle
              </h3>
              <p className="text-xs text-slate-400">
                How and where your Kubernetes sandbox is provisioned
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Key Lifecycle Facts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Session Duration</span>
              </div>
              <div className="text-sm font-bold text-amber-300 font-mono">
                {sessionMinutes} Minutes (1 Hour)
              </div>
              <p className="text-[11px] text-slate-400">
                Ephemeral TTL. Auto-recycled on expiration or reset.
              </p>
            </div>

            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Isolation Level</span>
              </div>
              <div className="text-sm font-bold text-emerald-300 font-mono truncate">
                Namespace Scoped
              </div>
              <p className="text-[11px] text-slate-400">
                Strict multi-tenant boundary with RBAC protection.
              </p>
            </div>
          </div>

          {/* Detailed Explanations */}
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-start gap-3">
              <Layers className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Where is the Sandbox Created?
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Your sandbox runs inside a dedicated, isolated namespace (<code className="text-cyan-300 font-mono text-[11px] px-1 bg-slate-900 rounded">{namespace}</code>). 
                  In Live mode, it deploys directly to the Kubernetes node cluster. In Simulation mode, it runs in a high-fidelity stateful cluster engine.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-start gap-3">
              <Cpu className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Node Resource Guardrails & Quotas
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Every sandbox is provisioned with a strict <code className="text-purple-300 font-mono text-[11px] px-1 bg-slate-900 rounded">ResourceQuota</code> (2 CPU cores, 4GB Memory limit, max 10 Pods) to prevent node resource exhaustion.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-start gap-3">
              <Activity className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Lifecycle & Auto-Cleanup
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  The sandbox node processes run for the duration of your 1-hour practice session. When you exit, reset, or exceed the session window, ephemeral workloads are cleanly purged.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Current Mode: <strong className="text-slate-200 uppercase font-mono">{mode}</strong></span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SandboxInfoModal;
