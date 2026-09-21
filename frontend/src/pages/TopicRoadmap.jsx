import React, { useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  Wrench,
  Bomb,
  StopCircle,
  Flame,
  FileText,
  WifiOff,
  Lock,
  Box,
  Layers,
  Network,
  Clock,
  CheckCircle2,
  LockKeyhole,
  ChevronRight,
  ChevronDown,
  Play,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Terminal,
} from 'lucide-react';

const TRACK_DETAILS = {
  troubleshooting: {
    id: 'troubleshooting',
    title: 'Troubleshooting Labs',
    icon: Wrench,
    iconColor: 'text-emerald-400',
    description:
      'Master Kubernetes outage investigation from zero to production SRE. Diagnose pod startup crashes, analyze cgroup memory limits, trace network selector drops, and fix broken manifests in real live sandbox clusters.',
    stats: {
      topics: '6 topics',
      tasks: '24 hands-on tasks',
      quizzes: '6 AI root-cause guides',
      time: '~90 min',
    },
    certificateReqs: [
      'Complete all 6 live troubleshooting incident labs',
      'Pass root-cause verification with 100% solution score',
      'Resolve application outages without restarting cluster nodes',
    ],
    steps: [
      {
        stepNum: 1,
        code: '01',
        id: 'crash-loop-backoff',
        title: 'CrashLoopBackOff with Exit Code 1',
        concepts: '3 concepts',
        tasks: '4 tasks',
        time: '15 min',
        isFree: true,
        isLocked: false,
        icon: Bomb,
        desc: 'Diagnose why microservices crash on boot with exit code 1. Inspect stderr logs and inject missing configuration.',
      },
      {
        stepNum: 2,
        code: '02',
        id: 'image-pull-backoff',
        title: 'ImagePullBackOff Tag Mismatch',
        concepts: '2 concepts',
        tasks: '3 tasks',
        time: '10 min',
        isFree: true,
        isLocked: false,
        icon: StopCircle,
        desc: 'Investigate kubelet container image pull failures, resolve invalid repository tags, and restore verified images.',
      },
      {
        stepNum: 3,
        code: '03',
        id: 'oom-killed',
        title: 'Out of Memory (OOMKilled) Exit 137',
        concepts: '3 concepts',
        tasks: '4 tasks',
        time: '15 min',
        isFree: true,
        isLocked: false,
        icon: Flame,
        desc: 'Detect Linux kernel cgroup memory exhaustion, analyze memory utilization profiles, and tune limits.',
      },
      {
        stepNum: 4,
        code: '04',
        id: 'missing-configmap',
        title: 'Missing ConfigMap / Secret Reference',
        concepts: '2 concepts',
        tasks: '3 tasks',
        time: '10 min',
        isFree: true,
        isLocked: false,
        icon: FileText,
        desc: 'Resolve CreateContainerConfigError when pod specifications reference non-existent decoupled resources.',
      },
      {
        stepNum: 5,
        code: '05',
        id: 'service-connectivity',
        title: 'Service Selector Label Mismatch',
        concepts: '3 concepts',
        tasks: '4 tasks',
        time: '15 min',
        isFree: true,
        isLocked: false,
        icon: WifiOff,
        desc: 'Investigate 502/503 network drops caused by selector label mismatches between Services and Pod metadata.',
      },
      {
        stepNum: 6,
        code: '06',
        id: 'ingress-tls-failure',
        title: 'Ingress TLS Secret Missing',
        concepts: '3 concepts',
        tasks: '4 tasks',
        time: '20 min',
        isFree: true,
        isLocked: false,
        icon: Lock,
        desc: 'Diagnose SSL/TLS certificate verification failures on Ingress controllers and provision verified TLS secrets.',
      },
    ],
  },
  basics: {
    id: 'basics',
    title: 'Kubernetes Basics',
    icon: Layers,
    iconColor: 'text-cyan-400',
    description:
      'Learn core Kubernetes primitives from scratch: Pod specifications, multi-container communication, ReplicaSets, zero-downtime rolling updates, and cluster-internal networking.',
    stats: {
      topics: '3 topics',
      tasks: '12 hands-on tasks',
      quizzes: '3 validation quizzes',
      time: '~45 min',
    },
    certificateReqs: [
      'Declaratively manage Pods, Deployments, and Services',
      'Execute rolling updates and zero-downtime rollbacks',
    ],
    steps: [
      {
        stepNum: 1,
        code: '07',
        id: 'topic-pods',
        title: 'Pods & Multi-Container Pods',
        concepts: '3 concepts',
        tasks: '4 tasks',
        time: '10 min',
        isFree: true,
        isLocked: false,
        icon: Box,
        desc: 'Atomic scheduling unit in Kubernetes. Learn container specifications and shared networking.',
      },
      {
        stepNum: 2,
        code: '08',
        id: 'topic-deployments',
        title: 'Deployments & Rolling Updates',
        concepts: '3 concepts',
        tasks: '4 tasks',
        time: '15 min',
        isFree: true,
        isLocked: false,
        icon: Layers,
        desc: 'Declaratively manage replica sets, rolling updates, pod revisions, and rollbacks.',
      },
      {
        stepNum: 3,
        code: '09',
        id: 'topic-services',
        title: 'Services & Cluster Networking',
        concepts: '3 concepts',
        tasks: '4 tasks',
        time: '15 min',
        isFree: true,
        isLocked: false,
        icon: Network,
        desc: 'Expose workloads via ClusterIP, NodePort, and LoadBalancer with selector discovery.',
      },
    ],
  },
  configuration: {
    id: 'configuration',
    title: 'Configuration',
    icon: FileText,
    iconColor: 'text-amber-400',
    description:
      'Master decoupling runtime configuration and environment variables from container images using ConfigMaps.',
    stats: {
      topics: '1 topic',
      tasks: '4 hands-on tasks',
      quizzes: '1 validation quiz',
      time: '~10 min',
    },
    certificateReqs: [
      'Inject configuration parameters via ConfigMap environment variables and volume mounts',
      'Decouple application settings from container image lifecycles',
    ],
    steps: [
      {
        stepNum: 1,
        code: '10',
        id: 'topic-configmaps',
        title: 'ConfigMaps & Environment Injection',
        concepts: '3 concepts',
        tasks: '4 tasks',
        time: '10 min',
        isFree: true,
        isLocked: false,
        icon: FileText,
        desc: 'Inject configuration key-value pairs, property files, and mounted volumes into running containers.',
      },
    ],
  },
};

export const TopicRoadmap = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [certExpanded, setCertExpanded] = useState(false);

  const activeTrack = TRACK_DETAILS[trackId || 'troubleshooting'] || TRACK_DETAILS.troubleshooting;
  const TrackIcon = activeTrack.icon;

  const handleStartStep = (step) => {
    if (!step.isLocked) {
      navigate(`/lab/${step.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 font-sans pb-20 select-none">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-7">
        {/* 1. BREADCRUMBS */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <NavLink to="/skills" className="hover:text-emerald-400 transition-colors">
            Skills
          </NavLink>
          <span>&gt;</span>
          <span className="text-slate-200 font-semibold">{activeTrack.title}</span>
        </div>

        {/* 2. TRACK HEADER */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0e141f] border border-slate-800 text-emerald-400 shadow-xl">
              <TrackIcon className="w-7 h-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {activeTrack.title}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            {activeTrack.description}
          </p>

          {/* STAT PILLS */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-slate-300">
            <span className="px-3 py-1 rounded-full bg-[#0e141f] border border-slate-800">
              {activeTrack.stats.topics}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#0e141f] border border-slate-800">
              {activeTrack.stats.tasks}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#0e141f] border border-slate-800">
              {activeTrack.stats.quizzes}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#0e141f] border border-slate-800 text-cyan-400">
              {activeTrack.stats.time}
            </span>
          </div>
        </div>

        {/* 3. CERTIFICATE REQUIREMENTS COLLAPSIBLE */}
        <div className="rounded-xl bg-[#090d14] border border-slate-800 overflow-hidden shadow-lg">
          <button
            type="button"
            onClick={() => setCertExpanded(!certExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Certificate requirements</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-normal">In progress</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  certExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {certExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-2 text-xs font-mono text-slate-400">
              {activeTrack.certificateReqs.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{req}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. VERTICAL ROADMAP STEPS (MATCHING ESCBASH DESIGN) */}
        <div className="space-y-3.5 pt-2">
          {activeTrack.steps.map((step, index) => {
            const StepIcon = step.icon;
            const isFirst = index === 0;

            return (
              <div
                key={step.id}
                onClick={() => handleStartStep(step)}
                className={`relative rounded-xl p-4 sm:p-5 transition-all cursor-pointer group select-none ${
                  isFirst
                    ? 'bg-[#080d14] border-2 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : step.isLocked
                    ? 'bg-[#06080e]/60 border border-slate-850 opacity-60 cursor-not-allowed'
                    : 'bg-[#080d14] border border-slate-800 hover:border-slate-700 hover:bg-[#0c121c]'
                }`}
              >
                {/* Step Connector Line & Header */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    STEP {step.stepNum}
                  </span>

                  {step.isFree && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      FREE
                    </span>
                  )}

                  {step.isLocked && (
                    <LockKeyhole className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>

                {/* Title and Icon */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 ${
                        isFirst
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <h3
                        className={`text-sm sm:text-base font-mono font-bold ${
                          isFirst
                            ? 'text-emerald-300'
                            : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {step.code} - {step.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-sans mt-0.5 line-clamp-1">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 ${
                      isFirst ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  />
                </div>

                {/* Sub-meta details */}
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-3 pt-2.5 border-t border-slate-800/60">
                  <span>{step.concepts}</span>
                  <span>•</span>
                  <span>{step.tasks}</span>
                  <span>•</span>
                  <span>{step.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopicRoadmap;
