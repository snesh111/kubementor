import React from 'react';
import {
  Layers,
  Settings,
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
  ChevronRight,
} from 'lucide-react';

const TOPIC_CATEGORIES = [
  {
    id: 'troubleshooting',
    title: 'Troubleshooting Labs',
    icon: Wrench,
    items: [
      { id: 'crash-loop-backoff', name: 'CrashLoopBackOff', icon: Bomb, isLive: true },
      { id: 'image-pull-backoff', name: 'ImagePullBackOff', icon: StopCircle, isLive: true },
      { id: 'oom-killed', name: 'OOMKilled Container', icon: Flame, isLive: true },
      { id: 'missing-configmap', name: 'Missing ConfigMap', icon: FileText, isLive: true },
      { id: 'service-connectivity', name: 'Service Connectivity', icon: WifiOff, isLive: true },
      { id: 'ingress-tls-failure', name: 'Ingress TLS Failure', icon: Lock, isLive: true },
    ],
  },
  {
    id: 'basics',
    title: 'Kubernetes Basics',
    icon: Layers,
    items: [
      { id: 'topic-pods', name: 'Pods & Multi-Container', icon: Box, isLive: false },
      { id: 'topic-deployments', name: 'Deployments & Rollouts', icon: Layers, isLive: false },
      { id: 'topic-services', name: 'Services & Networking', icon: Network, isLive: false },
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    icon: Settings,
    items: [
      { id: 'topic-configmaps', name: 'ConfigMaps & Env Injection', icon: FileText, isLive: false },
      { id: 'topic-secrets', name: 'Secrets & TLS Keys', icon: KeyRound, isLive: false },
    ],
  },
];

export const WorkspaceNavPane = ({ activeLabId, onSelectLab }) => {
  return (
    <aside className="w-full h-full bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden select-none">
      {/* Pane Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Practice Topics
        </span>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
          6 Live Labs
        </span>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 font-sans text-xs">
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
                      onClick={() => onSelectLab(item.id, item.isLive)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-all group ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 font-semibold shadow-sm'
                          : item.isLive
                          ? 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <ItemIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-cyan-400' : item.isLive ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      <div className="shrink-0 ml-1">
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
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

      {/* Pane Footer Status */}
      <div className="p-3 bg-slate-900/40 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <span>KubeMentor v1.0</span>
        <span className="text-emerald-400">● Sandbox Ready</span>
      </div>
    </aside>
  );
};

export default WorkspaceNavPane;
