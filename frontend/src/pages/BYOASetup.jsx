import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  Terminal,
  CheckCircle2,
  Layers,
  Info,
  FolderKanban,
  RotateCcw,
  Zap,
  Boxes,
  Cpu,
  Server,
  ArrowRight,
} from 'lucide-react';
import byoaService from '../services/byoaService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PRESET_TEMPLATES = [
  {
    name: 'Microservice with Service & ConfigMap',
    description: 'Deployment with 2 replicas, ClusterIP service, and environment ConfigMap.',
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
  labels:
    app: demo-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: demo-api
  template:
    metadata:
      labels:
        app: demo-api
    spec:
      containers:
      - name: api
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        env:
        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: demo-config
              key: ENVIRONMENT
        resources:
          limits:
            memory: "128Mi"
            cpu: "250m"
          requests:
            memory: "64Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: demo-api-service
  labels:
    app: demo-api
spec:
  type: ClusterIP
  selector:
    app: demo-api
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: demo-config
data:
  ENVIRONMENT: "sandbox-production"
  LOG_LEVEL: "info"
`,
  },
  {
    name: 'Standalone Pod & Secret',
    description: 'Single standalone Pod reading sensitive credentials from a Secret.',
    yaml: `apiVersion: v1
kind: Pod
metadata:
  name: batch-worker
  labels:
    app: worker
spec:
  containers:
  - name: worker
    image: alpine:3.19
    command: ["/bin/sh", "-c", "echo Worker starting with token: $API_TOKEN && sleep 3600"]
    env:
    - name: API_TOKEN
      valueFrom:
        secretKeyRef:
          name: worker-secret
          key: token
    resources:
      limits:
        memory: "64Mi"
        cpu: "100m"
---
apiVersion: v1
kind: Secret
metadata:
  name: worker-secret
type: Opaque
stringData:
  token: "sandbox-secure-token-998877"
`,
  },
];

export const BYOASetup = () => {
  const navigate = useNavigate();
  const [appName, setAppName] = useState('My Custom Workload');
  const [description, setDescription] = useState('Custom Kubernetes manifest testing in isolated sandbox');
  const [manifestYaml, setManifestYaml] = useState(PRESET_TEMPLATES[0].yaml);
  const [validationState, setValidationState] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState(null);
  const [existingLabs, setExistingLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(true);

  // Load existing BYOA labs
  const fetchExistingLabs = async () => {
    try {
      setLoadingLabs(true);
      const res = await byoaService.getUserBYOALabs();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setExistingLabs(list);
    } catch (err) {
      console.warn('[BYOASetup] Failed to load existing BYOA labs:', err);
      setExistingLabs([]);
    } finally {
      setLoadingLabs(false);
    }
  };

  useEffect(() => {
    fetchExistingLabs();
  }, []);

  // Real-time manifest validation
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!manifestYaml || manifestYaml.trim().length === 0) {
        setValidationState(null);
        return;
      }

      try {
        setIsValidating(true);
        const result = await byoaService.validateManifests(manifestYaml);
        if (active) {
          setValidationState(result);
        }
      } catch (err) {
        if (active) {
          setValidationState({
            valid: false,
            errors: [err.message || 'Validation request failed'],
            warnings: [],
            resources: [],
            documentCount: 0,
            sizeBytes: 0,
          });
        }
      } finally {
        if (active) setIsValidating(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [manifestYaml]);

  const handleApplyPreset = (preset) => {
    setAppName(preset.name);
    setDescription(preset.description);
    setManifestYaml(preset.yaml);
    setDeployError(null);
  };

  const handleDeploy = async () => {
    if (!validationState || !validationState.valid) {
      setDeployError('Please resolve manifest validation errors before launching the lab.');
      return;
    }

    try {
      setIsDeploying(true);
      setDeployError(null);
      const session = await byoaService.createBYOALab(manifestYaml, appName, description);
      // Navigate to unified 3-pane lab workspace
      navigate(`/lab/${session.labId}`);
    } catch (err) {
      console.error('[BYOASetup] Failed to deploy BYOA lab:', err);
      setDeployError(err.message || 'Failed to create isolated BYOA sandbox environment.');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Advanced Capability
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Bring Your Own <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Application (BYOA)</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Import and test your custom Kubernetes manifests in an isolated, safe sandbox environment. Use the full 3-pane terminal, YAML editor, AI Mentor diagnostics, and automated runtime health checks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/learn')}
              className="text-xs"
            >
              <Terminal className="w-4 h-4 mr-1.5 text-cyan-400" />
              Beginner Practice Catalog
            </Button>
          </div>
        </div>
      </div>

      {/* Preset Starters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-mono">
            <Zap className="w-4 h-4 text-cyan-400" />
            Quick Manifest Presets
          </h2>
          <span className="text-xs text-slate-500">Click to load boilerplate YAML</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_TEMPLATES.map((preset) => (
            <div
              key={preset.name}
              onClick={() => handleApplyPreset(preset)}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 cursor-pointer transition-all flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 group-hover:scale-105 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {preset.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{preset.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace Grid: YAML Input & Live Security Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Manifest Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Orders Microservice"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Testing v2.1 ingress configuration"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Kubernetes Manifests (Multi-Document YAML)
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  Separate with <code className="text-cyan-400">---</code>
                </span>
              </div>
              <textarea
                value={manifestYaml}
                onChange={(e) => setManifestYaml(e.target.value)}
                rows={16}
                spellCheck={false}
                placeholder="Paste Deployment, Service, ConfigMap, Secret, Ingress, Pod YAML here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Pre-flight Security Inspector & Launch Action (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Security & Quota Inspector */}
          <Card className="bg-slate-900/80 border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Pre-Flight Sandbox Inspector
              </h2>
              {isValidating ? (
                <span className="text-[10px] font-mono text-cyan-400 animate-pulse">Checking...</span>
              ) : validationState?.valid ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              ) : validationState ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-3 h-3" /> Blocked
                </span>
              ) : null}
            </div>

            {/* Quota & Size Telemetry */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">DOCUMENTS</span>
                <p className="font-bold text-slate-200 mt-0.5">
                  {validationState?.documentCount || 0} / 15 max
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">SIZE</span>
                <p className="font-bold text-slate-200 mt-0.5">
                  {Math.round((validationState?.sizeBytes || 0) / 1024)} KB / 500 KB max
                </p>
              </div>
            </div>

            {/* Detected Resources */}
            <div>
              <p className="text-[11px] font-mono text-slate-400 uppercase mb-2">
                Detected Sandbox Resources
              </p>
              {validationState?.resources && validationState.resources.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {validationState.resources.map((r, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-cyan-400 font-bold">{r.kind}</span>
                      <span className="text-slate-300 truncate max-w-[150px]">{r.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No resources detected yet.</p>
              )}
            </div>

            {/* Errors if any */}
            {validationState?.errors && validationState.errors.length > 0 && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg space-y-1">
                <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Security / Policy Errors:
                </p>
                <ul className="text-[11px] text-rose-300 list-disc list-inside space-y-0.5 font-mono">
                  {validationState.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings if any */}
            {validationState?.warnings && validationState.warnings.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1">
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Isolation Notices:
                </p>
                <ul className="text-[11px] text-amber-300 list-disc list-inside space-y-0.5 font-mono">
                  {validationState.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deploy Error Alert */}
            {deployError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                {deployError}
              </div>
            )}

            {/* Launch Action */}
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleDeploy}
                disabled={isDeploying || isValidating || !validationState?.valid}
                className="w-full text-sm py-3 font-semibold shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2"
              >
                {isDeploying ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Provisioning Isolated Sandbox...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Deploy & Open Lab Workspace</span>
                  </>
                )}
              </Button>
              <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
                Opens interactive 3-pane terminal, editor & AI mentor workspace
              </p>
            </div>
          </Card>

          {/* Sandbox Lifecycle & Node Architecture Callout */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase">
                <Server className="w-4 h-4 text-cyan-400" />
                Sandbox Lifecycle & Node Details
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                60-Min TTL
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold font-mono">1.</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-200">Creation & Isolation:</strong> Deploys into an ephemeral namespace (<code className="text-cyan-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">kubementor-u&lt;id&gt;-p&lt;id&gt;</code>) with dedicated RBAC.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold font-mono">2.</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-200">Runtime Duration:</strong> Runs for <strong className="text-amber-300">1 hour (60 minutes)</strong> of active testing. When the session expires or is reset, ephemeral workloads are automatically cleaned up.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold font-mono">3.</span>
                <p className="leading-relaxed">
                  <strong className="text-slate-200">Node Guardrails:</strong> Auto-assigned <code className="text-purple-300 font-mono text-[11px] bg-slate-950 px-1 py-0.5 rounded">ResourceQuota</code> (2 CPU cores, 4GB Memory limit, max 10 Pods) to prevent node exhaustion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Previous BYOA Labs Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-purple-400" />
            My BYOA Application Labs
          </h2>
          <span className="text-xs text-slate-400 font-mono">Saved Sandbox Sessions</span>
        </div>

        {loadingLabs ? (
          <div className="p-6 text-center text-slate-500 font-mono text-xs">
            <LoadingSpinner size="sm" className="mx-auto mb-2" />
            Loading BYOA labs...
          </div>
        ) : Array.isArray(existingLabs) && existingLabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingLabs.map((lab) => (
              <Card
                key={lab.labId}
                className="bg-slate-900/60 border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      BYOA
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        lab.lastValidationStatus === 'PASS'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : lab.lastValidationStatus === 'PARTIAL'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {lab.lastValidationStatus === 'PASS'
                        ? 'HEALTHY (100%)'
                        : lab.lastValidationStatus === 'PARTIAL'
                        ? `PARTIAL (${lab.lastScore}%)`
                        : 'UNVALIDATED'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{lab.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{lab.description}</p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Namespace: <span className="text-slate-300">{lab.namespace}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {lab.fileCount} Manifest File{lab.fileCount === 1 ? '' : 's'}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/lab/${lab.labId}`)}
                    className="text-xs"
                  >
                    Open Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-slate-500">
            <p className="text-sm">No custom application labs created yet.</p>
            <p className="text-xs mt-1">Paste your Kubernetes YAML manifests above and click Deploy to launch your first BYOA lab.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BYOASetup;
