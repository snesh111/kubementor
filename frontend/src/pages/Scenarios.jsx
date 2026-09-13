import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Play,
  CheckCircle,
  AlertTriangle,
  Flame,
  Bomb,
  WifiOff,
  Lock,
  StopCircle,
  FileText,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  FolderPlus,
  Terminal,
  Layers,
  GraduationCap,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ScenarioLearningGuide from '../components/scenarios/ScenarioLearningGuide';
import useProjects from '../hooks/useProjects';
import scenarioService from '../services/scenarioService';

// Default rich catalog fallback if backend hasn't seeded or network is offline
const DEFAULT_SCENARIOS_CATALOG = [
  {
    scenarioId: 'crash-loop-backoff',
    name: 'Application CrashLoopBackOff with Exit Code 1',
    category: 'Crash & Lifecycle',
    difficulty: 'Beginner',
    expectedFailure: 'CrashLoopBackOff (exit code 1)',
    description:
      'Simulates a web microservice container crashing immediately upon boot due to missing mandatory configuration variables and unhandled fatal exceptions.',
    concept: {
      whatIsIt:
        'CrashLoopBackOff is a Kubernetes state indicating that a container repeatedly crashes right after starting. The kubelet restarts it using exponential backoff delay (10s, 20s, 40s... up to 5 minutes) to protect node CPU and disk I/O.',
      whyItHappens: [
        'Missing mandatory environment variables required at startup',
        'Application fatal exception during initial initialization',
        'Database connection failure or invalid credentials',
        'Command or Entrypoint misconfiguration inside Dockerfile',
      ],
      whenItHappens:
        'Triggered by Kubelet when the container runtime process exits with a non-zero exit code (such as exit code 1 or 255) and restarts multiple times.',
      productionImpact:
        'Downtime for the workload, failing readiness probes, cascading service outages, and potential SLA breaches.',
      troubleshootingPlaybook: [
        {
          step: 1,
          action: 'Inspect Pod Status & Restart Count',
          command: 'kubectl get pods -n <namespace> -l app=<app-label>',
          explanation: 'Check if the pod is in CrashLoopBackOff and see how many restarts have accumulated.',
        },
        {
          step: 2,
          action: 'Examine Container Termination Reason & Exit Code',
          command: 'kubectl describe pod <pod-name> -n <namespace>',
          explanation: 'Look at the Last State section to find the Exit Code and termination message.',
        },
        {
          step: 3,
          action: 'Fetch Application Crash Logs',
          command: 'kubectl logs <pod-name> -n <namespace> --previous',
          explanation: 'Use the --previous flag to inspect the stdout/stderr logs of the crashed container instance.',
        },
        {
          step: 4,
          action: 'Fix Configuration or Code and Redeploy',
          command: 'kubectl apply -f manifest.yaml',
          explanation: 'Inject the missing environment variable or fix the crash logic, then apply the updated manifest.',
        },
      ],
      commonMistakes: [
        'Looking only at live logs instead of using `kubectl logs --previous`',
        'Assuming Kubernetes is broken rather than checking application startup exceptions',
        'Setting `restartPolicy: Never` as a workaround instead of fixing the root cause',
      ],
      proTips: [
        'Always set reasonable liveness and startup probes so the application has time to initialize.',
        'Use exit codes standardly in your containers (exit 0 for clean shutdown, exit 1 for general errors).',
      ],
    },
  },
  {
    scenarioId: 'image-pull-backoff',
    name: 'ImagePullBackOff & ErrImagePull Tag Mismatch',
    category: 'Crash & Lifecycle',
    difficulty: 'Beginner',
    expectedFailure: 'ImagePullBackOff / ErrImagePull',
    description:
      'Injects an invalid or non-existent container image tag to trigger ImagePullBackOff, preventing the pod from scheduling and starting.',
    concept: {
      whatIsIt:
        'ImagePullBackOff occurs when the Kubelet fails to download the container image specified in the pod spec. Kubernetes enters an exponential backoff loop while retrying the pull.',
      whyItHappens: [
        'Typo in container image repository name or image tag',
        'Image does not exist in registry or has been deleted',
        'Missing or invalid imagePullSecrets for private registries',
        'Registry rate limits (e.g. Docker Hub unauthenticated pull rate limits)',
      ],
      whenItHappens:
        'Triggered during the Pod creation lifecycle when Kubelet delegates container image pulling to the Container Runtime Interface (CRI) and receives an HTTP 404, 401, or 403 error.',
      productionImpact:
        'New pod replicas cannot launch, rolling updates get permanently stuck, and zero new instances can serve traffic.',
      troubleshootingPlaybook: [
        {
          step: 1,
          action: 'Check Pod Status & Events',
          command: 'kubectl describe pod <pod-name> -n <namespace>',
          explanation: 'Inspect the Events section at the bottom of the describe output for Failed to pull image messages.',
        },
        {
          step: 2,
          action: 'Verify Container Image Name & Tag',
          command: 'kubectl get pod <pod-name> -o jsonpath="{.spec.containers[*].image}"',
          explanation: 'Verify if the image repository and tag exist on Docker Hub, GitHub Packages (GHCR), or ECR/GCR.',
        },
        {
          step: 3,
          action: 'Verify ImagePullSecrets for Private Registries',
          command: 'kubectl get secret -n <namespace>',
          explanation: 'Ensure the secret type is kubernetes.io/dockerconfigjson and is attached in imagePullSecrets.',
        },
        {
          step: 4,
          action: 'Correct Image Reference and Apply',
          command: 'kubectl set image deployment/<name> <container>=<correct-image>:<tag>',
          explanation: 'Update manifest with the verified existing tag and redeploy.',
        },
      ],
      commonMistakes: [
        'Using `:latest` in production and expecting deterministic builds',
        'Forgetting to attach `imagePullSecrets` in private Kubernetes clusters',
        'Typoing repository organization or namespace',
      ],
      proTips: [
        'Use immutable semantic image tags or SHA256 image digests (e.g., `image@sha256:...`) for 100% reproducible deployments.',
      ],
    },
  },
  {
    scenarioId: 'oom-killed',
    name: 'Out of Memory (OOMKilled) with Exit Code 137',
    category: 'Resource Management',
    difficulty: 'Intermediate',
    expectedFailure: 'OOMKilled (exit code 137)',
    description:
      'Container exceeds its configured Kubernetes memory limits (cgroup enforcement), causing the Linux kernel OOM Killer to instantly terminate the container process.',
    concept: {
      whatIsIt:
        'OOMKilled (Exit Code 137 = 128 + SIGKILL 9) occurs when a container exceeds its defined memory limit. The Linux kernel cgroup memory controller terminates the process immediately.',
      whyItHappens: [
        'Configured memory limit is significantly smaller than the application baseline footprint',
        'Memory leak in application runtime (e.g. unclosed connections, large memory caches)',
        'JVM or Node.js heap limits set higher than the container cgroup limit',
        'Sudden spike in payload size or concurrent requests',
      ],
      whenItHappens:
        'Triggered by the Linux OS kernel OOM killer when the container cgroup memory threshold is breached.',
      productionImpact:
        'Instant process termination without graceful shutdown, dropping in-flight user requests and causing recurring pod restarts.',
      troubleshootingPlaybook: [
        {
          step: 1,
          action: 'Verify OOMKilled Termination Status',
          command: 'kubectl describe pod <pod-name> -n <namespace>',
          explanation: 'Check if Last State is Terminated with Reason: OOMKilled and Exit Code: 137.',
        },
        {
          step: 2,
          action: 'Inspect Configured Resource Limits & Requests',
          command: 'kubectl get pod <pod-name> -o jsonpath="{.spec.containers[*].resources}"',
          explanation: 'Compare memory limits (e.g. 64Mi) with actual application requirements.',
        },
        {
          step: 3,
          action: 'Check Node and Pod Memory Metrics',
          command: 'kubectl top pod <pod-name> -n <namespace>',
          explanation: 'Monitor live memory consumption trends before the kill event.',
        },
        {
          step: 4,
          action: 'Adjust Memory Limits and Heap Settings',
          command: 'kubectl apply -f deployment.yaml',
          explanation: 'Increase memory limits to a safe boundary and configure runtime heap flags (e.g., --max-old-space-size).',
        },
      ],
      commonMistakes: [
        'Setting memory limits too low without testing under production load',
        'Assuming exit code 137 is a regular crash rather than a kernel SIGKILL',
        'Not setting memory requests alongside memory limits',
      ],
      proTips: [
        'Set memory requests equal to memory limits for Guaranteed QoS class pods.',
        'Always configure runtime max heap to be ~75% of the container memory limit to leave headroom for non-heap allocations.',
      ],
    },
  },
  {
    scenarioId: 'missing-configmap',
    name: 'CreateContainerConfigError on Missing ConfigMap / Secret',
    category: 'Configuration',
    difficulty: 'Beginner',
    expectedFailure: 'CreateContainerConfigError',
    description:
      'Manifest references a ConfigMap or Secret that does not exist in the namespace, preventing Kubelet from building the container execution context.',
    concept: {
      whatIsIt:
        'CreateContainerConfigError happens when Kubelet attempts to construct the container environment but fails because a referenced ConfigMap or Secret is missing.',
      whyItHappens: [
        'ConfigMap or Secret was never created in the target namespace',
        'Typo in ConfigMap name under `configMapKeyRef` or `configMapRef`',
        'Key name within the ConfigMap does not match `key` in pod spec',
        'ConfigMap deployed to default namespace instead of the application namespace',
      ],
      whenItHappens:
        'Triggered before container startup during the container initialization phase.',
      productionImpact:
        'Pod cannot initialize or transition to Running, blocking deployments completely.',
      troubleshootingPlaybook: [
        {
          step: 1,
          action: 'Inspect Pod Warning Events',
          command: 'kubectl describe pod <pod-name> -n <namespace>',
          explanation: 'Look for "Error: configmap \'xxx\' not found" in describe events.',
        },
        {
          step: 2,
          action: 'List Available ConfigMaps in Namespace',
          command: 'kubectl get configmaps -n <namespace>',
          explanation: 'Check whether the expected ConfigMap exists and compare spelling.',
        },
        {
          step: 3,
          action: 'Create or Rename Missing ConfigMap',
          command: 'kubectl create configmap <cm-name> --from-literal=KEY=VALUE -n <namespace>',
          explanation: 'Create the missing ConfigMap or update the manifest with the correct name.',
        },
      ],
      commonMistakes: [
        'Deploying ConfigMaps in the wrong namespace',
        'Typoing keys inside the ConfigMap data section',
      ],
      proTips: [
        'Use `optional: true` in `configMapKeyRef` if the environment variable is non-mandatory.',
      ],
    },
  },
  {
    scenarioId: 'service-connectivity',
    name: 'Service Selector Label Mismatch & Empty Endpoints',
    category: 'Networking & Ingress',
    difficulty: 'Intermediate',
    expectedFailure: 'Empty Endpoints (HTTP 502 / 503)',
    description:
      'Service selector labels do not match pod metadata labels, causing the Kubernetes Service to discover 0 endpoints and drop network traffic.',
    concept: {
      whatIsIt:
        'A Kubernetes Service routes traffic to Pods by matching `.spec.selector` with `.metadata.labels` on the pods. When they do not match, the Endpoints object is empty.',
      whyItHappens: [
        'Typo in Service `.spec.selector` labels',
        'Pod template `.metadata.labels` updated without updating Service selector',
        'Service targeting wrong port or targetPort',
      ],
      whenItHappens:
        'Occurs immediately upon traffic routing; Clients receive Connection Refused or 503 Bad Gateway.',
      productionImpact:
        'All client requests fail immediately, causing total outage for frontend/API services.',
      troubleshootingPlaybook: [
        {
          step: 1,
          action: 'Check Service Endpoints',
          command: 'kubectl get endpoints <service-name> -n <namespace>',
          explanation: 'If Endpoints shows <none>, the service is not attached to any pods.',
        },
        {
          step: 2,
          action: 'Compare Service Selector and Pod Labels',
          command: 'kubectl get svc <service-name> -o yaml | grep -A 3 selector',
          explanation: 'Check if `app` and `release` labels match `kubectl get pods --show-labels`.',
        },
        {
          step: 3,
          action: 'Align Selector Labels and Verify Endpoints',
          command: 'kubectl apply -f service.yaml',
          explanation: 'Fix label definitions in service YAML and verify endpoints populate.',
        },
      ],
      commonMistakes: [
        'Confusing `targetPort` (pod port) with `port` (service port)',
        'Assuming Service works without checking `kubectl get endpoints`',
      ],
      proTips: [
        'Always use `kubectl get endpoints` as your first diagnostic step for network reachability.',
      ],
    },
  },
  {
    scenarioId: 'ingress-tls-failure',
    name: 'Ingress TLS Secret Missing & Invalid Host Routing',
    category: 'Networking & Ingress',
    difficulty: 'Advanced',
    expectedFailure: 'SSL/TLS Handshake Error & 404 Host Not Found',
    description:
      'Ingress references a missing TLS secret or invalid host routing rule, leading to certificate validation errors and SSL handshake failures.',
    concept: {
      whatIsIt:
        'Kubernetes Ingress routes external HTTPS traffic to internal services using TLS secrets. If secretName does not exist, the ingress controller falls back to a fake default cert.',
      whyItHappens: [
        'TLS Secret not created in the same namespace as the Ingress',
        'Secret name in `spec.tls[*].secretName` is misspelled',
        'Missing DNS host rule matching client request Host header',
      ],
      whenItHappens:
        'When external clients or browsers establish HTTPS connections to the domain.',
      productionImpact:
        'Users receive scary browser SSL warnings (NET::ERR_CERT_AUTHORITY_INVALID) and cannot access the app.',
      troubleshootingPlaybook: [
        {
          step: 1,
          action: 'Inspect Ingress Configuration',
          command: 'kubectl describe ingress <ingress-name> -n <namespace>',
          explanation: 'Check TLS secret references and backend service bindings.',
        },
        {
          step: 2,
          action: 'Verify TLS Secret Exists',
          command: 'kubectl get secret <tls-secret-name> -n <namespace>',
          explanation: 'Ensure secret is of type `kubernetes.io/tls` with `tls.crt` and `tls.key`.',
        },
        {
          step: 3,
          action: 'Create or Bind Valid TLS Certificate',
          command: 'kubectl create secret tls <tls-secret-name> --cert=cert.pem --key=key.pem -n <namespace>',
          explanation: 'Create the TLS secret and reload Ingress controller routing.',
        },
      ],
      commonMistakes: [
        'Creating the TLS Secret in `kube-system` or `default` instead of the Ingress namespace',
        'Not checking Ingress Controller controller logs for SSL handshake errors',
      ],
      proTips: [
        'Use `cert-manager` with Let’s Encrypt ClusterIssuer for automated Kubernetes TLS issuance.',
      ],
    },
  },
];

export const Scenarios = () => {
  const navigate = useNavigate();
  const { projects, loadProjects } = useProjects();

  const [scenariosList, setScenariosList] = useState(DEFAULT_SCENARIOS_CATALOG);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [selectedLearningScenario, setSelectedLearningScenario] = useState(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [scenarioToLaunch, setScenarioToLaunch] = useState(null);

  useEffect(() => {
    loadProjects();
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await scenarioService.getScenarios();
        if (res.data?.scenarios && res.data.scenarios.length > 0) {
          setScenariosList(res.data.scenarios);
        }
      } catch (err) {
        // Fallback to rich catalog defined above
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const getDifficultyBadgeClass = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Advanced':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getScenarioIcon = (scenarioId) => {
    switch (scenarioId) {
      case 'crash-loop-backoff':
        return <Bomb className="w-5 h-5 text-rose-400" />;
      case 'image-pull-backoff':
        return <StopCircle className="w-5 h-5 text-amber-400" />;
      case 'oom-killed':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'missing-configmap':
        return <FileText className="w-5 h-5 text-yellow-400" />;
      case 'service-connectivity':
        return <WifiOff className="w-5 h-5 text-blue-400" />;
      case 'ingress-tls-failure':
        return <Lock className="w-5 h-5 text-purple-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-cyan-400" />;
    }
  };

  const categories = ['All', 'Crash & Lifecycle', 'Resource Management', 'Networking & Ingress', 'Configuration'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredScenarios = scenariosList.filter((sc) => {
    const matchesSearch =
      sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sc.expectedFailure && sc.expectedFailure.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty = selectedDifficulty === 'All' || sc.difficulty === selectedDifficulty;
    const matchesCategory = selectedCategory === 'All' || sc.category === selectedCategory;

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const handleOpenLaunchModal = (sc) => {
    setScenarioToLaunch(sc);
    setIsLaunchModalOpen(true);
  };

  const handleSelectProjectForScenario = (projectId) => {
    setIsLaunchModalOpen(false);
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="space-y-8">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold">
            <GraduationCap className="w-4 h-4" /> KubeMentor DevOps Learning Labs & Simulation
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Learn Kubernetes Failures by Diagnosing & Fixing Them Live
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Inspired by hands-on labs like Katacoda & Escbash. Master why and when errors like{' '}
            <span className="font-mono text-cyan-300">CrashLoopBackOff</span>,{' '}
            <span className="font-mono text-amber-300">ImagePullBackOff</span>, and{' '}
            <span className="font-mono text-rose-300">OOMKilled</span> occur, study step-by-step diagnostic playbooks, and simulate solutions with AI Mentor assistance.
          </p>
        </div>

        {/* Feature Highlights Pill Bar */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 mt-6">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>6 Masterclass Scenarios</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Copyable CLI Playbooks</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>AI Guided Explanations</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Safe Sandbox Isolation</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scenarios by error, topic, or keyword (e.g. CrashLoop, OOM, Ingress)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Difficulty:
            </span>
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                  selectedDifficulty === diff
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-xs font-mono text-slate-400 mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SCENARIOS GRID */}
      {loading ? (
        <LoadingSpinner label="Loading failure scenario catalog..." size="lg" />
      ) : filteredScenarios.length === 0 ? (
        <Card className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-100">No Scenarios Match Your Filters</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Try adjusting your search keywords or resetting difficulty and category filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedDifficulty('All');
              setSelectedCategory('All');
            }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((sc) => (
            <Card
              key={sc.scenarioId}
              className="flex flex-col justify-between hover:border-slate-700 transition-all group bg-slate-950/60"
            >
              <div className="space-y-4">
                {/* Header tags */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getDifficultyBadgeClass(
                      sc.difficulty
                    )}`}
                  >
                    {sc.difficulty}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                    {sc.category}
                  </span>
                </div>

                {/* Scenario Title & Icon */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 group-hover:border-indigo-500/40 transition-colors">
                      {getScenarioIcon(sc.scenarioId)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug">
                        {sc.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{sc.description}</p>
                </div>

                {/* Expected Failure State */}
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Target Failure Condition</span>
                  <span className="font-mono font-bold text-amber-300">{sc.expectedFailure}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs font-semibold"
                  onClick={() => setSelectedLearningScenario(sc)}
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Learn Concept
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500"
                  onClick={() => handleOpenLaunchModal(sc)}
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Launch Lab
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* EDUCATIONAL CONCEPT MASTERCLASS & PLAYBOOK MODAL */}
      <Modal
        isOpen={!!selectedLearningScenario}
        onClose={() => setSelectedLearningScenario(null)}
        title={
          selectedLearningScenario
            ? `Failure Concept Masterclass: ${selectedLearningScenario.name}`
            : 'DevOps Learning Guide'
        }
      >
        {selectedLearningScenario && (
          <div className="max-h-[75vh] overflow-y-auto pr-1 space-y-4">
            <ScenarioLearningGuide scenario={selectedLearningScenario} />
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setSelectedLearningScenario(null)}>
                Close Masterclass
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const sc = selectedLearningScenario;
                  setSelectedLearningScenario(null);
                  handleOpenLaunchModal(sc);
                }}
                className="bg-indigo-600 hover:bg-indigo-500"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Launch Live Simulation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* LAUNCH SCENARIO IN PROJECT WORKSPACE MODAL */}
      <Modal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        title={`Launch Scenario: ${scenarioToLaunch?.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Select a project workspace to deploy your manifests and run the{' '}
            <strong className="text-amber-300 font-mono">{scenarioToLaunch?.expectedFailure}</strong> simulation lab.
          </p>

          {projects.length === 0 ? (
            <div className="p-6 bg-slate-950 rounded-xl border border-dashed border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-400">You do not have any projects created yet.</p>
              <Link to="/projects">
                <Button variant="primary" size="sm">
                  <FolderPlus className="w-4 h-4" /> Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {projects.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => handleSelectProjectForScenario(proj._id)}
                  className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {proj.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{proj.description || 'No description'}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsLaunchModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Scenarios;
