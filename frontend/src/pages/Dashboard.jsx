import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
  Cpu,
  Terminal,
  Activity,
  Award,
  Sparkles,
  Server,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Kubernetes Learning & Troubleshooting Platform
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome to <span className="text-cyan-400">KubeMentor</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Master Kubernetes troubleshooting through realistic hands-on practice labs, interactive terminal diagnostics, YAML editor, AI Mentor guidance, and custom BYOA sandboxes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/learn')}
              className="text-xs font-semibold px-4 py-2.5 shadow-lg shadow-cyan-950/50"
            >
              <Terminal className="w-4 h-4 mr-1.5" />
              Practice Catalog
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/byoa')}
              className="text-xs font-semibold px-4 py-2.5"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-purple-400" />
              BYOA Custom App
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Practice Catalog */}
        <div
          onClick={() => navigate('/learn')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
        >
          <div className="space-y-3">
            <div className="p-3 w-fit rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                Practice Scenarios
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Troubleshoot CrashLoopBackOff, ImagePullBackOff, OOMKilled, Missing ConfigMaps, Service Routing, and Ingress TLS.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
            <span>Explore Scenarios</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Bring Your Own App */}
        <div
          onClick={() => navigate('/byoa')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900 cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
        >
          <div className="space-y-3">
            <div className="p-3 w-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
                Bring Your Own App (BYOA)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Deploy your custom multi-document YAML manifests into an isolated sandbox with automated runtime health checks.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400">
            <span>Launch BYOA Sandbox</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Progress & Mastery */}
        <div
          onClick={() => navigate('/progress')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
        >
          <div className="space-y-3">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                Learner Progress & Mastery
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Track your topic mastery across Reliability, Performance, and Security with personalized practice recommendations.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>View Progress Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Sandbox Lifecycle & Architecture Explainer */}
      <Card className="bg-slate-900/80 border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Sandbox Environment & Lifecycle Details
              </h2>
              <p className="text-xs text-slate-400">
                How KubeMentor provisions and manages isolated Kubernetes sandbox environments
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">Session TTL:</span>
            <strong className="text-amber-300">60 Minutes (1 Hour)</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 font-mono">
              <Layers className="w-4 h-4" />
              <span>1. Dynamic Namespace</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every lab attempt creates a dedicated isolated namespace (<code className="text-cyan-300 font-mono text-[11px] bg-slate-900 px-1 rounded">kubementor-u...-p...</code>) preventing cross-tenant access.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
              <Clock className="w-4 h-4" />
              <span>2. 1-Hour Active Window</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Workloads run for <strong>1 hour</strong> during active troubleshooting. When the session expires or is reset, ephemeral resources are automatically purged.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>3. Node Quota Guardrails</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enforces strict <code className="text-purple-300 font-mono text-[11px] bg-slate-900 px-1 rounded">ResourceQuota</code> (2 CPU, 4GB RAM, max 10 pods) ensuring node cluster stability.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;

