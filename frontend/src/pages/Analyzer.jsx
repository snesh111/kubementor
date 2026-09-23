import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
  Cpu,
  Send,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Terminal,
  Layers,
  ArrowRight,
  Zap,
  Bomb,
  StopCircle,
  Flame,
  FileText,
  WifiOff,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import analyzerService from '../services/analyzerService';

const SAMPLE_SNIPPETS = [
  {
    id: 'crash-loop',
    label: 'CrashLoopBackOff Logs',
    icon: Bomb,
    type: 'log',
    content: `2026-09-22T10:14:02.124Z [FATAL] [server] Application failed to bootstrap.
Error: Mandatory runtime environment variable "DB_CONNECTION_STRING" is undefined or empty.
    at bootstrapServer (/app/dist/index.js:42:15)
    at Object.<anonymous> (/app/dist/index.js:89:1)
npm ERR! Lifecycle script \`start\` failed with error: exit code 1
Events:
  Warning  BackOff  12s (x4 over 1m)  kubelet  Back-off restarting failed container web-app in pod web-app-79f8d9b-x2k4j`,
  },
  {
    id: 'image-pull',
    label: 'ImagePullBackOff YAML',
    icon: StopCircle,
    type: 'yaml',
    content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: nginx:1.999.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80`,
  },
  {
    id: 'oom-killed',
    label: 'OOMKilled Event Dump',
    icon: Flame,
    type: 'log',
    content: `State:          Waiting
  Reason:       CrashLoopBackOff
Last State:     Terminated
  Reason:       OOMKilled
  Exit Code:    137
  Started:      Tue, 22 Sep 2026 14:20:10 +0000
  Finished:     Tue, 22 Sep 2026 14:20:13 +0000
Events:
  Warning  OOMKilling  45s  kernel-monitor  Memory cgroup out of memory: Killed process 1823 (node) total-vm:294820kB, anon-rss:65412kB, file-rss:0kB`,
  },
  {
    id: 'service-mismatch',
    label: 'Selector Mismatch YAML',
    icon: WifiOff,
    type: 'yaml',
    content: `apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: ClusterIP
  selector:
    app: web-server-v2
  ports:
  - port: 80
    targetPort: 8080`,
  },
  {
    id: 'clean-spec',
    label: 'Production Ready Spec',
    icon: ShieldCheck,
    type: 'yaml',
    content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  labels:
    app: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        readinessProbe:
          httpGet:
            path: /healthz
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10`,
  },
];

export const Analyzer = () => {
  const [logInput, setLogInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunAnalysis = async () => {
    if (!logInput.trim()) {
      setError('Please paste a Kubernetes manifest or log snippet to analyze.');
      return;
    }

    if (logInput.trim().length < 10) {
      setError('Input is too short. Please provide a valid YAML spec or terminal log output.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await analyzerService.analyzeRaw(logInput.trim());
      const resultData = res.data?.data?.analysis || res.data?.analysis || res.data || {};
      setAnalysisResult(resultData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to analyze snippet. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (sample) => {
    setLogInput(sample.content);
    setError(null);
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-6 select-text max-w-7xl mx-auto font-sans pb-16">
      {/* 1. Page Header */}
      <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-4 h-4" />
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            AI Troubleshooting &amp; Readiness Engine
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          AI Log &amp; YAML Analyzer
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
          Paste Kubernetes container logs, pod describe events, or manifest YAML to receive instant root cause diagnosis, explainable readiness scoring, and actionable remediation steps.
        </p>
      </div>

      {/* 2. Quick Sample Picker Pills */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
          Quick Load Common Kubernetes Failure Samples:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_SNIPPETS.map((sample) => {
            const Icon = sample.icon;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#080d14] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-500 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Icon className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>{sample.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Two-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Input Card */}
        <div className="bg-white dark:bg-[#080d14] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                Input Manifest or Log Snippet
              </h2>
            </div>
            {logInput && (
              <button
                type="button"
                onClick={() => {
                  setLogInput('');
                  setAnalysisResult(null);
                  setError(null);
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear Input
              </button>
            )}
          </div>

          <textarea
            value={logInput}
            onChange={(e) => {
              setLogInput(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste raw kubectl logs, pod describe events, or deployment YAML spec here..."
            rows={14}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors custom-scrollbar leading-relaxed"
          />

          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleRunAnalysis}
            disabled={isLoading || !logInput.trim()}
            className="w-full py-3 text-xs sm:text-sm font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Running Diagnosis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Analysis</span>
              </>
            )}
          </Button>
        </div>

        {/* RIGHT COLUMN: Results / Findings Card */}
        <div className="bg-white dark:bg-[#080d14] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl min-h-[440px] flex flex-col justify-between space-y-5">
          {!analysisResult && !isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                  Ready for AI Inspection
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Paste raw logs or YAML on the left, or pick one of the quick samples above and click <strong>Run AI Analysis</strong>.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                  Evaluating Telemetry &amp; Specs
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scanning container exit codes, cgroup limits, and manifest schemas...
                </p>
              </div>
            </div>
          ) : (
            /* ACTIVE ANALYSIS FINDINGS */
            <div className="space-y-5 flex-1">
              {/* Header Status Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    {analysisResult.inputType || 'Analysis Output'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                      analysisResult.severity === 'INVALID'
                        ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
                        : analysisResult.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : analysisResult.severity === 'WARNING' || analysisResult.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {analysisResult.severity === 'INVALID' ? 'UNRECOGNIZED INPUT' : analysisResult.severity || 'EVALUATED'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white font-mono leading-tight">
                    {analysisResult.rootCause || analysisResult.summary || 'Diagnosis Complete'}
                  </h3>
                  {analysisResult.summary && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysisResult.summary}
                    </p>
                  )}
                </div>

                {analysisResult.overallScore !== undefined && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Readiness Score:</span>
                    {analysisResult.severity === 'INVALID' ? (
                      <span className="text-slate-400 font-bold">N/A (Unrecognized Text)</span>
                    ) : (
                      <span
                        className={`font-black ${
                          analysisResult.overallScore >= 80
                            ? 'text-emerald-400'
                            : analysisResult.overallScore >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {analysisResult.overallScore} / 100
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Detected Issues / Findings */}
              {analysisResult.findings && analysisResult.findings.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                    Diagnostic Findings ({analysisResult.findings.length}):
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {analysisResult.findings.map((f, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          f.severity === 'CRITICAL'
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                            : f.severity === 'HIGH' || f.severity === 'WARNING'
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                          <span>{f.title}</span>
                          <span className="opacity-80 text-[10px]">{f.category}</span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          {f.description}
                        </p>
                        {f.recommendation && (
                          <p className="text-[11px] text-emerald-400 font-mono pt-1">
                            Fix: {f.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Remediation Playbook */}
              {analysisResult.playbook && analysisResult.playbook.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                    Recommended CLI Remediation Playbook:
                  </span>
                  <div className="space-y-1.5">
                    {analysisResult.playbook.map((step, idx) => {
                      const text = step.action || step;
                      return (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-emerald-400 group"
                        >
                          <span className="truncate">{text}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(text, `step-${idx}`)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
                            title="Copy command"
                          >
                            {copiedKey === `step-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 group-hover:text-emerald-400" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Corrected Snippet Diff */}
              {analysisResult.correctedSnippet && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                      Suggested Manifest Patch:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(analysisResult.correctedSnippet, 'snippet')}
                      className="text-[11px] font-mono text-emerald-500 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'snippet' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'snippet' ? 'Copied' : 'Copy Patch'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed custom-scrollbar max-h-48">
                    {analysisResult.correctedSnippet}
                  </pre>
                </div>
              )}

              {/* Direct Link to Practice in Live Sandbox */}
              <div className="pt-2">
                <NavLink
                  to="/learn"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Launch Practice Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
