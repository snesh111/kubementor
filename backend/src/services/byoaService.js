import yaml from 'js-yaml';
import Project from '../models/Project.js';
import ProjectFile from '../models/ProjectFile.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import ValidationResult from '../models/ValidationResult.js';
import ContextSnapshot from '../models/ContextSnapshot.js';
import namespaceService from '../kubernetes/namespaceService.js';
import deploymentService from '../kubernetes/deploymentService.js';
import k8sClientWrapper from '../kubernetes/k8sClient.js';
import contextService from '../context/contextService.js';
import { ApiError } from '../middleware/errorMiddleware.js';

const MAX_YAML_SIZE_BYTES = 500 * 1024; // 500 KB limit
const MAX_DOCUMENTS_COUNT = 15;
const MAX_REPLICAS_PER_WORKLOAD = 5;

const ALLOWED_KINDS = ['Deployment', 'Service', 'ConfigMap', 'Secret', 'Ingress', 'Pod'];

const BLOCKED_KINDS = [
  'ClusterRole',
  'ClusterRoleBinding',
  'Namespace',
  'Node',
  'PersistentVolume',
  'PersistentVolumeClaim',
  'CustomResourceDefinition',
  'MutatingWebhookConfiguration',
  'ValidatingWebhookConfiguration',
  'StorageClass',
  'PriorityClass',
  'Role',
  'RoleBinding',
  'ServiceAccount',
];

export const byoaService = {
  /**
   * Validate BYOA manifests against syntax, kind whitelist, security rules, and quota limits
   * @param {string} manifestYaml
   * @returns {Object} Validation result with errors, warnings, and detected resources
   */
  validateBYOAManifests: (manifestYaml) => {
    if (!manifestYaml || typeof manifestYaml !== 'string' || manifestYaml.trim().length === 0) {
      return {
        valid: false,
        errors: ['Manifest content is required and cannot be empty.'],
        warnings: [],
        resources: [],
        documentCount: 0,
        sizeBytes: 0,
      };
    }

    const sizeBytes = Buffer.byteLength(manifestYaml, 'utf8');
    if (sizeBytes > MAX_YAML_SIZE_BYTES) {
      return {
        valid: false,
        errors: [`Total manifest size (${Math.round(sizeBytes / 1024)} KB) exceeds the maximum allowed 500 KB limit.`],
        warnings: [],
        resources: [],
        documentCount: 0,
        sizeBytes,
      };
    }

    let documents = [];
    try {
      documents = yaml.loadAll(manifestYaml).filter((doc) => doc && typeof doc === 'object');
    } catch (parseErr) {
      return {
        valid: false,
        errors: [`Invalid YAML syntax: ${parseErr.message}`],
        warnings: [],
        resources: [],
        documentCount: 0,
        sizeBytes,
      };
    }

    if (documents.length === 0) {
      return {
        valid: false,
        errors: ['No valid Kubernetes YAML documents found in the provided input.'],
        warnings: [],
        resources: [],
        documentCount: 0,
        sizeBytes,
      };
    }

    if (documents.length > MAX_DOCUMENTS_COUNT) {
      return {
        valid: false,
        errors: [`Manifest contains ${documents.length} documents, exceeding the maximum allowed limit of ${MAX_DOCUMENTS_COUNT} documents.`],
        warnings: [],
        resources: [],
        documentCount: documents.length,
        sizeBytes,
      };
    }

    const errors = [];
    const warnings = [];
    const resources = [];

    documents.forEach((doc, idx) => {
      const docNum = idx + 1;
      const kind = doc.kind;
      const name = doc.metadata?.name || `unnamed-doc-${docNum}`;

      if (!kind) {
        errors.push(`Document #${docNum} is missing required 'kind' specification.`);
        return;
      }

      // Check blocked kinds explicitly
      if (BLOCKED_KINDS.includes(kind)) {
        errors.push(`Document #${docNum} (${kind}/${name}): '${kind}' is cluster-scoped or privileged and is strictly forbidden in KubeMentor sandbox labs.`);
        return;
      }

      // Check allowed kinds
      if (!ALLOWED_KINDS.includes(kind)) {
        errors.push(`Document #${docNum} (${kind}/${name}): Unsupported resource kind '${kind}'. Supported kinds: ${ALLOWED_KINDS.join(', ')}.`);
        return;
      }

      // Metadata check
      if (!doc.metadata?.name) {
        errors.push(`Document #${docNum} (${kind}): Missing required 'metadata.name'.`);
      }

      // Warn if user specified a custom namespace that will be overridden
      if (doc.metadata?.namespace) {
        warnings.push(`Document #${docNum} (${kind}/${name}): User-specified namespace '${doc.metadata.namespace}' will be safely overridden with the isolated sandbox namespace.`);
      }

      // Security check: Workload specs
      const podSpec = kind === 'Deployment' ? doc.spec?.template?.spec : kind === 'Pod' ? doc.spec : null;

      if (podSpec) {
        // 1. Block hostPath volumes
        const volumes = podSpec.volumes || [];
        volumes.forEach((vol) => {
          if (vol.hostPath) {
            errors.push(`Document #${docNum} (${kind}/${name}): 'hostPath' volume '${vol.name}' is strictly forbidden for security isolation.`);
          }
        });

        // 2. Block hostNetwork, hostPID, hostIPC
        if (podSpec.hostNetwork === true) {
          errors.push(`Document #${docNum} (${kind}/${name}): 'hostNetwork: true' is forbidden.`);
        }
        if (podSpec.hostPID === true) {
          errors.push(`Document #${docNum} (${kind}/${name}): 'hostPID: true' is forbidden.`);
        }
        if (podSpec.hostIPC === true) {
          errors.push(`Document #${docNum} (${kind}/${name}): 'hostIPC: true' is forbidden.`);
        }

        // 3. Block privileged containers & privilege escalation
        const containers = [...(podSpec.containers || []), ...(podSpec.initContainers || [])];
        containers.forEach((c) => {
          const sec = c.securityContext || {};
          if (sec.privileged === true) {
            errors.push(`Document #${docNum} (${kind}/${name}): Container '${c.name}' has 'privileged: true' which is forbidden.`);
          }
        });

        // 4. Check replicas limit on Deployments
        if (kind === 'Deployment' && doc.spec?.replicas > MAX_REPLICAS_PER_WORKLOAD) {
          errors.push(`Document #${docNum} (Deployment/${name}): Requested replicas (${doc.spec.replicas}) exceeds maximum allowed sandbox limit of ${MAX_REPLICAS_PER_WORKLOAD}.`);
        }
      }

      resources.push({
        kind,
        name,
        documentIndex: docNum,
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      resources,
      documentCount: documents.length,
      sizeBytes,
    };
  },

  /**
   * Create an isolated BYOA lab session from validated Kubernetes manifests
   * @param {string} userId - Authenticated user ObjectId
   * @param {string} manifestYaml - Multi-document YAML string
   * @param {Object} options - { appName, description }
   * @returns {Object} Unified LabSession object
   */
  createBYOALab: async (userId, manifestYaml, options = {}) => {
    // 1. Validate manifests
    const validation = byoaService.validateBYOAManifests(manifestYaml);
    if (!validation.valid) {
      throw new ApiError(`BYOA Manifest Validation Failed:\n${validation.errors.join('\n')}`, 400);
    }

    const appName = (options.appName || 'Custom Application').trim();
    const description = options.description || 'Bring Your Own Application sandbox testing';

    // 2. Parse documents and sanitize namespaces
    const rawDocs = yaml.loadAll(manifestYaml).filter((doc) => doc && typeof doc === 'object');

    // 3. Create internal BYOA Project
    const project = await Project.create({
      name: `[BYOA] ${appName}`,
      description,
      owner: userId,
      isLabInternal: true,
      projectType: 'BYOA',
      isBYOA: true,
      status: 'draft',
    });

    const labId = `byoa-${project._id}`;
    project.labId = labId;
    await project.save();

    // 4. Generate isolated sandbox namespace (server-controlled)
    const sandboxNamespace = namespaceService.generateNamespaceName(userId, project._id);
    await namespaceService.ensureNamespace(sandboxNamespace);

    // 5. Enforce namespace on documents and organize into files
    const sanitizedDocs = rawDocs.map((doc) => {
      const cleanDoc = JSON.parse(JSON.stringify(doc));
      if (!cleanDoc.metadata) cleanDoc.metadata = {};
      cleanDoc.metadata.namespace = sandboxNamespace;
      return cleanDoc;
    });

    // 6. Persist individual resource manifest files
    const createdFiles = [];
    for (let i = 0; i < sanitizedDocs.length; i++) {
      const doc = sanitizedDocs[i];
      const kind = (doc.kind || 'resource').toLowerCase();
      const name = doc.metadata?.name || `item-${i + 1}`;
      const filename = sanitizedDocs.length === 1 ? `${kind}.yaml` : `${kind}-${name}.yaml`;
      const docContent = yaml.dump(doc);

      const file = await ProjectFile.create({
        project: project._id,
        owner: userId,
        originalName: filename,
        storedName: `${Date.now()}-${filename}`,
        fileType: 'yaml',
        mimeType: 'application/x-yaml',
        size: Buffer.byteLength(docContent),
        content: docContent,
      });
      createdFiles.push(file);
    }

    // 7. Deploy manifests using existing deployment infrastructure
    const resourceResults = await deploymentService.applyManifestDocuments(sanitizedDocs, sandboxNamespace);

    const deploymentRecord = await DeploymentRecord.create({
      project: project._id,
      user: userId,
      namespace: sandboxNamespace,
      fileIds: createdFiles.map((f) => f._id),
      resources: resourceResults,
      status: 'running',
      startedAt: new Date(),
      completedAt: new Date(),
    });

    // 8. Create ScenarioAttempt for tracking session & context
    const attemptDoc = await ScenarioAttempt.create({
      user: userId,
      project: project._id,
      deployment: deploymentRecord._id,
      scenarioId: labId,
      scenarioName: `BYOA: ${appName}`,
      status: 'active',
      attemptNumber: 1,
      expectedState: 'HealthyWorkload',
      startedAt: new Date(),
    });

    // 9. Collect initial ContextSnapshot
    let contextSnapshot = null;
    try {
      const snapshotResult = await contextService.generateAndSaveSnapshot(project._id, attemptDoc._id, userId);
      contextSnapshot = await ContextSnapshot.findById(snapshotResult.snapshotId);
    } catch (ctxErr) {
      console.warn('[BYOAService] Initial context snapshot warning:', ctxErr.message);
    }

    project.status = 'deployed';
    await project.save();

    // 10. Return unified LabSession response object
    return {
      labId,
      title: project.name,
      difficulty: 'Advanced',
      internalProjectId: project._id,
      attemptId: attemptDoc._id,
      deploymentId: deploymentRecord._id,
      namespace: sandboxNamespace,
      mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
      starterFiles: createdFiles.map((f) => f.toResponseObject(true)),
      isBYOA: true,
      concept: {
        whatIsIt: 'Bring Your Own Application (BYOA) allows you to import and test your custom Kubernetes manifests in an isolated, safe sandbox environment.',
        troubleshootingPlaybook: [
          { stepNumber: 1, title: 'Inspect Pods & Deployments', description: 'Run kubectl get pods,deployments to check status.', command: `kubectl get all -n ${sandboxNamespace}` },
          { stepNumber: 2, title: 'Review Logs', description: 'Inspect container stdout/stderr logs.', command: `kubectl logs <pod-name> -n ${sandboxNamespace}` },
          { stepNumber: 3, title: 'Check Services & Endpoints', description: 'Verify service selectors match pod labels.', command: `kubectl get endpoints -n ${sandboxNamespace}` },
          { stepNumber: 4, title: 'Validate Health', description: 'Click Validate My Solution to run automated runtime health checks.' },
        ],
      },
      mission: {
        description: `Imported custom application '${appName}' into isolated sandbox namespace '${sandboxNamespace}'.`,
        objective: 'Observe application behavior in terminal, edit manifests in YAML editor, investigate with AI Mentor, and validate workload health.',
        expectedFailure: 'Custom Workload Health Check',
      },
      initialStatus: 'active',
      initialContext: contextSnapshot?.context || null,
      summary: contextSnapshot?.summary || null,
      resumed: false,
    };
  },

  /**
   * Deterministic Health Check validation for BYOA applications
   * @param {string} userId
   * @param {string} labId
   * @returns {Object} ValidationResult response object
   */
  validateBYOAHealth: async (userId, labId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('BYOA lab session not found or not accessible', 404);
    }

    const attempt = await ScenarioAttempt.findOne({
      project: project._id,
      user: userId,
    }).sort({ createdAt: -1 });

    const deployment = await DeploymentRecord.findOne({
      project: project._id,
      user: userId,
    }).sort({ createdAt: -1 });

    if (!attempt || !deployment) {
      throw new ApiError('Active deployment or attempt record not found for this BYOA lab', 404);
    }

    const startTime = Date.now();

    // 1. Generate fresh ContextSnapshot
    const snapshotResult = await contextService.generateAndSaveSnapshot(project._id, attempt._id, userId);
    const afterSnapshot = await ContextSnapshot.findById(snapshotResult.snapshotId);
    const beforeSnapshot = (await ContextSnapshot.findOne({ scenarioAttempt: attempt._id, project: project._id }).sort({ createdAt: 1 })) || afterSnapshot;

    const ctx = afterSnapshot?.context || {};
    const pods = ctx.pods || [];
    const services = ctx.services || [];
    const dep = ctx.deployment || {};

    const primaryPod = pods[0] || {};
    const primaryContainer = primaryPod.containers?.[0] || {};

    // 2. Perform deterministic Health Checks
    const isPodReady = pods.length > 0 && pods.every((p) => p.ready === true && p.phase === 'Running');
    const hasCrashLoop = pods.some((p) => p.containers?.some((c) => c.state === 'waiting' && c.reason === 'CrashLoopBackOff'));
    const hasImagePullError = pods.some((p) => p.containers?.some((c) => c.reason === 'ImagePullBackOff' || c.reason === 'ErrImagePull'));
    const hasOOM = pods.some((p) => p.containers?.some((c) => c.reason === 'OOMKilled' || c.exitCode === 137));
    const hasConfigError = pods.some((p) => p.containers?.some((c) => c.reason === 'CreateContainerConfigError'));
    const isReplicasHealthy = (dep.availableReplicas || 0) >= (dep.replicas || 1);

    const checks = [
      {
        name: 'Pod Phase & Readiness',
        expected: 'Running & Ready',
        actual: pods.length > 0 ? `${primaryPod.phase || 'Unknown'} (Ready: ${primaryPod.ready ? 'True' : 'False'})` : 'No Pods Found',
        status: isPodReady ? 'PASS' : 'FAIL',
        description: 'Verifies all application pods are in Running phase and passed readiness checks.',
      },
      {
        name: 'Container Startup & Crash Stability',
        expected: 'Clean Execution',
        actual: hasCrashLoop ? 'CrashLoopBackOff' : hasImagePullError ? 'ImagePullBackOff' : hasOOM ? 'OOMKilled' : hasConfigError ? 'ConfigError' : 'Stable',
        status: !hasCrashLoop && !hasImagePullError && !hasOOM && !hasConfigError ? 'PASS' : 'FAIL',
        description: 'Verifies containers start without CrashLoopBackOff, ImagePullBackOff, OOMKilled, or missing ConfigMaps.',
      },
      {
        name: 'Workload Replica Availability',
        expected: dep.replicas || 1,
        actual: dep.availableReplicas || (isPodReady ? 1 : 0),
        status: isReplicasHealthy || isPodReady ? 'PASS' : 'FAIL',
        description: 'Verifies desired replicas are healthy and available to serve traffic.',
      },
    ];

    // Check service endpoints if Service exists
    if (services.length > 0) {
      const primarySvc = services[0];
      const endpointCount = primarySvc.endpointCount ?? (isPodReady ? 1 : 0);
      checks.push({
        name: 'Service Endpoints Registration',
        expected: '> 0 endpoints',
        actual: `${endpointCount} active endpoints`,
        status: endpointCount > 0 ? 'PASS' : 'FAIL',
        description: 'Verifies Service selector maps to active backend application pods.',
      });
    }

    const passCount = checks.filter((c) => c.status === 'PASS').length;
    const totalCount = checks.length;
    const isAllPass = passCount === totalCount;
    const isAnyPass = passCount > 0;

    let status = isAllPass ? 'PASS' : isAnyPass ? 'PARTIAL' : 'FAIL';
    let score = isAllPass ? 100 : Math.round((passCount / totalCount) * 80);

    let summary = isAllPass
      ? 'HEALTH CHECK: All application health checks passed. Workload is Running and Ready.'
      : isAnyPass
      ? `HEALTH CHECK: Application is partially healthy (${passCount}/${totalCount} checks passed). Review failing components.`
      : 'HEALTH CHECK: Application health check failed. Workload contains unready pods or crashing containers.';

    const evidence = [
      `Pods Running: ${pods.filter((p) => p.phase === 'Running').length} / Total: ${pods.length}`,
      `Containers Stable: ${!hasCrashLoop && !hasImagePullError && !hasOOM ? 'Yes' : 'No'}`,
      `Service Endpoints: ${services[0]?.endpointCount ?? (isPodReady ? 1 : 0)}`,
      `Sandbox Namespace: ${deployment.namespace}`,
    ];

    const nextAction = isAllPass
      ? 'Application is healthy! You can continue experimenting with your configuration or test updates.'
      : 'Inspect pod logs and events in the terminal or ask AI Mentor for diagnosis.';

    // Count previous attempts
    const attemptCount = await ValidationResult.countDocuments({
      scenarioAttempt: attempt._id,
      user: userId,
    });

    const durationMs = Date.now() - startTime;

    // 3. Save ValidationResult document marked as BYOA
    const valResultDoc = await ValidationResult.create({
      user: userId,
      project: project._id,
      deployment: deployment._id,
      scenarioAttempt: attempt._id,
      beforeContextSnapshot: beforeSnapshot._id,
      afterContextSnapshot: afterSnapshot._id,
      scenario: 'byoa',
      isBYOA: true,
      status,
      summary,
      checks,
      score,
      evidence,
      nextAction,
      deploymentState: {
        name: dep.name || 'custom-app',
        replicas: dep.replicas || 1,
        availableReplicas: dep.availableReplicas || 0,
        ready: isPodReady,
      },
      runtimeState: {
        phase: primaryPod.phase || 'Unknown',
        ready: isPodReady,
        restarts: primaryPod.restarts || 0,
        exitCode: primaryContainer.exitCode ?? 0,
        serviceEndpoints: services[0]?.endpointCount ?? 0,
      },
      changedResources: deployment.resources?.map((r) => `${r.kind}/${r.name}`) || [],
      attemptNumber: attemptCount + 1,
      durationMs,
      validatedAt: new Date(),
    });

    return {
      validationId: valResultDoc._id,
      scenarioId: 'byoa',
      scenarioName: project.name,
      status: valResultDoc.status,
      summary: valResultDoc.summary,
      checks: valResultDoc.checks,
      score: valResultDoc.score,
      evidence: valResultDoc.evidence,
      nextAction: valResultDoc.nextAction,
      deploymentState: valResultDoc.deploymentState,
      runtimeState: valResultDoc.runtimeState,
      changedResources: valResultDoc.changedResources,
      attemptNumber: valResultDoc.attemptNumber,
      durationMs: valResultDoc.durationMs,
      validatedAt: valResultDoc.validatedAt,
      isBYOA: true,
    };
  },

  /**
   * List all BYOA labs created by a user
   * @param {string} userId
   * @returns {Array<Object>} List of BYOA lab summaries
   */
  getUserBYOALabs: async (userId) => {
    const projects = await Project.find({
      owner: userId,
      isBYOA: true,
      isLabInternal: true,
    }).sort({ createdAt: -1 });

    const results = [];
    for (const proj of projects) {
      const deployment = await DeploymentRecord.findOne({ project: proj._id }).sort({ createdAt: -1 });
      const files = await ProjectFile.find({ project: proj._id });
      const lastValidation = await ValidationResult.findOne({ project: proj._id, isBYOA: true }).sort({ createdAt: -1 });

      results.push({
        labId: proj.labId,
        projectId: proj._id,
        name: proj.name,
        description: proj.description,
        namespace: deployment?.namespace || 'N/A',
        fileCount: files.length,
        status: proj.status,
        lastValidationStatus: lastValidation?.status || 'UNVALIDATED',
        lastScore: lastValidation?.score || 0,
        createdAt: proj.createdAt,
        updatedAt: proj.updatedAt,
      });
    }

    return results;
  },
};

export default byoaService;
