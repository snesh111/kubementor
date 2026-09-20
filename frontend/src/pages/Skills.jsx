import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Wrench,
  Flame,
  AlertTriangle,
  StopCircle,
  WifiOff,
  Lock,
  Sparkles,
  Cpu,
  TrendingUp,
  FileText,
  Search,
  X,
  Play,
  ArrowRight,
  ShieldAlert,
  Layers,
  CheckCircle2,
} from 'lucide-react';

// Real KubeMentor Competency Skills & Live Interactive Labs
const KUBEMENTOR_SKILLS = [
  {
    id: 'crash-loop-backoff',
    title: 'CrashLoopBackOff & Container Startup Debugging',
    category: 'Troubleshooting Labs',
    badge: 'LIVE LAB &bull; 15 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Diagnose why container processes terminate on startup with Exit Code 1. Inspect previous stderr crash logs, fix missing environment variables, and redeploy.',
    competencies: ['Exit Code 1', 'kubectl logs --previous', 'Environment Variables', 'Kubelet Backoff Delay'],
    actionLabel: 'Start Live Lab',
    actionPath: '/lab/crash-loop-backoff',
    icon: AlertTriangle,
    iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'image-pull-backoff',
    title: 'ImagePullBackOff & Registry Verification',
    category: 'Troubleshooting Labs',
    badge: 'LIVE LAB &bull; 10 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Investigate pod lifecycle events when Kubelet fails to fetch image tags from container registries. Identify invalid repository tags and restore verified images.',
    competencies: ['ErrImagePull', 'Kubelet Warning Events', 'Semantic Image Tags', 'Private Registry Secrets'],
    actionLabel: 'Start Live Lab',
    actionPath: '/lab/image-pull-backoff',
    icon: StopCircle,
    iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'oom-killed',
    title: 'OOMKilled & Cgroup Memory Throttling',
    category: 'Troubleshooting Labs',
    badge: 'LIVE LAB &bull; 15 MINS',
    difficulty: 'INTERMEDIATE',
    difficultyColor: 'amber',
    description: 'Detect and fix Exit Code 137 triggered by Linux cgroup memory limit exhaustion. Re-dimension container memory limits to eliminate process termination.',
    competencies: ['Exit Code 137', 'Linux OOM Killer', 'resources.limits.memory', 'Cgroup v2 Memory Controller'],
    actionLabel: 'Start Live Lab',
    actionPath: '/lab/oom-killed',
    icon: Flame,
    iconColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  {
    id: 'missing-configmap',
    title: 'ConfigMap & Secret Reference Resolution',
    category: 'Troubleshooting Labs',
    badge: 'LIVE LAB &bull; 10 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Resolve CreateContainerConfigError when a deployment spec points to non-existent ConfigMaps or Secrets. Configure decoupled resources and restore boot sequences.',
    competencies: ['CreateContainerConfigError', 'ConfigMap KeyRef', 'Secret Volume Mounts', 'Decoupled Configuration'],
    actionLabel: 'Start Live Lab',
    actionPath: '/lab/missing-configmap',
    icon: FileText,
    iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'service-connectivity',
    title: 'Service Discovery & Label Selector Routing',
    category: 'Troubleshooting Labs',
    badge: 'LIVE LAB &bull; 15 MINS',
    difficulty: 'INTERMEDIATE',
    difficultyColor: 'amber',
    description: 'Investigate 502/503 network drops caused by selector label mismatches between Kubernetes Services and Pod metadata. Fix endpoints and test connectivity.',
    competencies: ['ClusterIP Endpoints', 'Service Selector Labels', 'CoreDNS Resolution', 'TargetPort Mapping'],
    actionLabel: 'Start Live Lab',
    actionPath: '/lab/service-connectivity',
    icon: WifiOff,
    iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    id: 'ingress-tls-failure',
    title: 'Ingress TLS Handshake & Certificate Verification',
    category: 'Troubleshooting Labs',
    badge: 'LIVE LAB &bull; 20 MINS',
    difficulty: 'ADVANCED',
    difficultyColor: 'purple',
    description: 'Diagnose SSL/TLS handshake failures in Ingress routing. Generate missing TLS secrets with certificates and private keys to secure HTTP traffic.',
    competencies: ['Ingress TLS Secrets', 'HTTPS Termination', 'Ingress Controllers', 'SSL Handshake Diagnostics'],
    actionLabel: 'Start Live Lab',
    actionPath: '/lab/ingress-tls-failure',
    icon: Lock,
    iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'byoa-playground',
    title: 'Bring Your Own App (BYOA) Playground',
    category: 'Playgrounds',
    badge: 'SANDBOX &bull; CUSTOM LABS',
    difficulty: 'ALL LEVELS',
    difficultyColor: 'emerald',
    description: 'Launch custom microservices and YAML manifests inside isolated Kubernetes namespaces. Inspect pods, run interactive web terminals, and debug in real time.',
    competencies: ['Custom Manifest Upload', 'Live Kubectl Web Terminal', 'Isolated Namespace Provisioning', 'Manifest Validation'],
    actionLabel: 'Open Playground',
    actionPath: '/byoa',
    icon: Sparkles,
    iconColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  },
  {
    id: 'ai-analyzer',
    title: 'AI Root-Cause Diagnosis & Log Telemetry',
    category: 'AI Mentor',
    badge: 'AI MENTOR &bull; GUIDED DRILLS',
    difficulty: 'ALL LEVELS',
    difficultyColor: 'cyan',
    description: 'Leverage KubeMentor AI to analyze pod events, diagnose root causes, and request contextual hints without giving away the full answer immediately.',
    competencies: ['Context-Grounded AI Analysis', 'Telemetry Log Parsing', 'Guided Troubleshooting Playbooks', 'Solution Verification'],
    actionLabel: 'Explore AI Mentor',
    actionPath: '/analyzer',
    icon: Cpu,
    iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'progress-roadmap',
    title: 'Troubleshooting Mastery & Progress Analytics',
    category: 'Roadmaps',
    badge: 'ROADMAP &bull; ANALYTICS',
    difficulty: 'ALL LEVELS',
    difficultyColor: 'indigo',
    description: 'Track your completed troubleshooting attempts, review guided post-mortems, and monitor your troubleshooting speed and mastery metrics across scenarios.',
    competencies: ['Outage Post-Mortems', 'Scenario Mastery Index', 'Attempt History & Diff Reviews', 'DevOps Competency Matrix'],
    actionLabel: 'View Roadmap',
    actionPath: '/progress',
    icon: TrendingUp,
    iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
];

export const Skills = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Troubleshooting Labs', 'Playgrounds', 'AI Mentor', 'Roadmaps'];

  const filteredSkills = KUBEMENTOR_SKILLS.filter((skill) => {
    // Category filter
    if (selectedCategory !== 'All' && skill.category !== selectedCategory) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        skill.title.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.competencies.some((c) => c.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#000000] stars-bg text-slate-100 font-sans pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        {/* 1. Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Kubernetes Skills &amp; Practice Modules
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl">
            Hands-on Kubernetes troubleshooting competencies and sandbox environments available in KubeMentor.
          </p>
        </div>

        {/* 2. Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-[#0b0f17] border border-slate-800/90 rounded-xl">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#182232] text-white shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter skills & competencies..."
              className="w-full bg-[#0b0f17] border border-slate-800/90 focus:border-emerald-500/60 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Skills Count Subtitle */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
            KUBEMENTOR MODULES &bull; {filteredSkills.length}
          </span>
          <div className="h-px flex-1 bg-slate-800/60"></div>
        </div>

        {/* 4. Skills Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => {
            const IconComponent = skill.icon;

            return (
              <div
                key={skill.id}
                className="group relative bg-[#090d14]/90 hover:bg-[#0d121c] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-emerald-950/10"
              >
                <div>
                  {/* Top Row: Icon + Badge + Difficulty badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner ${skill.iconColor}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400"
                          dangerouslySetInnerHTML={{ __html: skill.badge }}
                        />
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wide border ${
                        skill.difficulty === 'BEGINNER'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : skill.difficulty === 'INTERMEDIATE'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : skill.difficulty === 'ADVANCED'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      }`}
                    >
                      {skill.difficulty}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => navigate(skill.actionPath)}
                    className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 cursor-pointer leading-snug"
                  >
                    {skill.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 font-normal">
                    {skill.description}
                  </p>

                  {/* Competency Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {skill.competencies.map((comp, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[#121824] border border-slate-800 text-[11px] font-mono text-slate-300 font-medium"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Action Button to real feature */}
                <div className="pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => navigate(skill.actionPath)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#141b26] hover:bg-[#10b981] text-slate-200 hover:text-black font-bold text-xs border border-slate-700/80 hover:border-emerald-500 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer group/btn"
                  >
                    <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover/btn:translate-x-0.5" />
                    <span>{skill.actionLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Skills;
