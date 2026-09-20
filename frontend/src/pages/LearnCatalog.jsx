import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Search,
  Filter,
  Sparkles,
  Layers,
  Wrench,
  Settings,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Play,
  Clock,
  BookOpen,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Flame,
  Bomb,
  WifiOff,
  Lock,
  StopCircle,
  FileText,
  Compass,
  Quote,
  Zap,
  Code2,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

import labService from '../services/labService';
import progressService from '../services/progressService';
import PracticeCategory from '../components/learn/PracticeCategory';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TypewriterWordRotator from '../components/common/TypewriterWordRotator';
import KubeMentorBrandLogo from '../components/common/KubeMentorBrandLogo';
import useAuth from '../hooks/useAuth';

const LIVE_TROUBLESHOOTING_CATEGORY = {
  categoryId: 'troubleshooting',
  categoryName: 'Troubleshooting Labs',
  description: 'Real-world cluster outage simulations. Diagnose live pod failures, analyze telemetry, and redeploy working configurations.',
  isLiveTrack: true,
  items: [
    {
      id: 'crash-loop-backoff',
      slug: 'crash-loop-backoff',
      scenarioId: 'crash-loop-backoff',
      name: 'CrashLoopBackOff with Exit Code 1',
      description: 'Web microservice container crashes immediately on boot due to missing mandatory configuration variables.',
      difficulty: 'Beginner',
      estTime: '15 mins',
      expectedFailure: 'CrashLoopBackOff (exit code 1)',
      status: 'Available',
      isLive: true,
      category: 'Troubleshooting',
      iconName: 'Bomb',
    },
    {
      id: 'image-pull-backoff',
      slug: 'image-pull-backoff',
      scenarioId: 'image-pull-backoff',
      name: 'ImagePullBackOff Tag Mismatch',
      description: 'Pod fails to download container image from registry due to a non-existent tag.',
      difficulty: 'Beginner',
      estTime: '10 mins',
      expectedFailure: 'ImagePullBackOff',
      status: 'Available',
      isLive: true,
      category: 'Troubleshooting',
      iconName: 'StopCircle',
    },
    {
      id: 'oom-killed',
      slug: 'oom-killed',
      scenarioId: 'oom-killed',
      name: 'Out of Memory (OOMKilled) Exit 137',
      description: 'Container exceeds cgroup memory limits, causing Linux kernel OOM Killer to terminate process.',
      difficulty: 'Intermediate',
      estTime: '15 mins',
      expectedFailure: 'OOMKilled (exit code 137)',
      status: 'Available',
      isLive: true,
      category: 'Troubleshooting',
      iconName: 'Flame',
    },
    {
      id: 'missing-configmap',
      slug: 'missing-configmap',
      scenarioId: 'missing-configmap',
      name: 'Missing ConfigMap / Secret Ref',
      description: 'Pod specification references non-existent ConfigMap, causing CreateContainerConfigError.',
      difficulty: 'Beginner',
      estTime: '10 mins',
      expectedFailure: 'CreateContainerConfigError',
      status: 'Available',
      isLive: true,
      category: 'Troubleshooting',
      iconName: 'FileText',
    },
    {
      id: 'service-connectivity',
      slug: 'service-connectivity',
      scenarioId: 'service-connectivity',
      name: 'Service Selector Label Mismatch',
      description: 'Service selector labels do not match pod metadata labels, dropping all incoming network traffic.',
      difficulty: 'Intermediate',
      estTime: '15 mins',
      expectedFailure: 'Empty Endpoints (502/503)',
      status: 'Available',
      isLive: true,
      category: 'Troubleshooting',
      iconName: 'WifiOff',
    },
    {
      id: 'ingress-tls-failure',
      slug: 'ingress-tls-failure',
      scenarioId: 'ingress-tls-failure',
      name: 'Ingress TLS Secret Missing',
      description: 'Ingress references missing TLS Secret, causing browser SSL handshake failures.',
      difficulty: 'Advanced',
      estTime: '20 mins',
      expectedFailure: 'TLSSecretNotFound',
      status: 'Available',
      isLive: true,
      category: 'Troubleshooting',
      iconName: 'Lock',
    },
  ],
};

// 2. FUTURE SCOPE & UPCOMING PRACTICE TOPICS
const FUTURE_SCOPE_CATEGORIES = [
  {
    categoryId: 'basics',
    categoryName: 'Kubernetes Basics',
    description: 'Master core building blocks: Pod lifecycle, declarative Deployments, and L4 Services.',
    isLiveTrack: false,
    items: [
      {
        id: 'topic-pods',
        slug: 'topic-pods',
        name: 'Pods & Multi-Container Pods',
        description: 'Atomic scheduling unit in Kubernetes. Learn container specifications, shared networking, and lifecycle states.',
        difficulty: 'Beginner',
        estTime: '10 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Kubernetes Basics',
        iconName: 'Box',
      },
      {
        id: 'topic-deployments',
        slug: 'topic-deployments',
        name: 'Deployments & Rolling Updates',
        description: 'Declaratively manage replica sets, zero-downtime rolling updates, pod revisions, and rollbacks.',
        difficulty: 'Beginner',
        estTime: '15 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Kubernetes Basics',
        iconName: 'Layers',
      },
      {
        id: 'topic-services',
        slug: 'topic-services',
        name: 'Services & Cluster Networking',
        description: 'Expose workloads internally and externally via ClusterIP, NodePort, and LoadBalancer with selector discovery.',
        difficulty: 'Beginner',
        estTime: '15 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Kubernetes Basics',
        iconName: 'Network',
      },
    ],
  },
  {
    categoryId: 'configuration',
    categoryName: 'Configuration & Secrets',
    description: 'Decouple runtime parameters and sensitive keys from container images.',
    isLiveTrack: false,
    items: [
      {
        id: 'topic-configmaps',
        slug: 'topic-configmaps',
        name: 'ConfigMaps & Environment Injection',
        description: 'Inject configuration key-value pairs, property files, and mounted volumes into running containers.',
        difficulty: 'Beginner',
        estTime: '10 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Configuration',
        iconName: 'FileText',
      },
      {
        id: 'topic-secrets',
        slug: 'topic-secrets',
        name: 'Secrets & Credential Management',
        description: 'Store sensitive data such as API tokens, passwords, and TLS certificates with base64 encoding and volume mounts.',
        difficulty: 'Intermediate',
        estTime: '12 mins',
        status: 'Coming Soon',
        isLive: false,
        category: 'Configuration',
        iconName: 'KeyRound',
      },
    ],
  },
];

const FULL_ORDERED_CATALOG = [
  LIVE_TROUBLESHOOTING_CATEGORY,
  ...FUTURE_SCOPE_CATEGORIES,
];

export const LearnCatalog = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const labsSectionRef = useRef(null);
  const [catalog, setCatalog] = useState(FULL_ORDERED_CATALOG);
  const [masteryMap, setMasteryMap] = useState({});
  const [progressSummary, setProgressSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const promises = [labService.getCatalog()];
        if (isAuthenticated) {
          promises.push(progressService.getUserProgress().catch(() => null));
          promises.push(progressService.getScenarioMasteryList().catch(() => []));
        }

        const [res, progSummary, scList] = await Promise.all(promises);

        if (res?.data?.catalog && Array.isArray(res.data.catalog) && res.data.catalog.length > 0) {
          const liveCats = res.data.catalog.filter((c) => c.categoryId === 'troubleshooting');
          const otherCats = res.data.catalog.filter((c) => c.categoryId !== 'troubleshooting');
          setCatalog([...liveCats, ...otherCats]);
        }
        if (progSummary) {
          setProgressSummary(progSummary);
        }
        if (Array.isArray(scList)) {
          const map = {};
          scList.forEach((s) => {
            map[s.scenarioId] = s.masteryState;
          });
          setMasteryMap(map);
        }
      } catch (err) {
        console.warn('Using fallback catalog:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [isAuthenticated]);

  const handleStartLab = (item) => {
    navigate(`/lab/${item.scenarioId || item.slug || item.id}`);
  };

  const handleViewDetails = (item) => {
    setSelectedDetailItem(item);
  };

  const scrollToLabs = () => {
    labsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter categories and items based on search and tab selections
  const filteredCatalog = catalog
    .filter((cat) => {
      if (selectedCategoryTab === 'All') return true;
      if (selectedCategoryTab === 'Troubleshooting') return cat.categoryId === 'troubleshooting';
      if (selectedCategoryTab === 'Basics') return cat.categoryId === 'basics';
      if (selectedCategoryTab === 'Configuration') return cat.categoryId === 'configuration';
      return true;
    })
    .map((cat) => {
      const filteredItems = (cat.items || []).filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.expectedFailure && item.expectedFailure.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesDifficulty =
          selectedDifficulty === 'All' || item.difficulty === selectedDifficulty;

        return matchesSearch && matchesDifficulty;
      });

      return {
        ...cat,
        items: filteredItems,
      };
    })
    .filter((cat) => cat.items.length > 0);

  const liveCategory = filteredCatalog.find((c) => c.categoryId === 'troubleshooting');
  const futureCategories = filteredCatalog.filter((c) => c.categoryId !== 'troubleshooting');

  const totalLiveLabs = LIVE_TROUBLESHOOTING_CATEGORY.items.length;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. HERO SECTION - THREE LAYER STRUCTURE WITH COSMIC THOR AESTHETICS */}
      <div className="relative pt-6 pb-12 flex flex-col items-center text-center px-4 overflow-hidden">
        {/* Subtle background radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

        {/* LAYER 1: CREATIVE 3D MECHANICAL KEYCAP BRAND LOGO (Matching escbash style) */}
        <div className="flex items-center justify-center mb-6">
          <KubeMentorBrandLogo size="lg" showText={true} />
        </div>

        {/* LAYER 2: GREEN MONOSPACE TAGLINE */}
        <p className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#10b981] mb-5">
          AI-POWERED SIMULATION &bull; REAL CLUSTER OUTAGES &bull; LIVE SANDBOX
        </p>

        {/* LAYER 3: STRUCTURED BOLD 2-LINE HEADLINE WITH ROTATING WORD */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.12] mb-5 text-center">
          The best platform to simulate <br />
          and practice <TypewriterWordRotator />
        </h1>

        {/* Short, To-The-Point Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed mb-8 text-center font-normal">
          Spin up live sandboxes in seconds. Run real kubectl commands, debug cluster outages, and verify fixes with instant AI feedback.
        </p>

        {/* 4 Clean Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-9 text-xs font-mono text-slate-300 max-w-3xl">
          <div className="px-3.5 py-1.5 rounded-full bg-[#0e141f] border border-slate-800 flex items-center gap-2 shadow-sm hover:border-emerald-500/40 transition-colors">
            <span className="text-emerald-400 font-bold">⚡</span>
            <span>10s Live Sandbox</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#0e141f] border border-slate-800 flex items-center gap-2 shadow-sm hover:border-teal-500/40 transition-colors">
            <span className="text-teal-400">💻</span>
            <span>Real kubectl &amp; Logs</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#0e141f] border border-slate-800 flex items-center gap-2 shadow-sm hover:border-cyan-500/40 transition-colors">
            <span className="text-cyan-400">🛠️</span>
            <span>Fix Broken Manifests</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#0e141f] border border-slate-800 flex items-center gap-2 shadow-sm hover:border-purple-500/40 transition-colors">
            <span className="text-purple-400">🤖</span>
            <span>Instant AI Mentor</span>
          </div>
        </div>

        {/* Dual Hero CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <button
            onClick={scrollToLabs}
            className="px-7 py-3.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-black font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>Start Practice Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const demoCard = document.getElementById('live-demo-card');
              if (demoCard) {
                demoCard.scrollIntoView({ behavior: 'smooth' });
              } else {
                scrollToLabs();
              }
            }}
            className="px-7 py-3.5 rounded-full bg-[#0d121c] hover:bg-[#131a26] text-white border border-slate-700/80 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm hover:border-slate-500"
          >
            <Play className="w-3.5 h-3.5 fill-current text-slate-400" />
            <span>Watch a real run</span>
          </button>
        </div>

        {/* "SEE A LAB IN ACTION" Small Green Label */}
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#10b981] mb-4">
          SEE A LAB IN ACTION
        </span>

        {/* Interactive Live Simulator Preview Card */}
        <div id="live-demo-card" className="w-full max-w-4xl rounded-2xl bg-[#090d14] border border-[#1e293b] shadow-2xl overflow-hidden text-left hover:border-emerald-500/40 transition-all">
          {/* Mock Window Bar */}
          <div className="px-4 py-3 bg-[#0d121c] border-b border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono text-slate-400 ml-2">kubementor live demo</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                LIVE SANDBOX
              </span>
            </div>
          </div>

          {/* 3-Column Preview Interior */}
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono text-xs">
            {/* Left Column: Investigation Track */}
            <div className="p-3.5 rounded-xl bg-[#06090f] border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                01 | INVESTIGATION
              </span>
              <div className="text-xs text-slate-200 font-bold">CrashLoopBackOff Exit 1</div>
              <div className="text-[10px] text-slate-500">Inspect pod exit code 1 &amp; crash logs</div>
              <div className="pt-2">
                <span className="inline-block w-full py-1 text-center rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  ● Real VM Environment
                </span>
              </div>
            </div>

            {/* Middle Column: Terminal Snippet */}
            <div className="p-3.5 rounded-xl bg-[#06090f] border border-slate-800/80 text-[11px] space-y-1.5">
              <div className="text-slate-500">$ kubectl get pods</div>
              <div className="text-rose-400">web-app-crash 0/1 CrashLoopBackOff (4)</div>
              <div className="text-slate-500 mt-2">$ kubectl logs web-app-crash</div>
              <div className="text-amber-300">[FATAL] Missing APP_ENV variable</div>
            </div>

            {/* Right Column: Fix & AI Assistance */}
            <div className="p-3.5 rounded-xl bg-[#06090f] border border-slate-800/80 text-[11px] space-y-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                AI MENTOR HINT
              </span>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                "The container terminates with Exit Code 1. Fix the environment spec in YAML editor and apply."
              </p>
              <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold font-mono pt-1">
                <Check className="w-3.5 h-3.5" /> Solution Verified: PASS (100%)
              </div>
            </div>
          </div>

          {/* Interactive footer bar */}
          <div className="px-4 py-2.5 bg-[#0b0f17] border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realistic Linux cgroup &amp; kubelet crash simulation engine</span>
            </span>
            <button
              onClick={() => navigate('/lab/crash-loop-backoff')}
              className="text-emerald-400 hover:text-emerald-300 font-mono font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Launch This Scenario</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>


      {/* 2. BRING YOUR OWN APPLICATION (BYOA) PLAYGROUND BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0d121f] to-slate-950 border border-purple-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-mono">Custom Playgrounds (BYOA)</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ADVANCED SIMULATOR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Upload your own Kubernetes YAML manifests, run automated AST security and resource linting, inject simulated failure conditions, and test fixes in an isolated sandbox.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/byoa')}
          className="text-xs font-semibold whitespace-nowrap border-purple-500/40 text-purple-300 hover:bg-purple-500/10 shadow-sm py-2.5 px-4"
        >
          Launch BYOA Wizard <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* 3. SEARCH & DIFFICULTY FILTER CONTROLS */}
      <div ref={labsSectionRef} className="bg-[#0c1017] p-4 rounded-xl border border-slate-800 space-y-3.5">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search labs, topics, playgrounds (e.g. CrashLoop, OOM, Ingress, ConfigMap)..."
              className="w-full bg-[#080b11] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Difficulty:
            </span>
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                  selectedDifficulty === diff
                    ? 'bg-emerald-600 text-slate-950 border-emerald-400 font-black shadow-sm'
                    : 'bg-[#111722] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-mono text-slate-400 mr-1">Filter Track:</span>
          {[
            { id: 'All', label: 'All Topics' },
            { id: 'Troubleshooting', label: '🔥 6 Live Troubleshooting Labs' },
            { id: 'Basics', label: 'Kubernetes Basics (Roadmap)' },
            { id: 'Configuration', label: 'Configuration (Roadmap)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryTab(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                selectedCategoryTab === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm'
                  : 'bg-[#111722] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. PRIMARY SECTION: 6 LIVE TROUBLESHOOTING LABS (FIRST & PROMINENT) */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner label="Loading practice catalog..." size="lg" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* A. LIVE TROUBLESHOOTING TRACK */}
          {liveCategory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white font-mono tracking-tight">
                        Live Troubleshooting Labs
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                        ● 6 Live Labs Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Investigate live failures with simulated CLI terminal, Monaco YAML editor, and authoritative validation.
                    </p>
                  </div>
                </div>
              </div>

              <PracticeCategory
                category={liveCategory}
                masteryMap={masteryMap}
                onStartLab={handleStartLab}
                onViewDetails={handleViewDetails}
              />
            </div>
          )}

          {/* B. FUTURE SCOPE & UPCOMING ROADMAP */}
          {futureCategories.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-200 font-mono tracking-tight">
                        Planned Practice Roadmap (Future Scope)
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        In Active Curriculum Design
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Foundation practice modules scheduled for subsequent releases.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {futureCategories.map((category) => (
                  <PracticeCategory
                    key={category.categoryId}
                    category={category}
                    masteryMap={masteryMap}
                    onStartLab={handleStartLab}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MISSION DETAILS MODAL */}
      <Modal
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        title={selectedDetailItem ? `Mission Overview: ${selectedDetailItem.name}` : 'Mission Overview'}
      >
        {selectedDetailItem && (
          <div className="space-y-5">
            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Category: <strong className="text-slate-200">{selectedDetailItem.category}</strong></span>
              <span>•</span>
              <span className="text-slate-400">Difficulty: <strong className="text-emerald-400">{selectedDetailItem.difficulty}</strong></span>
              <span>•</span>
              <span className="text-slate-400">Estimated Time: <strong className="text-cyan-400">{selectedDetailItem.estTime || '15 mins'}</strong></span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Mission Objective</h4>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {selectedDetailItem.description}
              </p>
            </div>

            {/* Target Failure details if present */}
            {selectedDetailItem.expectedFailure && (
              <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                  Simulated Kubernetes Failure Condition
                </span>
                <p className="text-xs font-mono text-amber-200 font-bold">{selectedDetailItem.expectedFailure}</p>
              </div>
            )}

            {/* What you will do */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Your Practical Mission</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Inspect active failing pod states, container crash logs, and lifecycle events.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>Identify the underlying root cause without breaking sandbox cluster boundaries.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>Correct the manifest configuration in the Monaco YAML editor and apply fixes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">4.</span>
                  <span>Validate that all pods return to a healthy Running (1/1 Ready) state.</span>
                </li>
              </ul>
            </div>

            {/* Footer CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setSelectedDetailItem(null)}>
                Close
              </Button>
              {selectedDetailItem.isLive !== false ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    const item = selectedDetailItem;
                    setSelectedDetailItem(null);
                    handleStartLab(item);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Practice Lab
                </Button>
              ) : (
                <span className="text-xs font-mono text-slate-500 italic">Curriculum in Development</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LearnCatalog;
