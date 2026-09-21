import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
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
  Box,
  Network,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react';
import progressService from '../services/progressService';
import useAuth from '../hooks/useAuth';

// Real KubeMentor Competency Skills covering all 10 Scenarios + Platform Sandboxes
const KUBEMENTOR_SKILLS = [
  {
    id: 'crash-loop-backoff',
    title: 'CrashLoopBackOff & Container Startup Debugging',
    category: 'Troubleshooting Labs',
    categoryKey: 'troubleshooting',
    badge: 'INCIDENT LAB &bull; 15 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Diagnose why container processes terminate on startup with Exit Code 1. Inspect previous stderr crash logs, fix missing environment variables, and redeploy.',
    competencies: ['Exit Code 1', 'kubectl logs --previous', 'Environment Variables', 'Kubelet Backoff Delay'],
    tags: ['pod-lifecycle', 'exit-code-1', 'troubleshooting', 'debugging'],
    actionLabel: 'Start Incident Lab',
    actionPath: '/lab/crash-loop-backoff',
    roadmapPath: '/skills/troubleshooting',
    icon: AlertTriangle,
    iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'image-pull-backoff',
    title: 'ImagePullBackOff & Registry Verification',
    category: 'Troubleshooting Labs',
    categoryKey: 'troubleshooting',
    badge: 'INCIDENT LAB &bull; 10 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Investigate pod lifecycle events when Kubelet fails to fetch image tags from container registries. Identify invalid repository tags and restore verified images.',
    competencies: ['ErrImagePull', 'Kubelet Warning Events', 'Semantic Image Tags', 'Private Registry Secrets'],
    tags: ['err-image-pull', 'registry-auth', 'kubelet-events', 'troubleshooting'],
    actionLabel: 'Start Incident Lab',
    actionPath: '/lab/image-pull-backoff',
    roadmapPath: '/skills/troubleshooting',
    icon: StopCircle,
    iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'oom-killed',
    title: 'OOMKilled & Cgroup Memory Throttling',
    category: 'Troubleshooting Labs',
    categoryKey: 'troubleshooting',
    badge: 'INCIDENT LAB &bull; 15 MINS',
    difficulty: 'INTERMEDIATE',
    difficultyColor: 'amber',
    description: 'Detect and fix Exit Code 137 triggered by Linux cgroup memory limit exhaustion. Re-dimension container memory limits to eliminate process termination.',
    competencies: ['Exit Code 137', 'Linux OOM Killer', 'resources.limits.memory', 'Cgroup v2 Memory Controller'],
    tags: ['memory-limits', 'exit-code-137', 'cgroups-v2', 'troubleshooting'],
    actionLabel: 'Start Incident Lab',
    actionPath: '/lab/oom-killed',
    roadmapPath: '/skills/troubleshooting',
    icon: Flame,
    iconColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  {
    id: 'missing-configmap',
    title: 'ConfigMap & Secret Reference Resolution',
    category: 'Troubleshooting Labs',
    categoryKey: 'troubleshooting',
    badge: 'INCIDENT LAB &bull; 10 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Resolve CreateContainerConfigError when a deployment spec points to non-existent ConfigMaps or Secrets. Configure decoupled resources and restore boot sequences.',
    competencies: ['CreateContainerConfigError', 'ConfigMap KeyRef', 'Secret Volume Mounts', 'Decoupled Configuration'],
    tags: ['configmaps', 'secrets', 'env-injection', 'troubleshooting'],
    actionLabel: 'Start Incident Lab',
    actionPath: '/lab/missing-configmap',
    roadmapPath: '/skills/troubleshooting',
    icon: FileText,
    iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'service-connectivity',
    title: 'Service Discovery & Label Selector Routing',
    category: 'Troubleshooting Labs',
    categoryKey: 'troubleshooting',
    badge: 'INCIDENT LAB &bull; 15 MINS',
    difficulty: 'INTERMEDIATE',
    difficultyColor: 'amber',
    description: 'Investigate 502/503 network drops caused by selector label mismatches between Kubernetes Services and Pod metadata. Fix endpoints and test connectivity.',
    competencies: ['ClusterIP Endpoints', 'Service Selector Labels', 'CoreDNS Resolution', 'TargetPort Mapping'],
    tags: ['networking', 'cluster-ip', 'labels-selectors', 'troubleshooting'],
    actionLabel: 'Start Incident Lab',
    actionPath: '/lab/service-connectivity',
    roadmapPath: '/skills/troubleshooting',
    icon: WifiOff,
    iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    id: 'ingress-tls-failure',
    title: 'Ingress TLS Handshake & Certificate Verification',
    category: 'Troubleshooting Labs',
    categoryKey: 'troubleshooting',
    badge: 'INCIDENT LAB &bull; 20 MINS',
    difficulty: 'ADVANCED',
    difficultyColor: 'purple',
    description: 'Diagnose SSL/TLS handshake failures in Ingress routing. Generate missing TLS secrets with certificates and private keys to secure HTTP traffic.',
    competencies: ['Ingress TLS Secrets', 'HTTPS Termination', 'Ingress Controllers', 'SSL Handshake Diagnostics'],
    tags: ['ingress-controllers', 'tls-secrets', 'ssl-certs', 'troubleshooting'],
    actionLabel: 'Start Incident Lab',
    actionPath: '/lab/ingress-tls-failure',
    roadmapPath: '/skills/troubleshooting',
    icon: Lock,
    iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'topic-pods',
    title: 'Pods & Multi-Container Specifications',
    category: 'Kubernetes Basics',
    categoryKey: 'basics',
    badge: 'CORE TOPIC &bull; 10 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Master the atomic scheduling unit in Kubernetes. Configure container specifications, shared network namespaces, and pod lifecycle states.',
    competencies: ['Pod Manifests', 'Multi-Container Sidecars', 'Shared Localhost', 'Pod Phase Lifecycle'],
    tags: ['core-building-blocks', 'sidecars', 'shared-namespaces', 'basics'],
    actionLabel: 'Practice Pods',
    actionPath: '/lab/topic-pods',
    roadmapPath: '/skills/basics',
    icon: Box,
    iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'topic-deployments',
    title: 'Declarative Deployments & Rolling Revisions',
    category: 'Kubernetes Basics',
    categoryKey: 'basics',
    badge: 'CORE TOPIC &bull; 15 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Declaratively manage ReplicaSets, zero-downtime rolling updates, maxSurge/maxUnavailable strategies, pod revisions, and instant rollbacks.',
    competencies: ['ReplicaSets', 'RollingUpdate Strategy', 'kubectl rollout undo', 'Pod Template Hashes'],
    tags: ['deployments', 'replica-sets', 'rolling-updates', 'rollbacks', 'basics'],
    actionLabel: 'Practice Deployments',
    actionPath: '/lab/topic-deployments',
    roadmapPath: '/skills/basics',
    icon: Layers,
    iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    id: 'topic-services',
    title: 'Services & Cluster-Internal Networking',
    category: 'Kubernetes Basics',
    categoryKey: 'basics',
    badge: 'CORE TOPIC &bull; 15 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Expose microservices internally and externally via ClusterIP, NodePort, and LoadBalancer with deterministic selector endpoint discovery.',
    competencies: ['ClusterIP Services', 'NodePort Port Ranges', 'Endpoints & EndpointSlices', 'CoreDNS SRV Discovery'],
    tags: ['services', 'cluster-ip', 'node-port', 'load-balancer', 'basics'],
    actionLabel: 'Practice Services',
    actionPath: '/lab/topic-services',
    roadmapPath: '/skills/basics',
    icon: Network,
    iconColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  },
  {
    id: 'topic-configmaps',
    title: 'Decoupled Configuration & Environment Injections',
    category: 'Configuration',
    categoryKey: 'configuration',
    badge: 'CONFIG TOPIC &bull; 10 MINS',
    difficulty: 'BEGINNER',
    difficultyColor: 'emerald',
    description: 'Inject runtime configuration key-value pairs, application property files, and mounted config volumes into live containers.',
    competencies: ['ConfigMaps KeyRef', 'envFrom Configurations', 'ConfigMap VolumeMounts', 'Hot Reloading Workflows'],
    tags: ['configmaps', 'environment-vars', 'volume-mounts', 'configuration'],
    actionLabel: 'Practice ConfigMaps',
    actionPath: '/lab/topic-configmaps',
    roadmapPath: '/skills/configuration',
    icon: FileText,
    iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'byoa-playground',
    title: 'Bring Your Own App (BYOA) Playground',
    category: 'Playgrounds',
    categoryKey: 'playgrounds',
    badge: 'SANDBOX &bull; CUSTOM LABS',
    difficulty: 'ALL LEVELS',
    difficultyColor: 'emerald',
    description: 'Launch custom microservices and YAML manifests inside isolated Kubernetes namespaces. Inspect pods, run interactive web terminals, and debug in real time.',
    competencies: ['Custom Manifest Upload', 'Live Kubectl Web Terminal', 'Isolated Namespace Provisioning', 'Manifest Validation'],
    tags: ['byoa', 'manifest-linting', 'sandboxes', 'custom-clusters'],
    actionLabel: 'Open Playground',
    actionPath: '/byoa',
    roadmapPath: '/byoa',
    icon: Sparkles,
    iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'ai-analyzer',
    title: 'AI Root-Cause Diagnosis & Log Telemetry',
    category: 'AI Mentor',
    categoryKey: 'ai-mentor',
    badge: 'AI MENTOR &bull; GUIDED DRILLS',
    difficulty: 'ALL LEVELS',
    difficultyColor: 'cyan',
    description: 'Leverage KubeMentor AI to analyze pod events, diagnose root causes, and request contextual hints without giving away the full answer immediately.',
    competencies: ['Context-Grounded AI Analysis', 'Telemetry Log Parsing', 'Guided Troubleshooting Playbooks', 'Solution Verification'],
    tags: ['ai-mentor', 'event-telemetry', 'guided-drills', 'ai-diagnosis'],
    actionLabel: 'Explore AI Mentor',
    actionPath: '/analyzer',
    roadmapPath: '/analyzer',
    icon: Cpu,
    iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
];

export const Skills = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [masteryMap, setMasteryMap] = useState({});
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in-progress' | 'completed'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMastery = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const scList = await progressService.getScenarioMasteryList().catch(() => []);
        if (Array.isArray(scList)) {
          const map = {};
          scList.forEach((s) => {
            map[s.scenarioId] = s.masteryState;
          });
          setMasteryMap(map);
        }
      } catch (err) {
        console.warn('Failed to fetch mastery map in skills:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMastery();
  }, [isAuthenticated]);

  // Helper to determine item status
  const getItemStatus = (skillId) => {
    const state = masteryMap[skillId];
    if (state === 'MASTERED' || state === 'COMPLETED') return 'completed';
    if (state === 'PRACTICING') return 'in-progress';
    return 'not-started';
  };

  const categories = ['All', 'Troubleshooting Labs', 'Kubernetes Basics', 'Configuration', 'Playgrounds', 'AI Mentor'];

  // Calculate counts for status tabs
  const completedCount = KUBEMENTOR_SKILLS.filter((s) => getItemStatus(s.id) === 'completed').length;
  const inProgressCount = KUBEMENTOR_SKILLS.filter((s) => getItemStatus(s.id) === 'in-progress').length;
  const allCount = KUBEMENTOR_SKILLS.length;

  const filteredSkills = KUBEMENTOR_SKILLS.filter((skill) => {
    const status = getItemStatus(skill.id);

    // Status filter
    if (statusFilter === 'in-progress' && status !== 'in-progress') {
      return false;
    }
    if (statusFilter === 'completed' && status !== 'completed') {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && skill.category !== selectedCategory) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = skill.title.toLowerCase().includes(q);
      const matchesDesc = skill.description.toLowerCase().includes(q);
      const matchesComp = skill.competencies.some((c) => c.toLowerCase().includes(q));
      const matchesTags = (skill.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesTitle || matchesDesc || matchesComp || matchesTags;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 font-sans pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        
        {/* 1. Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Skills
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Every skill is a set of hands-on topics. Roadmaps pick from these by tag.
          </p>
        </div>

        {/* 2. Status Filter Tabs (All / In Progress / Completed) */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-800/80 pb-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              statusFilter === 'all'
                ? 'bg-[#182232] text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e141f]'
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
              {allCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              statusFilter === 'in-progress'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-amber-300 hover:bg-[#0e141f]'
            }`}
          >
            <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>In Progress</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {inProgressCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              statusFilter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-[#0e141f]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Completed</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {completedCount}
            </span>
          </button>
        </div>

        {/* 3. Category Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-[#0b0f17] border border-slate-800/90 rounded-xl">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              placeholder="Search skills by name, tag, or topic..."
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

        {/* 4. Skills Count Subtitle */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
            ACTIVE SKILLS &bull; {filteredSkills.length} OF {allCount}
          </span>
          <div className="h-px flex-1 bg-slate-800/60"></div>
        </div>

        {/* 5. Empty State */}
        {filteredSkills.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-[#090d14] border border-slate-800 space-y-3">
            <p className="text-sm font-mono text-slate-400">
              {statusFilter === 'in-progress'
                ? 'No skills currently in progress. Start a live lab to begin practicing!'
                : statusFilter === 'completed'
                ? 'No completed skills yet. Solve a troubleshooting incident or finish a topic to master it.'
                : 'No skills found matching your search filter.'}
            </p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="text-xs font-mono text-emerald-400 hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* 6. Skills Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => {
            const IconComponent = skill.icon;
            const itemStatus = getItemStatus(skill.id);

            return (
              <div
                key={skill.id}
                className="group relative bg-[#090d14]/90 hover:bg-[#0d121c] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-emerald-950/10"
              >
                <div>
                  {/* Top Row: Icon + Badge + Difficulty / Status badge */}
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

                    <div className="flex items-center gap-1.5">
                      {itemStatus === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Done
                        </span>
                      )}
                      {itemStatus === 'in-progress' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 animate-pulse" /> Active
                        </span>
                      )}
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

                  {/* Tags / Competencies */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {(skill.tags || []).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[#121824] border border-slate-800 text-[10px] font-mono text-slate-400 font-medium hover:text-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Action Button + Roadmap link */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(skill.actionPath)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#141b26] hover:bg-[#10b981] text-slate-200 hover:text-black font-bold text-xs border border-slate-700/80 hover:border-emerald-500 transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer group/btn"
                  >
                    <Play className="w-3 h-3 fill-current transition-transform group-hover/btn:translate-x-0.5" />
                    <span>{skill.actionLabel}</span>
                  </button>

                  {skill.roadmapPath && (
                    <NavLink
                      to={skill.roadmapPath}
                      title="View Practice Roadmap"
                      className="p-2 rounded-xl bg-[#0e141f] hover:bg-[#182232] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </NavLink>
                  )}
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
