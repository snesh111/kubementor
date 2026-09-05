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
  },
];

export const scenarioService = {
  /**
   * Seed 6 default scenarios into DB if not present
   */
  seedDefaultScenarios: async () => {
    for (const sc of SEED_SCENARIOS) {
      await FailureScenario.updateOne({ scenarioId: sc.scenarioId }, { $setOnInsert: sc }, { upsert: true });
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
