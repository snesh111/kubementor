import FailureScenario from '../models/FailureScenario.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import { validateScenarioStartRequest } from './scenarioValidator.js';
import scenarioEngine from './scenarioEngine.js';
import { ApiError } from '../middleware/errorMiddleware.js';

const SEED_SCENARIOS = [
  {
    scenarioId: 'crash-loop-backoff',
    name: 'CrashLoopBackOff',
    description: 'Container repeatedly exits with non-zero status upon starting.',
    category: 'Reliability',
    difficulty: 'Beginner',
    objective: 'Investigate container entrypoint/command configuration and fix startup exit failures.',
    expectedFailure: 'CrashLoopBackOff',
    supportedResourceKinds: ['Deployment'],
    enabled: true,
    injectionType: 'container-command',
    concept: {
      whatIsIt: 'CrashLoopBackOff is a Kubernetes pod state indicating that a container in the pod repeatedly starts, crashes/fails, and restarts. Kubernetes adds an increasing exponential back-off delay (10s, 20s, 40s, up to 5 minutes) between consecutive restarts to protect node resources from process thrashing.',
      whyItHappens: [
        'Application startup error (uncaught exception, missing configuration/environment variable, syntax error)',
        'Port collision or binding failure (the port requested by the app is already in use)',
        'Missing or invalid entrypoint/command (e.g. executing a short-lived script command instead of a daemon)',
        'Dependency unavailability (failing to connect to an external database or cache on boot)'
      ],
      whenItHappens: 'Triggered by Kubelet when a container process terminates with a non-zero exit code (e.g. exit code 1 or 137) or dies immediately after launch, and the Pod restartPolicy is set to Always or OnFailure.',
      productionImpact: 'High Severity. The pod never enters Ready state, traffic cannot be routed to it, and users experience HTTP 502/503 errors or complete downtime if all replicas crash.',
      troubleshootingPlaybook: [
        {
          stepNumber: 1,
          title: 'Check Pod Status & Restart Count',
          description: 'Inspect pod state, restart counter, and exit reason.',
          command: 'kubectl get pods -n <namespace>'
        },
        {
          stepNumber: 2,
          title: 'Inspect Pod Warning Events',
          description: 'View Kubelet lifecycle events showing back-off restarting triggers.',
          command: 'kubectl describe pod <pod-name> -n <namespace>'
        },
        {
          stepNumber: 3,
          title: 'Check Container Crash Logs',
          description: 'Read stderr logs from the failed container instance before restart wiped the buffer.',
          command: 'kubectl logs <pod-name> --previous -n <namespace>'
        },
        {
          stepNumber: 4,
          title: 'Audit Container Command & Spec in YAML',
          description: 'Verify container.command, container.args, and environment variables in the deployment manifest.'
        }
      ],
      commonMistakes: [
        'Using a batch command (like echo hello or exit 1) in a Deployment spec, which finishes instantly and causes K8s to restart it forever.',
        'Forgetting to configure a required database connection string or environment variable before launching.'
      ],
      proTips: [
        'Always use kubectl logs --previous to view the exact uncaught error that caused the container to terminate.',
        'Ensure your container process runs in the foreground (PID 1) and listens on the expected port.'
      ]
    }
  },
  {
    scenarioId: 'image-pull-backoff',
    name: 'ImagePullBackOff',
    description: 'Container image registry download fails due to invalid image tag.',
    category: 'Reliability',
    difficulty: 'Beginner',
    objective: 'Inspect pod events, identify invalid image tag, and restore correct container image.',
    expectedFailure: 'ImagePullBackOff',
    supportedResourceKinds: ['Deployment'],
    enabled: true,
    injectionType: 'container-image',
    concept: {
      whatIsIt: 'ImagePullBackOff means Kubernetes cannot download the container image specified in your pod manifest from the container registry (e.g. Docker Hub, ECR, GCR, Quay). Kubelet retries pulling with an exponential back-off delay.',
      whyItHappens: [
        'Image tag typo or non-existent image name (e.g. nginx:1.999.0 instead of nginx:1.25.3)',
        'Private registry authentication failure (missing or invalid imagePullSecrets in pod spec)',
        'Network or DNS resolution issue reaching the external container registry',
        'Rate limiting from Docker Hub (anonymous IP pull limits)'
      ],
      whenItHappens: 'Triggered during pod scheduling and creation before the container even starts. Kubelet fails to fetch the image layers.',
      productionImpact: 'Critical. Pod remains stuck in Waiting state with ErrImagePull / ImagePullBackOff and never executes.',
      troubleshootingPlaybook: [
        {
          stepNumber: 1,
          title: 'Inspect Pod Events for Pull Errors',
          description: 'Check Kubelet events for exact registry error messages (404 Not Found, 401 Unauthorized, or manifest unknown).',
          command: 'kubectl describe pod <pod-name> -n <namespace>'
        },
        {
          stepNumber: 2,
          title: 'Verify Image Name & Tag',
          description: 'Check image spelling and verify the tag exists on the container registry.',
          command: 'docker pull <image>:<tag>'
        },
        {
          stepNumber: 3,
          title: 'Configure imagePullSecrets if Private',
          description: 'Ensure docker-registry secret is created in the namespace and referenced in spec.imagePullSecrets.'
        },
        {
          stepNumber: 4,
          title: 'Apply Corrected Manifest',
          description: 'Update image tag in deployment.yaml to a valid verified version (e.g. nginx:1.25.3).'
        }
      ],
      commonMistakes: [
        'Assuming :latest tag always exists on custom internal registry images.',
        'Typing repository or tag names with incorrect uppercase/lowercase characters.'
      ],
      proTips: [
        'Pin explicit immutable semantic version tags (e.g. nginx:1.25.3) or SHA digests in production to ensure reproducible deployments.'
      ]
    }
  },
  {
    scenarioId: 'oom-killed',
    name: 'OOMKilled',
    description: 'Container process is terminated by Linux kernel due to memory limit exhaustion.',
    category: 'Performance',
    difficulty: 'Intermediate',
    objective: 'Detect memory limit bottleneck and re-configure adequate container memory limits.',
    expectedFailure: 'OOMKilled',
    supportedResourceKinds: ['Deployment'],
    enabled: true,
    injectionType: 'memory-limit',
    concept: {
      whatIsIt: 'OOMKilled (Out Of Memory Killed, exit code 137) occurs when a container attempts to allocate more RAM than the memory limit configured in its resources.limits.memory specification, causing the Linux kernel Out-Of-Memory Killer (oom_killer) to immediately terminate the process.',
      whyItHappens: [
        'Memory limit set unrealistically low (e.g. 16Mi for a NodeJS/Java app that requires at least 256Mi to boot)',
        'Application memory leak (unbounded heap growth, cache without TTL eviction, unclosed connections)',
        'Sudden traffic spike or large in-memory batch payload processing'
      ],
      whenItHappens: 'Enforced by the Linux cgroups memory controller when process RSS + page cache exceeds cgroup.memory.max.',
      productionImpact: 'Intermittent crashes and dropped active user requests mid-execution without graceful shutdown.',
      troubleshootingPlaybook: [
        {
          stepNumber: 1,
          title: 'Verify OOMKilled Termination Reason',
          description: 'Check pod last termination state for Exit Code 137 and OOMKilled flag.',
          command: 'kubectl describe pod <pod-name> -n <namespace>'
        },
        {
          stepNumber: 2,
          title: 'Inspect Resource Usage Metrics',
          description: 'View current CPU and RAM consumption per pod.',
          command: 'kubectl top pod <pod-name> -n <namespace>'
        },
        {
          stepNumber: 3,
          title: 'Re-evaluate resources.limits.memory',
          description: 'Check spec.containers[0].resources.limits.memory in the deployment manifest.'
        },
        {
          stepNumber: 4,
          title: 'Configure Adequate Memory Limit',
          description: 'Increase memory limit to 256Mi or 512Mi with realistic headroom.'
        }
      ],
      commonMistakes: [
        'Setting memory limits without setting requests, leading to poor node scheduling placement.',
        'Not configuring JVM heap limits (-Xmx) inside Java containers, allowing JVM to exceed cgroup limits.'
      ],
      proTips: [
        'Set requests.memory to expected steady-state usage and limits.memory with a 20-30% buffer for burst traffic.'
      ]
    }
  },
  {
    scenarioId: 'missing-configmap',
    name: 'Missing ConfigMap',
    description: 'Application container fails to initialize because required ConfigMap dependency is missing.',
    category: 'Reliability',
    difficulty: 'Intermediate',
    objective: 'Examine pod events/errors, identify missing ConfigMap, and restore configuration.',
    expectedFailure: 'CreateContainerConfigError',
    supportedResourceKinds: ['Deployment', 'ConfigMap'],
    enabled: true,
    injectionType: 'configmap-dependency',
    concept: {
      whatIsIt: 'CreateContainerConfigError occurs when a Pod spec references a ConfigMap (via envFrom, configMapKeyRef, or volumes.configMap) that does not exist in the same namespace, or is missing the specified key.',
      whyItHappens: [
        'ConfigMap was never created or was deployed into a different namespace',
        'Typo in configMapKeyRef.name or configMap.name in the Deployment spec',
        'Key name referenced inside container environment does not match the key inside the ConfigMap data'
      ],
      whenItHappens: 'Triggered during pod initialization before the container runtime launches.',
      productionImpact: 'Pod remains stuck in Waiting state with CreateContainerConfigError and cannot serve traffic.',
      troubleshootingPlaybook: [
        {
          stepNumber: 1,
          title: 'Inspect Pod Warning Events',
          description: 'Check describe output for configmap "<name>" not found messages.',
          command: 'kubectl describe pod <pod-name> -n <namespace>'
        },
        {
          stepNumber: 2,
          title: 'List ConfigMaps in Namespace',
          description: 'Verify if the ConfigMap exists in the target namespace.',
          command: 'kubectl get configmap -n <namespace>'
        },
        {
          stepNumber: 3,
          title: 'Compare Key Names & ConfigMap References',
          description: 'Check env[].valueFrom.configMapKeyRef in Deployment vs data in ConfigMap.'
        },
        {
          stepNumber: 4,
          title: 'Deploy Missing ConfigMap or Fix Reference',
          description: 'Apply the missing ConfigMap YAML or correct the name in deployment.yaml.'
        }
      ],
      commonMistakes: [
        'Deploying Deployment YAML before ConfigMap YAML in CI/CD pipelines without handling dependencies.'
      ],
      proTips: [
        'Use optional: true in configMapKeyRef if the configuration key is not strictly required for application boot.'
      ]
    }
  },
  {
    scenarioId: 'service-connectivity',
    name: 'Service Connectivity Failure',
    description: 'Service exists in namespace but routes zero traffic due to selector mismatch.',
    category: 'Reliability',
    difficulty: 'Intermediate',
    objective: 'Inspect Service selector vs Pod labels and align label selectors.',
    expectedFailure: 'NoMatchingEndpoints',
    supportedResourceKinds: ['Deployment', 'Service'],
    enabled: true,
    injectionType: 'service-selector',
    concept: {
      whatIsIt: 'Service Connectivity Failure occurs when a Kubernetes Service exists and has a ClusterIP, but routes zero network traffic because its label selector does not match any running Pod labels, resulting in 0 Endpoints.',
      whyItHappens: [
        'Label selector mismatch (e.g. Service has selector.app: web-service while Pod has labels.app: web-app)',
        'Port mapping mismatch (Service targetPort does not match container actual listening containerPort)',
        'Pods are in CrashLoopBackOff or Unready state, so Kubernetes removes them from the Endpoints list'
      ],
      whenItHappens: 'Detected when other pods, services, or ingress attempt to reach the Service DNS name and receive connection refused or timeouts.',
      productionImpact: 'Complete network routing failure; application is running but completely unreachable from outside or microservices.',
      troubleshootingPlaybook: [
        {
          stepNumber: 1,
          title: 'Check Service Endpoints',
          description: 'Verify if Endpoints are populated or showing <none>.',
          command: 'kubectl get endpoints <service-name> -n <namespace>'
        },
        {
          stepNumber: 2,
          title: 'Compare Service Selector vs Pod Labels',
          description: 'Inspect spec.selector in service.yaml vs spec.template.metadata.labels in deployment.yaml.',
          command: 'kubectl get pods --show-labels -n <namespace>'
        },
        {
          stepNumber: 3,
          title: 'Verify Port & TargetPort Alignment',
          description: 'Check service.spec.ports[0].targetPort matches container.ports[0].containerPort.'
        },
        {
          stepNumber: 4,
          title: 'Align Selectors & Re-apply',
          description: 'Update service.spec.selector in service.yaml to match the Pod label app: web-app.'
        }
      ],
      commonMistakes: [
        'Assuming Service name routes to Pods automatically; Kubernetes routes strictly by label selectors, not names.'
      ],
      proTips: [
        'Always run kubectl get endpoints <service-name> — if ENDPOINTS is <none>, check your selectors immediately!'
      ]
    }
  },
  {
    scenarioId: 'ingress-tls-failure',
    name: 'Ingress/TLS Failure',
    description: 'Ingress layer fails TLS termination due to missing or misconfigured TLS Secret.',
    category: 'Security',
    difficulty: 'Advanced',
    objective: 'Audit Ingress TLS configuration and correct secretName references.',
    expectedFailure: 'TLSSecretNotFound',
    supportedResourceKinds: ['Ingress', 'Secret'],
    enabled: true,
    injectionType: 'ingress-tls-secret',
    concept: {
      whatIsIt: 'Ingress/TLS Failure happens when an Ingress resource is configured with TLS termination (spec.tls), but the referenced secretName containing the SSL certificate (tls.crt and tls.key) is missing, expired, or invalid in the namespace.',
      whyItHappens: [
        'Referenced TLS Secret does not exist in the Ingress namespace',
        'Secret exists but is generic type instead of kubernetes.io/tls or is missing tls.key / tls.crt data keys',
        'Host domain in Ingress rule does not match the hostname in spec.tls.hosts'
      ],
      whenItHappens: 'When the Ingress Controller (like NGINX Ingress or Traefik) attempts to load the SSL certificate for incoming HTTPS requests.',
      productionImpact: 'Browser SSL certificate warnings (NET::ERR_CERT_COMMON_NAME_INVALID, 503 Service Unavailable, or connection reset).',
      troubleshootingPlaybook: [
        {
          stepNumber: 1,
          title: 'Inspect Ingress Status & Events',
          description: 'Check Ingress events for TLS Secret synchronization errors.',
          command: 'kubectl describe ingress <ingress-name> -n <namespace>'
        },
        {
          stepNumber: 2,
          title: 'Verify TLS Secret Exists',
          description: 'Check if the secretName referenced in spec.tls exists in the namespace.',
          command: 'kubectl get secret <secret-name> -n <namespace>'
        },
        {
          stepNumber: 3,
          title: 'Check Secret Type & Data Keys',
          description: 'Ensure Secret type is kubernetes.io/tls with valid tls.crt and tls.key.'
        },
        {
          stepNumber: 4,
          title: 'Align Ingress secretName & Re-apply',
          description: 'Update ingress.spec.tls[0].secretName to reference the valid TLS Secret.'
        }
      ],
      commonMistakes: [
        'Creating a TLS Secret in default namespace and trying to reference it from an Ingress in another namespace (Secrets cannot cross namespace boundaries).'
      ],
      proTips: [
        'Use Cert-Manager with Let\'s Encrypt cluster issuers to automate TLS Secret creation and rotation in Kubernetes.'
      ]
    }
  },
];

export const scenarioService = {
  /**
   * Seed default scenarios into DB and sync updated concept curricula
   */
  seedDefaultScenarios: async () => {
    for (const sc of SEED_SCENARIOS) {
      await FailureScenario.updateOne({ scenarioId: sc.scenarioId }, { $set: sc }, { upsert: true });
    }
  },

  /**
   * Get all available scenarios
   */
  getScenarios: async () => {
    await scenarioService.seedDefaultScenarios();
    const scenarios = await FailureScenario.find({ enabled: true }).sort({ difficulty: 1 });
    return scenarios.map((s) => s.toResponseObject());
  },

  /**
   * Get single scenario by ID
   */
  getScenarioById: async (scenarioId) => {
    await scenarioService.seedDefaultScenarios();
    const scenario = await FailureScenario.findOne({ scenarioId, enabled: true });
    if (!scenario) {
      throw new ApiError(`Scenario '${scenarioId}' not found`, 404);
    }
    return scenario.toResponseObject();
  },

  /**
   * Start scenario simulation
   */
  startScenario: async (projectId, scenarioId, deploymentId, userId) => {
    await scenarioService.seedDefaultScenarios();

    const scenarioDoc = await FailureScenario.findOne({ scenarioId, enabled: true });
    if (!scenarioDoc) {
      throw new ApiError(`Scenario '${scenarioId}' not found`, 404);
    }

    const { project, deployment } = await validateScenarioStartRequest(projectId, scenarioId, deploymentId, userId);

    return await scenarioEngine.startScenario(project, deployment, scenarioDoc, userId);
  },

  /**
   * Get user's scenario attempts for project
   */
  getScenarioAttempts: async (projectId, userId) => {
    const attempts = await ScenarioAttempt.find({ project: projectId, user: userId })
      .sort({ createdAt: -1 });
    return attempts.map((a) => a.toResponseObject());
  },

  /**
   * Get single scenario attempt by ID
   */
  getScenarioAttemptById: async (projectId, attemptId, userId) => {
    const attempt = await ScenarioAttempt.findOne({ _id: attemptId, project: projectId, user: userId });
    if (!attempt) {
      throw new ApiError('Scenario attempt not found or not accessible', 404);
    }
    return attempt.toResponseObject();
  },

  /**
   * Cancel active scenario attempt and restore K8s config
   */
  cancelScenarioAttempt: async (projectId, attemptId, userId) => {
    return await scenarioEngine.cancelScenario(attemptId, projectId, userId);
  },
};

export default scenarioService;
