import React, { useState } from 'react';
import {
  Layers,
  Wrench,
  Bomb,
  StopCircle,
  Flame,
  FileText,
  WifiOff,
  Lock,
  Box,
  Network,
  KeyRound,
  CheckCircle2,
  LockKeyhole,
  ArrowLeft,
  Terminal,
  FileCode2,
  Edit3,
  Bot,
  Sparkles,
  ChevronRight,
  List,
  Activity,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';

const TOPIC_CATEGORIES = [
  {
    id: 'troubleshooting',
    title: 'Troubleshooting Labs',
    icon: Wrench,
    items: [
      { id: 'crash-loop-backoff', code: '01', name: 'CrashLoopBackOff', icon: Bomb, isLive: true },
      { id: 'image-pull-backoff', code: '02', name: 'ImagePullBackOff', icon: StopCircle, isLive: true },
      { id: 'oom-killed', code: '03', name: 'OOMKilled Container', icon: Flame, isLive: true },
      { id: 'missing-configmap', code: '04', name: 'Missing ConfigMap', icon: FileText, isLive: true },
      { id: 'service-connectivity', code: '05', name: 'Service Connectivity', icon: WifiOff, isLive: true },
      { id: 'ingress-tls-failure', code: '06', name: 'Ingress TLS Failure', icon: Lock, isLive: true },
    ],
  },
  {
    id: 'basics',
    title: 'Kubernetes Basics',
    icon: Layers,
    items: [
      { id: 'topic-pods', code: '07', name: 'Pods & Multi-Container', icon: Box, isLive: false },
      { id: 'topic-deployments', code: '08', name: 'Deployments & Rollouts', icon: Layers, isLive: false },
      { id: 'topic-services', code: '09', name: 'Services & Networking', icon: Network, isLive: false },
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    icon: Layers,
    items: [
      { id: 'topic-configmaps', code: '10', name: 'ConfigMaps & Env Injection', icon: FileText, isLive: false },
      { id: 'topic-secrets', code: '11', name: 'Secrets & TLS Keys', icon: KeyRound, isLive: false },
    ],
  },
];

// Scenario-specific roadmap steps matching learning progression
const SCENARIO_ROADMAPS = {
  'crash-loop-backoff': [
    { type: 'LESSON', title: 'What is CrashLoopBackOff', tab: 'briefing' },
    { type: 'DIAGNOSTICS', title: 'Inspect Pods & Exit Codes', tab: 'terminal' },
    { type: 'LESSON', title: 'Container Lifecycle & Crashes', tab: 'briefing' },
    { type: 'TASK', title: 'Fix Entrypoint & Environment', tab: 'editor' },
    { type: 'QUIZ', title: 'Diagnose Application Restart', tab: 'scratchpad' },
    { type: 'VALIDATION', title: 'Validate 1/1 Running State', tab: 'validate' },
  ],
  'image-pull-backoff': [
    { type: 'LESSON', title: 'What is ImagePullBackOff', tab: 'briefing' },
    { type: 'DIAGNOSTICS', title: 'Check Image Tag & Registry', tab: 'terminal' },
    { type: 'LESSON', title: 'ErrImagePull vs ImagePullBackOff', tab: 'briefing' },
    { type: 'TASK', title: 'Update Container Image in YAML', tab: 'editor' },
    { type: 'QUIZ', title: 'Analyze Image Pull Events', tab: 'scratchpad' },
    { type: 'VALIDATION', title: 'Validate Image Pull & Start', tab: 'validate' },
  ],
  'oom-killed': [
    { type: 'LESSON', title: 'What is OOMKilled (Exit 137)', tab: 'briefing' },
    { type: 'DIAGNOSTICS', title: 'Inspect Memory Limits & Logs', tab: 'terminal' },
    { type: 'LESSON', title: 'Kubernetes QoS Classes', tab: 'briefing' },
    { type: 'TASK', title: 'Tune Container Memory Limits', tab: 'editor' },
    { type: 'QUIZ', title: 'Identify Memory Leaks vs Sizing', tab: 'scratchpad' },
    { type: 'VALIDATION', title: 'Validate Workload Stability', tab: 'validate' },
  ],
  'missing-configmap': [
    { type: 'LESSON', title: 'What is CreateContainerConfigError', tab: 'briefing' },
    { type: 'DIAGNOSTICS', title: 'Inspect Pod Events & Missing Key', tab: 'terminal' },
    { type: 'LESSON', title: 'ConfigMap Volume Mounts vs Env', tab: 'briefing' },
    { type: 'TASK', title: 'Provision ConfigMap & Apply YAML', tab: 'editor' },
    { type: 'QUIZ', title: 'ConfigMap Lifecycle & Hot-Reload', tab: 'scratchpad' },
    { type: 'VALIDATION', title: 'Validate Environment Injected', tab: 'validate' },
  ],
  'service-connectivity': [
    { type: 'LESSON', title: 'What is Service Connectivity Failure', tab: 'briefing' },
    { type: 'DIAGNOSTICS', title: 'Inspect Service Endpoints & DNS', tab: 'terminal' },
    { type: 'LESSON', title: 'Selectors, TargetPort & Endpoints', tab: 'briefing' },
    { type: 'TASK', title: 'Fix Service Selector in YAML', tab: 'editor' },
    { type: 'QUIZ', title: 'ClusterIP vs NodePort Resolution', tab: 'scratchpad' },
    { type: 'VALIDATION', title: 'Validate HTTP Service Endpoint', tab: 'validate' },
  ],
  'ingress-tls-failure': [
    { type: 'LESSON', title: 'What is Ingress & TLS Failure', tab: 'briefing' },
    { type: 'DIAGNOSTICS', title: 'Inspect Ingress Controller Events', tab: 'terminal' },
    { type: 'LESSON', title: 'TLS Secret Format & Host Mismatch', tab: 'briefing' },
    { type: 'TASK', title: 'Provision TLS Secret & Fix Ingress', tab: 'editor' },
    { type: 'QUIZ', title: 'Verify SSL Handshake & Host Rule', tab: 'scratchpad' },
    { type: 'VALIDATION', title: 'Validate HTTPS Termination', tab: 'validate' },
  ],
};

export const WorkspaceNavPane = ({
  activeLabId,
  session,
  validationResult,
  activeWorkbenchTab = 'terminal',
  onSelectTab,
  onSelectLab,
  onValidateSolution,
  onOpenPostMortem,
}) => {
  // Toggle between single-scenario roadmap view and full catalog list
  const [viewMode, setViewMode] = useState('roadmap'); // 'roadmap' | 'catalog'
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Find scenario metadata
  const currentScenarioItem = TOPIC_CATEGORIES.flatMap((c) => c.items).find(
    (item) => item.id === activeLabId
  );
  const scenarioCode = currentScenarioItem?.code || '01';
  const scenarioShortName = currentScenarioItem?.name || session?.title || activeLabId;

  // Validation progress calculation
  const isPassed = validationResult?.status === 'PASS';
  const passedChecksCount = validationResult?.checks?.filter((c) => c.status === 'PASS')?.length || 0;
  const totalChecksCount = validationResult?.checks?.length || (isPassed ? 4 : 4);
  const progressPercent = isPassed
    ? 100
    : validationResult
    ? Math.round((passedChecksCount / (totalChecksCount || 1)) * 100)
    : 0;

  // Get steps for the current scenario or fallback
  const rawSteps = SCENARIO_ROADMAPS[activeLabId] || SCENARIO_ROADMAPS['crash-loop-backoff'];
  
  const steps = rawSteps.map((step, idx) => {
    // Determine completion and active status
    const isStepDone = isPassed || (idx < activeStepIndex);
    const isStepActive = idx === activeStepIndex;

    return {
      ...step,
      index: idx,
      isDone: isStepDone,
      isActive: isStepActive,
    };
  });

  const handleStepClick = (step, idx) => {
    setActiveStepIndex(idx);
    if (step.tab === 'validate') {
      if (onValidateSolution) onValidateSolution();
    } else if (step.tab && onSelectTab) {
      onSelectTab(step.tab);
    }
  };

  // 1. CATALOG MODE VIEW (When user clicks back or browse)
  if (viewMode === 'catalog') {
    return (
      <aside className="w-full h-full bg-[#0a0d14] border-r border-slate-800/80 flex flex-col overflow-hidden select-none font-sans text-slate-200">
        {/* Header */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={() => setViewMode('roadmap')}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Active Scenario</span>
          </button>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            6 Live Labs
          </span>
        </div>

        {/* All Topic Catalog List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {TOPIC_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.id} className="space-y-1">
                <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                  <CatIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{cat.title}</span>
                </div>

                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeLabId === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectLab(item.id, item.isLive);
                          setViewMode('roadmap');
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-all group ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm'
                            : item.isLive
                            ? 'text-slate-300 hover:bg-slate-900 hover:text-white'
                            : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ItemIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive
                                ? 'text-emerald-400'
                                : item.isLive
                                ? 'text-slate-400 group-hover:text-slate-300'
                                : 'text-slate-600'
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        <div className="shrink-0 ml-1">
                          {isActive ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                          ) : item.isLive ? (
                            <span className="text-[10px] font-mono text-slate-600 group-hover:text-slate-400">
                              ○
                            </span>
                          ) : (
                            <LockKeyhole className="w-3 h-3 text-slate-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  // 2. SCENARIO ROADMAP VIEW (Matches User's Reference Screenshot)
  return (
    <aside className="w-full h-full bg-[#080b11] border-r border-slate-800/80 flex flex-col overflow-hidden select-none font-sans text-slate-200">
      {/* Top Navigation Bar: [ ← ] [ >_ esc bash ] [ 01 - Title... ] [ < ] */}
      <div className="px-3 py-2.5 border-b border-slate-800/80 bg-[#0c1017] flex items-center justify-between gap-2">
        <button
          onClick={() => setViewMode('catalog')}
          title="Back to all scenarios"
          className="p-1 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Small Terminal Shell Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131924] border border-slate-700/60 text-[11px] font-mono font-medium text-emerald-400 truncate max-w-[170px]">
          <span className="text-slate-500 font-bold">&gt;_</span>
          <span className="text-emerald-400 font-bold">{scenarioCode}</span>
          <span className="text-slate-300 font-semibold truncate">
            - {scenarioShortName}
          </span>
        </div>

        {/* Catalog Toggle / Next Scenario */}
        <button
          onClick={() => setViewMode('catalog')}
          title="Browse all scenarios"
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* Circular Progress Gauge */}
      <div className="pt-5 pb-3 px-4 flex flex-col items-center justify-center border-b border-slate-800/60 bg-gradient-to-b from-[#0c1017] to-transparent">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* SVG Circular Progress Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Track */}
            <path
              className="text-slate-800/90"
              strokeWidth="3.2"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Animated Progress Bar */}
            <path
              className={`${
                isPassed ? 'text-emerald-400' : 'text-emerald-500'
              } transition-all duration-700 ease-out`}
              strokeDasharray={`${progressPercent}, 100`}
              strokeWidth="3.2"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>

          {/* Center Percentage Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* 3 Metric Summary Boxes in a Row: [0 DONE] [0/2 QUIZZES] [0/1 TASKS] */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          <div className="p-2 rounded-xl bg-[#111722] border border-slate-800/90 text-center shadow-inner">
            <span className="block text-sm font-bold text-white font-mono leading-none">
              {isPassed ? '1' : '0'}
            </span>
            <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider mt-1">
              DONE
            </span>
          </div>

          <div className="p-2 rounded-xl bg-[#111722] border border-slate-800/90 text-center shadow-inner">
            <span className="block text-sm font-bold text-white font-mono leading-none">
              {isPassed ? `${totalChecksCount}/${totalChecksCount}` : `${passedChecksCount}/${totalChecksCount}`}
            </span>
            <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider mt-1">
              CHECKS
            </span>
          </div>

          <div className="p-2 rounded-xl bg-[#111722] border border-slate-800/90 text-center shadow-inner">
            <span className="block text-sm font-bold text-white font-mono leading-none">
              {isPassed ? '1/1' : '0/1'}
            </span>
            <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider mt-1">
              TASKS
            </span>
          </div>
        </div>
      </div>

      {/* Stepped Vertical Roadmap / Timeline List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
        <div className="relative pl-1">
          {/* Continuous vertical timeline connecting line */}
          <div className="absolute left-[15px] top-3 bottom-3 w-[1.5px] bg-slate-800/90 pointer-events-none" />

          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleStepClick(step, idx)}
                className={`w-full text-left p-2 rounded-xl flex items-start gap-3 transition-all relative group ${
                  step.isActive
                    ? 'bg-emerald-500/10 text-white'
                    : 'hover:bg-slate-900/60 text-slate-300'
                }`}
              >
                {/* Step Node Marker Icon */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  {step.isDone ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : step.isActive ? (
                    <div className="w-5 h-5 rounded-full bg-[#080b11] border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#080b11] border-2 border-slate-700 flex items-center justify-center group-hover:border-slate-500 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-slate-500" />
                    </div>
                  )}
                </div>

                {/* Step Category & Title */}
                <div className="flex-1 min-w-0 pr-1">
                  <span
                    className={`text-[9px] font-mono font-extrabold uppercase tracking-wider block leading-none ${
                      step.isActive || step.isDone
                        ? 'text-emerald-400'
                        : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  >
                    {step.type}
                  </span>
                  <span
                    className={`text-xs font-semibold block truncate mt-1 ${
                      step.isActive
                        ? 'text-white'
                        : step.isDone
                        ? 'text-slate-200'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Status Bar */}
      <div className="px-3 py-2.5 bg-[#0c1017] border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">Live Sandbox</span>
        </span>
        <button
          onClick={() => setViewMode('catalog')}
          className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
        >
          All Topics →
        </button>
      </div>
    </aside>
  );
};

export default WorkspaceNavPane;
