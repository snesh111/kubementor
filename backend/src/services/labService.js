import yaml from 'js-yaml';
import Project from '../models/Project.js';
import ProjectFile from '../models/ProjectFile.js';
import FailureScenario from '../models/FailureScenario.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import LabNote from '../models/LabNote.js';
import ContextSnapshot from '../models/ContextSnapshot.js';
import ValidationResult from '../models/ValidationResult.js';
import AIConversation from '../models/AIConversation.js';
import AIMentorResponse from '../models/AIMentorResponse.js';
import k8sService from '../kubernetes/k8sService.js';
import deploymentService from '../kubernetes/deploymentService.js';
import { parseAndEnforceSandboxManifests } from '../kubernetes/manifestParser.js';
import scenarioService from '../scenarios/scenarioService.js';
import contextService from '../context/contextService.js';
import troubleshootingEngine from '../ai/troubleshootingEngine.js';
import aiService from '../ai/aiService.js';
import validationService from '../validation/validationService.js';
import byoaService from './byoaService.js';
import k8sClientWrapper from '../kubernetes/k8sClient.js';
import { ApiError } from '../middleware/errorMiddleware.js';

const MAX_AI_REQUESTS_PER_ATTEMPT = parseInt(process.env.AI_MAX_REQUESTS_PER_ATTEMPT || '20', 10);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const STARTER_MANIFESTS = {
  common: {
    service: `apiVersion: v1
kind: Service
metadata:
  name: web-service
  labels:
    app: web-app
spec:
  type: ClusterIP
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 80
`,
    configmap: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
`,
    secret: `apiVersion: v1
kind: Secret
metadata:
  name: example-tls-secret
type: kubernetes.io/tls
data:
  tls.crt: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg=="
  tls.key: "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQo="
`,
    ingress: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
  tls:
  - hosts:
    - app.example.com
    secretName: example-tls-secret
`,
  },
  'crash-loop-backoff': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        command: ["/bin/sh", "-c", "echo Starting service... && sleep 2 && exit 1"]
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
          requests:
            memory: "64Mi"
            cpu: "100m"
`,
  },
  'image-pull-backoff': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3-nonexistent-release-v99
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
          requests:
            memory: "64Mi"
            cpu: "100m"
`,
  },
  'oom-killed': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "16Mi"
            cpu: "500m"
          requests:
            memory: "16Mi"
            cpu: "100m"
`,
  },
  'missing-configmap': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
        env:
        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: APP_ENV
`,
  },
  'service-connectivity': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
`,
    service: `apiVersion: v1
kind: Service
metadata:
  name: web-service
  labels:
    app: web-app
spec:
  type: ClusterIP
  selector:
    app: mismatched-label-service
  ports:
  - port: 80
    targetPort: 80
`,
  },
  'ingress-tls-failure': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
`,
    ingress: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
  tls:
  - hosts:
    - app.example.com
    secretName: nonexistent-tls-secret-failure
`,
  },
  'topic-pods': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      volumes:
      - name: shared-logs
        emptyDir: {}
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
        volumeMounts:
        - name: shared-logs
          mountPath: /var/log/nginx
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
          requests:
            memory: "64Mi"
            cpu: "100m"
      - name: log-sidecar
        image: alpine:3.18
        command: ["sh", "-c", "tail -F /var/log/nginx/access.log"]
        volumeMounts:
        - name: shared-logs
          mountPath: /var/log/nginx
        resources:
          limits:
            memory: "64Mi"
            cpu: "100m"
`,
  },
  'topic-deployments': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
          requests:
            memory: "64Mi"
            cpu: "100m"
`,
  },
  'topic-services': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
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
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
          requests:
            memory: "64Mi"
            cpu: "100m"
`,
    service: `apiVersion: v1
kind: Service
metadata:
  name: web-service
  labels:
    app: web-app
spec:
  type: ClusterIP
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 80
`,
  },
  'topic-configmaps': {
    deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25.3
        ports:
        - containerPort: 80
        env:
        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: APP_ENV
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
          requests:
            memory: "64Mi"
            cpu: "100m"
`,
  },
};

export const labService = {
  /**
   * Get starter manifest templates for a given scenario
   * @param {string} scenarioId
   * @returns {Array<Object>} List of starter files
   */
  getStarterManifests: (scenarioId) => {
    const scenarioConfig = STARTER_MANIFESTS[scenarioId] || STARTER_MANIFESTS['crash-loop-backoff'];
    const files = [
      {
        originalName: 'deployment.yaml',
        fileType: 'yaml',
        mimeType: 'application/x-yaml',
        content: scenarioConfig.deployment || STARTER_MANIFESTS['crash-loop-backoff'].deployment,
      },
      {
        originalName: 'service.yaml',
        fileType: 'yaml',
        mimeType: 'application/x-yaml',
        content: scenarioConfig.service || STARTER_MANIFESTS.common.service,
      },
    ];

    if (scenarioId === 'missing-configmap') {
      files.push({
        originalName: 'configmap.yaml',
        fileType: 'yaml',
        mimeType: 'application/x-yaml',
        content: STARTER_MANIFESTS.common.configmap,
      });
    }

    if (scenarioId === 'ingress-tls-failure') {
      files.push(
        {
          originalName: 'ingress.yaml',
          fileType: 'yaml',
          mimeType: 'application/x-yaml',
          content: scenarioConfig.ingress || STARTER_MANIFESTS.common.ingress,
        },
        {
          originalName: 'secret.yaml',
          fileType: 'yaml',
          mimeType: 'application/x-yaml',
          content: STARTER_MANIFESTS.common.secret,
        }
      );
    }

    return files;
  },

  /**
   * Start or resume an interactive lab session
   * @param {string} userId - Authenticated user ObjectId
   * @param {string} labId - Scenario ID slug
   * @returns {Object} Unified LabSession object
   */
  startLab: async (userId, labId) => {
    // 1. Check if BYOA lab session
    const byoaProject = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
      isBYOA: true,
    });

    if (byoaProject) {
      return await labService.getLabSession(userId, labId);
    }

    // 2. Ensure default scenarios seeded and validate labId
    await scenarioService.seedDefaultScenarios();
    const scenarioDoc = await FailureScenario.findOne({ scenarioId: labId, enabled: true });
    if (!scenarioDoc) {
      throw new ApiError(`Lab scenario '${labId}' not found or is currently unavailable.`, 404);
    }

    // 2. Find existing internal lab project for this user & lab
    let project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    // 3. If project exists, check for an active attempt & deployment to resume
    if (project) {
      const activeAttempt = await ScenarioAttempt.findOne({
        project: project._id,
        user: userId,
        scenarioId: labId,
        status: { $in: ['active', 'preparing', 'injecting'] },
      }).sort({ createdAt: -1 });

      const activeDeployment = await DeploymentRecord.findOne({
        project: project._id,
        user: userId,
      }).sort({ createdAt: -1 });

      if (activeAttempt && activeDeployment && activeDeployment.status !== 'stopped') {
        let contextSnapshot = null;
        try {
          contextSnapshot = await contextService.getContextByAttemptId(project._id, activeAttempt._id, userId);
        } catch (ctxErr) {
          console.warn('[LabService] Context fetch warning on resume:', ctxErr.message);
        }

        const files = await ProjectFile.find({ project: project._id, owner: userId }).sort({ originalName: 1 });

        return {
          labId: scenarioDoc.scenarioId,
          title: scenarioDoc.name,
          difficulty: scenarioDoc.difficulty,
          internalProjectId: project._id,
          attemptId: activeAttempt._id,
          deploymentId: activeDeployment._id,
          namespace: activeDeployment.namespace,
          mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
          starterFiles: files.map((f) => f.toResponseObject(true)),
          concept: scenarioDoc.concept || {},
          mission: {
            description: scenarioDoc.description,
            objective: scenarioDoc.objective,
            expectedFailure: scenarioDoc.expectedFailure,
          },
          initialStatus: activeAttempt.status,
          initialContext: contextSnapshot?.context || null,
          summary: contextSnapshot?.summary || null,
          resumed: true,
        };
      }
    }

    // 4. Create new internal project if not present
    if (!project) {
      project = await Project.create({
        name: `[Lab] ${scenarioDoc.name}`,
        description: `Automated interactive lab workspace for ${scenarioDoc.name}`,
        owner: userId,
        isLabInternal: true,
        labId,
        status: 'draft',
      });
    }

    // 5. Ensure starter files exist in DB
    let createdFiles = await ProjectFile.find({ project: project._id, owner: userId }).sort({ originalName: 1 });
    if (createdFiles.length === 0) {
      const starterManifests = labService.getStarterManifests(labId);
      createdFiles = [];

      for (const item of starterManifests) {
        const file = await ProjectFile.create({
          project: project._id,
          owner: userId,
          originalName: item.originalName,
          storedName: `${Date.now()}-${item.originalName}`,
          fileType: item.fileType || 'yaml',
          mimeType: item.mimeType || 'application/x-yaml',
          size: Buffer.byteLength(item.content),
          content: item.content,
        });
        createdFiles.push(file);
      }
    }

    // 6. Deploy starter application to isolated sandbox
    const fileIds = createdFiles.map((f) => f._id);
    const deploymentRecord = await k8sService.deployToSandbox(project._id, userId, fileIds);

    // 7. Inject requested failure scenario
    const attemptDoc = await scenarioService.startScenario(
      project._id,
      labId,
      deploymentRecord._id || deploymentRecord.id,
      userId
    );

    // 8. Collect initial context telemetry & AI diagnosis
    let contextSnapshot = null;
    try {
      contextSnapshot = await contextService.getContextByAttemptId(
        project._id,
        attemptDoc._id || attemptDoc.id,
        userId
      );
    } catch (ctxErr) {
      console.warn('[LabService] Context capture warning on lab start:', ctxErr.message);
    }

    // 9. Return unified LabSession response
    return {
      labId: scenarioDoc.scenarioId,
      title: scenarioDoc.name,
      difficulty: scenarioDoc.difficulty,
      internalProjectId: project._id,
      attemptId: attemptDoc._id || attemptDoc.id,
      deploymentId: deploymentRecord._id || deploymentRecord.id,
      namespace: deploymentRecord.namespace,
      mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
      starterFiles: createdFiles.map((f) => f.toResponseObject(true)),
      concept: scenarioDoc.concept || {},
      mission: {
        description: scenarioDoc.description,
        objective: scenarioDoc.objective,
        expectedFailure: scenarioDoc.expectedFailure,
      },
      initialStatus: attemptDoc.status || 'active',
      initialContext: contextSnapshot?.context || null,
      summary: contextSnapshot?.summary || null,
      resumed: false,
    };
  },

  /**
   * Get current user's active lab session for a scenario
   * @param {string} userId - Authenticated user ObjectId
   * @param {string} labId - Scenario ID slug
   * @returns {Object} Unified LabSession object
   */
  getLabSession: async (userId, labId) => {
    // 1. Check for BYOA lab session
    const byoaProject = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
      isBYOA: true,
    });

    if (byoaProject) {
      const attempt = await ScenarioAttempt.findOne({
        project: byoaProject._id,
        user: userId,
      }).sort({ createdAt: -1 });

      const deployment = await DeploymentRecord.findOne({
        project: byoaProject._id,
        user: userId,
      }).sort({ createdAt: -1 });

      if (!attempt || !deployment) {
        throw new ApiError('No active BYOA lab session found', 404);
      }

      let contextSnapshot = null;
      try {
        contextSnapshot = await contextService.getContextByAttemptId(byoaProject._id, attempt._id, userId);
      } catch (ctxErr) {
        console.warn('[LabService] BYOA Context fetch warning:', ctxErr.message);
      }

      const files = await ProjectFile.find({ project: byoaProject._id, owner: userId }).sort({ originalName: 1 });

      return {
        labId: byoaProject.labId,
        title: byoaProject.name,
        difficulty: 'Advanced',
        internalProjectId: byoaProject._id,
        attemptId: attempt._id,
        deploymentId: deployment._id,
        namespace: deployment.namespace,
        mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
        starterFiles: files.map((f) => f.toResponseObject(true)),
        isBYOA: true,
        concept: {
          whatIsIt: 'Bring Your Own Application (BYOA) allows you to import and test your custom Kubernetes manifests in an isolated, safe sandbox environment.',
          troubleshootingPlaybook: [
            { stepNumber: 1, title: 'Inspect Pods & Deployments', description: 'Run kubectl get pods,deployments to check status.', command: `kubectl get all -n ${deployment.namespace}` },
            { stepNumber: 2, title: 'Review Logs', description: 'Inspect container stdout/stderr logs.', command: `kubectl logs <pod-name> -n ${deployment.namespace}` },
            { stepNumber: 3, title: 'Check Services & Endpoints', description: 'Verify service selectors match pod labels.', command: `kubectl get endpoints -n ${deployment.namespace}` },
            { stepNumber: 4, title: 'Validate Health', description: 'Click Validate My Solution to run automated runtime health checks.' },
          ],
        },
        mission: {
          description: `Custom application workspace for '${byoaProject.name}'. Isolated namespace: '${deployment.namespace}'.`,
          objective: 'Observe application behavior in terminal, edit manifests in YAML editor, investigate with AI Mentor, and validate workload health.',
          expectedFailure: 'Custom Workload Health Check',
        },
        initialStatus: attempt.status,
        initialContext: contextSnapshot?.context || null,
        summary: contextSnapshot?.summary || null,
        resumed: true,
      };
    }

    const scenarioDoc = await FailureScenario.findOne({ scenarioId: labId, enabled: true });
    if (!scenarioDoc) {
      throw new ApiError(`Lab scenario '${labId}' not found`, 404);
    }

    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
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
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    let contextSnapshot = null;
    try {
      contextSnapshot = await contextService.getContextByAttemptId(project._id, attempt._id, userId);
    } catch (ctxErr) {
      console.warn('[LabService] Context fetch warning:', ctxErr.message);
    }

    const files = await ProjectFile.find({ project: project._id, owner: userId }).sort({ originalName: 1 });

    return {
      labId: scenarioDoc.scenarioId,
      title: scenarioDoc.name,
      difficulty: scenarioDoc.difficulty,
      internalProjectId: project._id,
      attemptId: attempt._id,
      deploymentId: deployment._id,
      namespace: deployment.namespace,
      mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
      starterFiles: files.map((f) => f.toResponseObject(true)),
      concept: scenarioDoc.concept || {},
      mission: {
        description: scenarioDoc.description,
        objective: scenarioDoc.objective,
        expectedFailure: scenarioDoc.expectedFailure,
      },
      initialStatus: attempt.status,
      initialContext: contextSnapshot?.context || null,
      summary: contextSnapshot?.summary || null,
      resumed: true,
    };
  },

  /**
   * Reset lab environment back to its original failed state
   * @param {string} userId - Authenticated user ObjectId
   * @param {string} labId - Scenario ID slug
   * @returns {Object} Fresh LabSession object
   */
  resetLab: async (userId, labId) => {
    // 1. Check for BYOA lab
    const byoaProject = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
      isBYOA: true,
    });

    if (byoaProject) {
      const files = await ProjectFile.find({ project: byoaProject._id, owner: userId });
      if (files.length === 0) {
        throw new ApiError('No manifest files found in BYOA workspace to reset', 400);
      }

      const deployment = await DeploymentRecord.findOne({
        project: byoaProject._id,
        user: userId,
      }).sort({ createdAt: -1 });

      const namespace = deployment ? deployment.namespace : `kubementor-u${userId}-p${byoaProject._id}`;
      const resourceResults = await deploymentService.deployManifests(namespace, files);

      if (deployment) {
        deployment.resources = resourceResults;
        deployment.status = 'running';
        await deployment.save();
      }

      let attempt = await ScenarioAttempt.findOne({
        project: byoaProject._id,
        user: userId,
      }).sort({ createdAt: -1 });

      if (attempt) {
        attempt.status = 'active';
        await attempt.save();
      }

      let contextSnapshot = null;
      try {
        if (attempt) {
          const snapshotResult = await contextService.generateAndSaveSnapshot(byoaProject._id, attempt._id, userId);
          contextSnapshot = await ContextSnapshot.findById(snapshotResult.snapshotId);
        }
      } catch (ctxErr) {
        console.warn('[LabService] BYOA reset context warning:', ctxErr.message);
      }

      return {
        labId: byoaProject.labId,
        title: byoaProject.name,
        difficulty: 'Advanced',
        internalProjectId: byoaProject._id,
        attemptId: attempt?._id,
        deploymentId: deployment?._id,
        namespace,
        mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
        starterFiles: files.map((f) => f.toResponseObject(true)),
        isBYOA: true,
        concept: {
          whatIsIt: 'Bring Your Own Application (BYOA) allows you to import and test your custom Kubernetes manifests in an isolated, safe sandbox environment.',
          troubleshootingPlaybook: [
            { stepNumber: 1, title: 'Inspect Pods & Deployments', description: 'Run kubectl get pods,deployments to check status.', command: `kubectl get all -n ${namespace}` },
            { stepNumber: 2, title: 'Review Logs', description: 'Inspect container stdout/stderr logs.', command: `kubectl logs <pod-name> -n ${namespace}` },
            { stepNumber: 3, title: 'Check Services & Endpoints', description: 'Verify service selectors match pod labels.', command: `kubectl get endpoints -n ${namespace}` },
            { stepNumber: 4, title: 'Validate Health', description: 'Click Validate My Solution to run automated runtime health checks.' },
          ],
        },
        mission: {
          description: `Custom application workspace for '${byoaProject.name}'. Isolated namespace: '${namespace}'.`,
          objective: 'Observe application behavior in terminal, edit manifests in YAML editor, investigate with AI Mentor, and validate workload health.',
          expectedFailure: 'Custom Workload Health Check',
        },
        initialStatus: attempt?.status || 'active',
        initialContext: contextSnapshot?.context || null,
        summary: contextSnapshot?.summary || null,
        resumed: false,
      };
    }

    const scenarioDoc = await FailureScenario.findOne({ scenarioId: labId, enabled: true });
    if (!scenarioDoc) {
      throw new ApiError(`Lab scenario '${labId}' not found`, 404);
    }

    let project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      return await labService.startLab(userId, labId);
    }

    // 1. Recreate clean starter files
    await ProjectFile.deleteMany({ project: project._id, owner: userId });
    const starterManifests = labService.getStarterManifests(labId);
    const createdFiles = [];

    for (const item of starterManifests) {
      const file = await ProjectFile.create({
        project: project._id,
        owner: userId,
        originalName: item.originalName,
        storedName: `${Date.now()}-${item.originalName}`,
        fileType: item.fileType || 'yaml',
        mimeType: item.mimeType || 'application/x-yaml',
        size: Buffer.byteLength(item.content),
        content: item.content,
      });
      createdFiles.push(file);
    }

    // 2. Redeploy starter application to sandbox
    const fileIds = createdFiles.map((f) => f._id);
    const deploymentRecord = await k8sService.deployToSandbox(project._id, userId, fileIds);

    // 3. Re-inject failure scenario
    const attemptDoc = await scenarioService.startScenario(
      project._id,
      labId,
      deploymentRecord._id || deploymentRecord.id,
      userId
    );

    // 4. Collect fresh initial context snapshot
    let contextSnapshot = null;
    try {
      contextSnapshot = await contextService.getContextByAttemptId(
        project._id,
        attemptDoc._id || attemptDoc.id,
        userId
      );
    } catch (ctxErr) {
      console.warn('[LabService] Context capture warning on lab reset:', ctxErr.message);
    }

    return {
      labId: scenarioDoc.scenarioId,
      title: scenarioDoc.name,
      difficulty: scenarioDoc.difficulty,
      internalProjectId: project._id,
      attemptId: attemptDoc._id || attemptDoc.id,
      deploymentId: deploymentRecord._id || deploymentRecord.id,
      namespace: deploymentRecord.namespace,
      mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
      starterFiles: createdFiles.map((f) => f.toResponseObject(true)),
      concept: scenarioDoc.concept || {},
      mission: {
        description: scenarioDoc.description,
        objective: scenarioDoc.objective,
        expectedFailure: scenarioDoc.expectedFailure,
      },
      initialStatus: attemptDoc.status || 'active',
      initialContext: contextSnapshot?.context || null,
      summary: contextSnapshot?.summary || null,
      resumed: false,
    };
  },

  /**
   * Get all manifest files for active lab
   * @param {string} userId - Authenticated user ObjectId
   * @param {string} labId - Scenario ID slug
   * @returns {Array<Object>} List of ProjectFile objects with content
   */
  getLabFiles: async (userId, labId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const files = await ProjectFile.find({ project: project._id, owner: userId }).sort({ originalName: 1 });
    return files.map((f) => f.toResponseObject(true));
  },

  /**
   * Get single manifest file by name for active lab
   * @param {string} userId
   * @param {string} labId
   * @param {string} filename
   * @returns {Object} ProjectFile object with content
   */
  getLabFileByName: async (userId, labId, filename) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const file = await ProjectFile.findOne({
      project: project._id,
      owner: userId,
      originalName: filename,
    });

    if (!file) {
      throw new ApiError(`File '${filename}' not found in active lab workspace`, 404);
    }

    return file.toResponseObject(true);
  },

  /**
   * Save / update a manifest file for active lab with syntax validation
   * @param {string} userId
   * @param {string} labId
   * @param {string} filename
   * @param {string} content
   * @returns {Object} Updated ProjectFile object
   */
  saveLabFile: async (userId, labId, filename, content) => {
    if (content === undefined || content === null) {
      throw new ApiError('File content cannot be empty', 400);
    }

    const size = Buffer.byteLength(content, 'utf8');
    if (size > MAX_FILE_SIZE) {
      throw new ApiError('File exceeds the 5 MB limit', 400);
    }

    // 1. Validate YAML syntax
    try {
      yaml.loadAll(content);
    } catch (err) {
      const lineMatch = err.message.match(/line (\d+)/i) || (err.mark ? [`line ${err.mark.line + 1}`, err.mark.line + 1] : null);
      const lineNum = lineMatch ? lineMatch[1] : 'unknown';
      throw new ApiError(`Invalid YAML syntax near line ${lineNum}: ${err.reason || err.message}`, 400);
    }

    // 2. Find internal project
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    // 3. Find existing file or create
    let file = await ProjectFile.findOne({
      project: project._id,
      owner: userId,
      originalName: filename,
    });

    if (file) {
      file.content = content;
      file.size = size;
      await file.save();
    } else {
      file = await ProjectFile.create({
        project: project._id,
        owner: userId,
        originalName: filename,
        storedName: `${Date.now()}-${filename}`,
        fileType: 'yaml',
        mimeType: 'application/x-yaml',
        size,
        content,
      });
    }

    return file.toResponseObject(true);
  },

  /**
   * Deploy all saved manifest files to the isolated sandbox environment
   * @param {string} userId
   * @param {string} labId
   * @returns {Object} Deployment observation result
   */
  deployLab: async (userId, labId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const attempt = await ScenarioAttempt.findOne({
      project: project._id,
      user: userId,
      scenarioId: labId,
    }).sort({ createdAt: -1 });

    const deployment = await DeploymentRecord.findOne({
      project: project._id,
      user: userId,
    }).sort({ createdAt: -1 });

    if (!attempt || !deployment) {
      throw new ApiError('No active deployment or scenario found for this lab', 404);
    }

    const namespace = deployment.namespace;

    // 1. Load saved files
    const files = await ProjectFile.find({ project: project._id, owner: userId });
    if (files.length === 0) {
      throw new ApiError('No manifest files found in active lab workspace to deploy', 400);
    }

    // 2. Parse and enforce sandbox manifest rules
    const combinedContent = files.map((f) => f.content).join('\n---\n');
    const parseResult = parseAndEnforceSandboxManifests(combinedContent, namespace);
    if (!parseResult.valid) {
      throw new ApiError(parseResult.error, 400);
    }

    // 3. Apply manifests using deploymentService
    const resourceResults = await deploymentService.deployManifests(namespace, files);

    // 4. Update deployment record
    deployment.resources = resourceResults;
    deployment.status = 'running';
    deployment.completedAt = new Date();
    await deployment.save();

    // 5. Generate fresh ContextSnapshot reflecting newly deployed state
    const freshSnapshot = await contextService.generateAndSaveSnapshot(project._id, attempt._id, userId);

    if (project.isBYOA) {
      return {
        success: true,
        mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
        namespace,
        appliedFiles: files.map((f) => f.originalName),
        status: 'deployed',
        observedFailure: null,
        message: 'BYOA manifests applied successfully to isolated sandbox environment.',
        context: freshSnapshot.context,
        summary: freshSnapshot.summary,
      };
    }

    // 6. Check if fix resolved the scenario in simulation / live state
    const updatedAttempt = await ScenarioAttempt.findById(attempt._id);
    let isFixed = updatedAttempt?.restorationDetails?.fixApplied === true;

    if (!isFixed && k8sClientWrapper.isConnected && k8sClientWrapper.coreV1Api) {
      try {
        const liveStatus = await statusService.getSandboxStatus(namespace);
        const hasReadyPod = liveStatus.pods?.some((p) => p.phase === 'Running' && (p.ready === true || p.containers?.[0]?.ready === true));
        if (hasReadyPod) {
          isFixed = true;
          if (updatedAttempt) {
            updatedAttempt.restorationDetails = { fixApplied: true };
            await updatedAttempt.save();
          }
        }
      } catch (err) {
        // Fallback to updatedAttempt check
      }
    }

    const status = isFixed ? 'fixed' : 'still_failing';
    const observedFailure = isFixed ? null : attempt.scenarioId;
    const message = isFixed
      ? 'Deployment applied successfully! Workload has recovered and the failure condition is resolved.'
      : 'Deployment applied successfully to sandbox, but the failure condition persists in the workload.';

    return {
      success: true,
      mode: k8sClientWrapper.isConnected ? 'kubernetes' : 'simulation',
      namespace,
      appliedFiles: files.map((f) => f.originalName),
      status,
      observedFailure,
      message,
      context: freshSnapshot.context,
      summary: freshSnapshot.summary,
    };
  },

  /**
   * Get persistent investigation notes for active lab
   * @param {string} userId
   * @param {string} labId
   * @returns {Object} LabNote response object
   */
  getLabNotes: async (userId, labId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    let note = await LabNote.findOne({
      user: userId,
      labId,
    });

    if (!note) {
      note = await LabNote.create({
        user: userId,
        project: project._id,
        labId,
        evidence: '',
        hypothesis: '',
        rootCause: '',
        plannedFix: '',
        result: '',
        generalNotes: '',
        lastSavedAt: new Date(),
      });
    }

    return note.toResponseObject();
  },

  /**
   * Save / update persistent investigation notes for active lab
   * @param {string} userId
   * @param {string} labId
   * @param {Object} noteData
   * @returns {Object} LabNote response object
   */
  saveLabNotes: async (userId, labId, noteData = {}) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const {
      evidence = '',
      hypothesis = '',
      rootCause = '',
      plannedFix = '',
      result = '',
      generalNotes = '',
    } = noteData;

    // Field length validations
    if (evidence && evidence.length > 10000) {
      throw new ApiError('Evidence notes cannot exceed 10,000 characters', 400);
    }
    if (hypothesis && hypothesis.length > 10000) {
      throw new ApiError('Hypothesis notes cannot exceed 10,000 characters', 400);
    }
    if (rootCause && rootCause.length > 10000) {
      throw new ApiError('Root cause notes cannot exceed 10,000 characters', 400);
    }
    if (plannedFix && plannedFix.length > 10000) {
      throw new ApiError('Planned fix notes cannot exceed 10,000 characters', 400);
    }
    if (result && result.length > 10000) {
      throw new ApiError('Result notes cannot exceed 10,000 characters', 400);
    }
    if (generalNotes && generalNotes.length > 20000) {
      throw new ApiError('General notes cannot exceed 20,000 characters', 400);
    }

    let note = await LabNote.findOne({
      user: userId,
      labId,
    });

    if (note) {
      note.evidence = evidence;
      note.hypothesis = hypothesis;
      note.rootCause = rootCause;
      note.plannedFix = plannedFix;
      note.result = result;
      note.generalNotes = generalNotes;
      note.lastSavedAt = new Date();
      await note.save();
    } else {
      note = await LabNote.create({
        user: userId,
        project: project._id,
        labId,
        evidence,
        hypothesis,
        rootCause,
        plannedFix,
        result,
        generalNotes,
        lastSavedAt: new Date(),
      });
    }

    return note.toResponseObject();
  },

  /**
   * Helper: Retrieve lab session, attempt, and context snapshot with Scratchpad data
   * @param {string} userId
   * @param {string} labId
   * @param {boolean} checkRateLimit
   * @returns {Object} Session components & snapshot
   */
  getLabSessionAndSnapshot: async (userId, labId, checkRateLimit = true) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const attempt = await ScenarioAttempt.findOne({
      project: project._id,
      user: userId,
    }).sort({ createdAt: -1 });

    const deployment = attempt?.deployment
      ? await DeploymentRecord.findById(attempt.deployment)
      : await DeploymentRecord.findOne({
          project: project._id,
          user: userId,
        }).sort({ createdAt: -1 });

    if (!attempt || !deployment) {
      throw new ApiError('No active scenario attempt or deployment found for this lab', 404);
    }

    if (checkRateLimit) {
      const requestCount = await AIMentorResponse.countDocuments({
        scenarioAttempt: attempt._id,
        user: userId,
      });

      if (requestCount >= MAX_AI_REQUESTS_PER_ATTEMPT) {
        throw new ApiError(`AI hint request limit reached for this scenario attempt (Max ${MAX_AI_REQUESTS_PER_ATTEMPT} requests).`, 429);
      }
    }

    // Generate fresh context snapshot reflecting current sandbox/cluster state
    const generated = await contextService.generateAndSaveSnapshot(project._id, attempt._id, userId);
    const snapshot = await ContextSnapshot.findById(generated.snapshotId);

    // Retrieve learner's Scratchpad notes
    const notes = await LabNote.findOne({ user: userId, labId });
    const notesObj = notes ? notes.toObject() : {};

    // Clone snapshot object to embed scratchpad notes safely
    const snapshotObj = snapshot.toObject ? snapshot.toObject() : snapshot;
    if (snapshotObj.context) {
      snapshotObj.context.scratchpad = notesObj;
    }
    snapshotObj.scratchpad = notesObj;

    return { project, attempt, deployment, snapshot: snapshotObj, rawSnapshotDoc: snapshot, notes: notesObj };
  },

  /**
   * Proactive context-grounded AI diagnosis for active lab
   * @param {string} userId
   * @param {string} labId
   * @returns {Object} AI diagnosis response
   */
  diagnoseLab: async (userId, labId) => {
    const { project, attempt, deployment, snapshot, rawSnapshotDoc } = await labService.getLabSessionAndSnapshot(userId, labId, true);

    const responseObj = await troubleshootingEngine.processMentorRequest('diagnose', snapshot);

    await AIMentorResponse.create({
      user: userId,
      project: project._id,
      deployment: deployment._id,
      scenarioAttempt: attempt._id,
      contextSnapshot: rawSnapshotDoc._id,
      mode: 'diagnose',
      response: responseObj,
    });

    await aiService.appendConversationMessage(
      userId,
      project._id,
      deployment._id,
      attempt._id,
      rawSnapshotDoc._id,
      'assistant',
      responseObj.diagnosis?.summary || responseObj.likelyCause || 'Generated AI Diagnosis',
      'diagnose',
      null,
      responseObj.diagnosis?.confidence,
      responseObj.evidence,
      responseObj.provider || 'fallback',
      responseObj.isFallback ?? true
    );

    return {
      labId,
      internalProjectId: project._id,
      attemptId: attempt._id,
      contextSnapshotId: rawSnapshotDoc._id,
      contextVersion: snapshot.contextVersion || '1.0',
      aiResponse: responseObj,
    };
  },

  /**
   * Request progressive hint (Levels 1-4) for active lab
   * @param {string} userId
   * @param {string} labId
   * @param {number} requestedLevel
   * @returns {Object} Progressive hint response
   */
  getLabHint: async (userId, labId, requestedLevel = 1) => {
    const level = parseInt(requestedLevel, 10);
    if (isNaN(level) || level < 1 || level > 4) {
      throw new ApiError('Invalid hint level. Allowed levels: 1 (Direction), 2 (Evidence), 3 (Root Cause), 4 (Suggested Fix)', 400);
    }

    const { project, attempt, deployment, snapshot, rawSnapshotDoc } = await labService.getLabSessionAndSnapshot(userId, labId, true);

    const responseObj = await troubleshootingEngine.processMentorRequest('hint', snapshot, { level });

    await AIMentorResponse.create({
      user: userId,
      project: project._id,
      deployment: deployment._id,
      scenarioAttempt: attempt._id,
      contextSnapshot: rawSnapshotDoc._id,
      mode: 'hint',
      hintLevel: level,
      response: responseObj,
    });

    await aiService.appendConversationMessage(
      userId,
      project._id,
      deployment._id,
      attempt._id,
      rawSnapshotDoc._id,
      'assistant',
      responseObj.hint || 'Progressive Hint',
      'hint',
      level,
      responseObj.diagnosis?.confidence,
      responseObj.evidence,
      responseObj.provider || 'fallback',
      responseObj.isFallback ?? true
    );

    return {
      labId,
      internalProjectId: project._id,
      attemptId: attempt._id,
      contextSnapshotId: rawSnapshotDoc._id,
      contextVersion: snapshot.contextVersion || '1.0',
      hintLevel: level,
      aiResponse: responseObj,
    };
  },

  /**
   * Interactive AI chat with context-grounded mentor for active lab
   * @param {string} userId
   * @param {string} labId
   * @param {string} userMessage
   * @returns {Object} AI chat response
   */
  chatWithLabMentor: async (userId, labId, userMessage) => {
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      throw new ApiError('Please provide a message for the AI Mentor.', 400);
    }

    if (userMessage.length > 2000) {
      throw new ApiError('Message exceeds the 2,000 character limit.', 400);
    }

    const { project, attempt, deployment, snapshot, rawSnapshotDoc } = await labService.getLabSessionAndSnapshot(userId, labId, true);

    // 1. Append user message to history
    await aiService.appendConversationMessage(
      userId,
      project._id,
      deployment._id,
      attempt._id,
      rawSnapshotDoc._id,
      'user',
      userMessage.trim(),
      'chat'
    );

    // 2. Generate response grounded in snapshot and Scratchpad
    const responseObj = await troubleshootingEngine.processMentorRequest('chat', snapshot, { message: userMessage.trim() });

    // 3. Append assistant response
    await aiService.appendConversationMessage(
      userId,
      project._id,
      deployment._id,
      attempt._id,
      rawSnapshotDoc._id,
      'assistant',
      responseObj.diagnosis?.summary || responseObj.likelyCause || responseObj.hint || 'AI Mentor Response',
      'chat',
      null,
      responseObj.diagnosis?.confidence,
      responseObj.evidence,
      responseObj.provider || 'fallback',
      responseObj.isFallback ?? true
    );

    // 4. Record in AIMentorResponse for telemetry & rate tracking
    await AIMentorResponse.create({
      user: userId,
      project: project._id,
      deployment: deployment._id,
      scenarioAttempt: attempt._id,
      contextSnapshot: rawSnapshotDoc._id,
      mode: 'chat',
      response: responseObj,
    });

    return {
      labId,
      internalProjectId: project._id,
      attemptId: attempt._id,
      contextSnapshotId: rawSnapshotDoc._id,
      userMessage: userMessage.trim(),
      aiResponse: responseObj,
    };
  },

  /**
   * Get AI conversation history for active lab session
   * @param {string} userId
   * @param {string} labId
   * @returns {Object} AI Conversation message history
   */
  getLabChatHistory: async (userId, labId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const attempt = await ScenarioAttempt.findOne({
      project: project._id,
      user: userId,
      scenarioId: labId,
    }).sort({ createdAt: -1 });

    if (!attempt) {
      return { messages: [] };
    }

    return await aiService.getConversationHistory(project._id, attempt._id, userId);
  },

  /**
   * Explain specific telemetry evidence topic for active lab
   * @param {string} userId
   * @param {string} labId
   * @param {string} topic
   * @returns {Object} Evidence explanation
   */
  explainLabEvidence: async (userId, labId, topic = 'events') => {
    const { project, attempt, deployment, snapshot, rawSnapshotDoc } = await labService.getLabSessionAndSnapshot(userId, labId, true);

    const responseObj = await troubleshootingEngine.processMentorRequest('explain', snapshot, { topic });

    await AIMentorResponse.create({
      user: userId,
      project: project._id,
      deployment: deployment._id,
      scenarioAttempt: attempt._id,
      contextSnapshot: rawSnapshotDoc._id,
      mode: 'explain',
      response: responseObj,
    });

    return {
      labId,
      internalProjectId: project._id,
      attemptId: attempt._id,
      contextSnapshotId: rawSnapshotDoc._id,
      topic,
      aiResponse: responseObj,
    };
  },

  /**
   * Explain Kubernetes concept grounded in active lab telemetry
   * @param {string} userId
   * @param {string} labId
   * @param {string} concept
   * @returns {Object} Concept explanation
   */
  explainLabConcept: async (userId, labId, concept = 'Kubernetes Troubleshooting') => {
    const { project, attempt, snapshot, rawSnapshotDoc } = await labService.getLabSessionAndSnapshot(userId, labId, false);

    const responseObj = await troubleshootingEngine.processMentorRequest('concept', snapshot, { conceptQuery: concept });

    return {
      labId,
      internalProjectId: project._id,
      attemptId: attempt._id,
      contextSnapshotId: rawSnapshotDoc._id,
      conceptQuery: concept,
      aiResponse: responseObj,
    };
  },

  /**
   * Validate learner's solution against authoritative runtime cluster state
   * @param {string} userId
   * @param {string} labId
   * @returns {Object} Deterministic validation result
   */
  validateLabSolution: async (userId, labId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario to validate', 404);
    }

    if (project.isBYOA) {
      return await byoaService.validateBYOAHealth(userId, labId);
    }

    const attempt = await ScenarioAttempt.findOne({
      project: project._id,
      user: userId,
      scenarioId: labId,
    }).sort({ createdAt: -1 });

    if (!attempt) {
      throw new ApiError('No active scenario attempt found for this lab', 404);
    }

    // Call validationService without forced redeployment (validating active deployed runtime state)
    const result = await validationService.validateUserFix(project._id, attempt._id, null, userId);

    return {
      labId,
      internalProjectId: project._id,
      attemptId: attempt._id,
      ...result,
    };
  },

  /**
   * Get validation attempt history for active lab
   * @param {string} userId
   * @param {string} labId
   * @returns {Array} Validation history attempts
   */
  getLabValidationHistory: async (userId, labId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const history = await ValidationResult.find({
      project: project._id,
      user: userId,
      scenario: labId,
    }).sort({ createdAt: -1 });

    return history.map((h) => h.toResponseObject());
  },

  /**
   * Get specific validation attempt details by validation ID
   * @param {string} userId
   * @param {string} labId
   * @param {string} validationId
   * @returns {Object} Validation attempt record
   */
  getLabValidationAttempt: async (userId, labId, validationId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const valDoc = await ValidationResult.findOne({
      _id: validationId,
      project: project._id,
      user: userId,
      scenario: labId,
    });

    if (!valDoc) {
      throw new ApiError('Validation attempt record not found', 404);
    }

    return valDoc.toResponseObject();
  },

  /**
   * Get guided post-mortem analysis for passed lab attempt
   * @param {string} userId
   * @param {string} labId
   * @returns {Object} Post-mortem report
   */
  getLabPostMortem: async (userId, labId) => {
    const project = await Project.findOne({
      owner: userId,
      isLabInternal: true,
      labId,
    });

    if (!project) {
      throw new ApiError('No active lab session found for this scenario', 404);
    }

    const valDoc = await ValidationResult.findOne({
      project: project._id,
      user: userId,
      scenario: labId,
      status: 'PASS',
    }).sort({ createdAt: -1 });

    if (!valDoc || !valDoc.postMortem) {
      throw new ApiError('No passed validation found for this scenario to build post-mortem', 404);
    }

    return valDoc.postMortem;
  },
};

export default labService;
