import k8sClientWrapper from '../kubernetes/k8sClient.js';
import statusService from '../kubernetes/statusService.js';

export const contextCollector = {
  /**
   * 1. Collect Scenario Context
   */
  collectScenarioContext: (scenarioAttempt, scenarioDoc) => {
    return {
      id: scenarioAttempt?.scenarioId || scenarioDoc?.scenarioId || 'unknown',
      name: scenarioAttempt?.scenarioName || scenarioDoc?.name || 'Unknown Scenario',
      category: scenarioDoc?.category || 'Reliability',
      difficulty: scenarioDoc?.difficulty || 'Beginner',
      objective: scenarioDoc?.objective || '',
      expectedFailure: scenarioAttempt?.expectedState || scenarioDoc?.expectedFailure || 'Failure',
      injectionType: scenarioDoc?.injectionType || 'patch',
      attemptId: scenarioAttempt?._id,
      attemptNumber: scenarioAttempt?.attemptNumber || 1,
    };
  },

  /**
   * 2. Collect Namespace Context
   */
  collectNamespaceContext: (deploymentRecord) => {
    return {
      namespace: deploymentRecord.namespace,
      projectId: deploymentRecord.project,
      deploymentId: deploymentRecord._id,
      status: 'Active',
    };
  },

  /**
   * 3 & 8. Collect Deployment & Resource Context
   */
  collectDeploymentContext: async (namespace, deploymentRecord) => {
    const depName = deploymentRecord.resources?.find((r) => r.kind === 'Deployment')?.name || 'web-app';

    if (!k8sClientWrapper.isConnected || !k8sClientWrapper.appsV1Api) {
      return {
        name: depName,
        replicas: 1,
        availableReplicas: 1,
        strategy: 'RollingUpdate',
        containers: [
          {
            name: 'nginx',
            image: 'nginx:1.25.3',
            requests: { cpu: '100m', memory: '128Mi' },
            limits: { cpu: '500m', memory: '512Mi' },
          },
        ],
      };
    }

    try {
      const depRes = await k8sClientWrapper.appsV1Api.readNamespacedDeployment(depName, namespace);
      const dep = depRes.body;
      const podSpec = dep.spec?.template?.spec || {};
      const containers = (podSpec.containers || []).map((c) => ({
        name: c.name,
        image: c.image,
        command: c.command || null,
        args: c.args || null,
        requests: c.resources?.requests || {},
        limits: c.resources?.limits || {},
        readinessProbe: c.readinessProbe ? true : false,
        livenessProbe: c.livenessProbe ? true : false,
      }));

      return {
        name: dep.metadata?.name || depName,
        replicas: dep.spec?.replicas || 1,
        availableReplicas: dep.status?.availableReplicas || 0,
        readyReplicas: dep.status?.readyReplicas || 0,
        strategy: dep.spec?.strategy?.type || 'RollingUpdate',
        containers,
      };
    } catch (err) {
      return {
        name: depName,
        error: `Could not fetch deployment details: ${err.message}`,
      };
    }
  },

  /**
   * 4. Collect Pod Context
   */
  collectPodContext: async (namespace) => {
    const liveStatus = await statusService.getSandboxStatus(namespace);
    return liveStatus.pods || [];
  },

  /**
   * 5. Collect Log Context (Max 100 lines, graceful handling)
   */
  collectLogContext: async (namespace, pods) => {
    if (!pods || pods.length === 0) {
      return { available: false, reason: 'No pods currently running in namespace to collect logs.' };
    }

    const pod = pods[0];
    const podName = pod.name;
    const containerName = pod.containers?.[0]?.name || 'nginx';

    if (!k8sClientWrapper.isConnected || !k8sClientWrapper.coreV1Api) {
      // Simulated container log content
      return {
        container: containerName,
        podName,
        lines: 3,
        truncated: false,
        content: `[INFO] Starting application server v1.0.0...\n[INFO] Initializing database connection pool...\n[ERROR] Application process exited unexpectedly with code 1`,
      };
    }

    try {
      const logRes = await k8sClientWrapper.coreV1Api.readNamespacedPodLog(
        podName,
        namespace,
        containerName,
        false,
        undefined,
        100, // tail 100 lines max
        true
      );

      const logText = logRes.body || '';
      const lines = logText.split('\n');

      return {
        container: containerName,
        podName,
        lines: lines.length,
        truncated: lines.length >= 100,
        content: logText.slice(0, 10000), // Max 10 KB string cap
      };
    } catch (err) {
      return {
        available: false,
        reason: `Container logs unavailable: ${err.message}`,
      };
    }
  },

  /**
   * 6. Collect Event Context (Max 50 events)
   */
  collectEventContext: async (namespace) => {
    const liveStatus = await statusService.getSandboxStatus(namespace);
    return (liveStatus.events || []).slice(0, 50);
  },

  /**
   * 8. Collect Service Context
   */
  collectServiceContext: async (namespace) => {
    const liveStatus = await statusService.getSandboxStatus(namespace);
    return liveStatus.services || [];
  },

  /**
   * 9. Collect Ingress Context
   */
  collectIngressContext: async (namespace) => {
    if (!k8sClientWrapper.isConnected || !k8sClientWrapper.networkingV1Api) {
      return [
        {
          name: 'web-ingress',
          hosts: ['app.example.com'],
          tlsSecretName: 'example-tls-secret',
        },
      ];
    }

    try {
      const ingRes = await k8sClientWrapper.networkingV1Api.listNamespacedIngress(namespace);
      const items = ingRes.body.items || [];
      return items.map((ing) => ({
        name: ing.metadata?.name,
        hosts: ing.spec?.rules?.map((r) => r.host) || [],
        tlsSecretName: ing.spec?.tls?.[0]?.secretName || null,
      }));
    } catch (err) {
      return [];
    }
  },

  /**
   * 10. Collect ConfigMap Context
   */
  collectConfigMapContext: async (namespace) => {
    if (!k8sClientWrapper.isConnected || !k8sClientWrapper.coreV1Api) {
      return [
        {
          name: 'app-config',
          exists: true,
          keys: ['app_env', 'db_host'],
        },
      ];
    }

    try {
      const cmRes = await k8sClientWrapper.coreV1Api.listNamespacedConfigMap(namespace);
      const items = cmRes.body.items || [];
      return items.map((cm) => ({
        name: cm.metadata?.name,
        exists: true,
        keys: Object.keys(cm.data || {}),
      }));
    } catch (err) {
      return [];
    }
  },
};

export default contextCollector;
