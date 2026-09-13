import k8sClientWrapper from './k8sClient.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';

export const statusService = {
  /**
   * Deterministic simulated sandbox status reflecting active scenarios or applied fixes
   */
  getSimulatedSandboxStatus: async (namespace) => {
    let activeAttempt = null;
    let deploymentRecord = null;

    try {
      deploymentRecord = await DeploymentRecord.findOne({ namespace }).sort({ createdAt: -1 });
      if (deploymentRecord) {
        activeAttempt = await ScenarioAttempt.findOne({
          deployment: deploymentRecord._id,
          status: { $in: ['active', 'injecting'] },
          'restorationDetails.fixApplied': { $ne: true },
        }).sort({ createdAt: -1 });
      }
    } catch (err) {
      // Model lookups failed or DB not connected
    }

    if (activeAttempt) {
      const scId = activeAttempt.scenarioId;
      if (scId === 'crash-loop-backoff') {
        return {
          namespace,
          namespaceStatus: 'Active',
          overallStatus: 'failed',
          deploymentsCount: 1,
          servicesCount: 1,
          podsCount: 1,
          deployments: [{ name: 'web-app', desiredReplicas: 1, availableReplicas: 0, status: 'Progressing' }],
          services: [{ name: 'web-service', type: 'ClusterIP', clusterIP: '10.96.14.22', ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }] }],
          pods: [
            {
              name: `${namespace}-pod-crash`,
              phase: 'Running',
              ready: false,
              restarts: 4,
              containers: [{ name: 'nginx', state: 'waiting', ready: false, reason: 'CrashLoopBackOff', exitCode: 1 }],
              creationTimestamp: new Date(Date.now() - 120000).toISOString(),
            },
          ],
          events: [
            { type: 'Warning', reason: 'BackOff', message: 'Back-off restarting failed container', timestamp: new Date().toISOString() },
          ],
        };
      }

      if (scId === 'image-pull-backoff') {
        return {
          namespace,
          namespaceStatus: 'Active',
          overallStatus: 'failed',
          deploymentsCount: 1,
          servicesCount: 1,
          podsCount: 1,
          deployments: [{ name: 'web-app', desiredReplicas: 1, availableReplicas: 0, status: 'Progressing' }],
          services: [{ name: 'web-service', type: 'ClusterIP', clusterIP: '10.96.14.22', ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }] }],
          pods: [
            {
              name: `${namespace}-pod-pull`,
              phase: 'Pending',
              ready: false,
              restarts: 0,
              containers: [{ name: 'nginx', state: 'waiting', ready: false, reason: 'ImagePullBackOff' }],
              creationTimestamp: new Date(Date.now() - 60000).toISOString(),
            },
          ],
          events: [
            { type: 'Warning', reason: 'Failed', message: 'Failed to pull image "nonexistent-image": rpc error', timestamp: new Date().toISOString() },
          ],
        };
      }

      if (scId === 'oom-killed') {
        return {
          namespace,
          namespaceStatus: 'Active',
          overallStatus: 'failed',
          deploymentsCount: 1,
          servicesCount: 1,
          podsCount: 1,
          deployments: [{ name: 'web-app', desiredReplicas: 1, availableReplicas: 0, status: 'Progressing' }],
          services: [{ name: 'web-service', type: 'ClusterIP', clusterIP: '10.96.14.22', ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }] }],
          pods: [
            {
              name: `${namespace}-pod-oom`,
              phase: 'Running',
              ready: false,
              restarts: 3,
              containers: [{ name: 'nginx', state: 'terminated', ready: false, reason: 'OOMKilled', exitCode: 137 }],
              creationTimestamp: new Date(Date.now() - 90000).toISOString(),
            },
          ],
          events: [
            { type: 'Warning', reason: 'OOMKilling', message: 'Killed process inside container nginx (limit 16Mi)', timestamp: new Date().toISOString() },
          ],
        };
      }

      if (scId === 'missing-configmap') {
        return {
          namespace,
          namespaceStatus: 'Active',
          overallStatus: 'failed',
          deploymentsCount: 1,
          servicesCount: 1,
          podsCount: 1,
          deployments: [{ name: 'web-app', desiredReplicas: 1, availableReplicas: 0, status: 'Progressing' }],
          services: [{ name: 'web-service', type: 'ClusterIP', clusterIP: '10.96.14.22', ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }] }],
          pods: [
            {
              name: `${namespace}-pod-config`,
              phase: 'Pending',
              ready: false,
              restarts: 0,
              containers: [{ name: 'nginx', state: 'waiting', ready: false, reason: 'CreateContainerConfigError' }],
              creationTimestamp: new Date(Date.now() - 45000).toISOString(),
            },
          ],
          events: [
            { type: 'Warning', reason: 'FailedMount', message: 'configmap "app-config" not found', timestamp: new Date().toISOString() },
          ],
        };
      }

      if (scId === 'service-connectivity') {
        return {
          namespace,
          namespaceStatus: 'Active',
          overallStatus: 'running',
          deploymentsCount: 1,
          servicesCount: 1,
          podsCount: 1,
          deployments: [{ name: 'web-app', desiredReplicas: 1, availableReplicas: 1, status: 'Ready' }],
          services: [{ name: 'web-service', type: 'ClusterIP', clusterIP: '10.96.14.22', selector: { app: 'mismatched-label' }, ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }] }],
          pods: [
            {
              name: `${namespace}-pod-svc`,
              phase: 'Running',
              ready: true,
              restarts: 0,
              containers: [{ name: 'nginx', state: 'running', ready: true }],
              creationTimestamp: new Date(Date.now() - 120000).toISOString(),
            },
          ],
          events: [
            { type: 'Warning', reason: 'Unhealthy', message: 'Endpoints empty for service "web-service"', timestamp: new Date().toISOString() },
          ],
        };
      }

      if (scId === 'ingress-tls-failure') {
        return {
          namespace,
          namespaceStatus: 'Active',
          overallStatus: 'running',
          deploymentsCount: 1,
          servicesCount: 1,
          podsCount: 1,
          deployments: [{ name: 'web-app', desiredReplicas: 1, availableReplicas: 1, status: 'Ready' }],
          services: [{ name: 'web-service', type: 'ClusterIP', clusterIP: '10.96.14.22', ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }] }],
          ingresses: [{ name: 'web-ingress', tls: [{ secretName: 'nonexistent-tls-secret-failure' }] }],
          pods: [
            {
              name: `${namespace}-pod-tls`,
              phase: 'Running',
              ready: true,
              restarts: 0,
              containers: [{ name: 'nginx', state: 'running', ready: true }],
              creationTimestamp: new Date(Date.now() - 120000).toISOString(),
            },
          ],
          events: [
            { type: 'Warning', reason: 'SyncError', message: 'Secret "nonexistent-tls-secret-failure" not found', timestamp: new Date().toISOString() },
          ],
        };
      }
    }

    // Default healthy running status for simulation
    return {
      namespace,
      namespaceStatus: 'Active',
      overallStatus: 'running',
      deploymentsCount: 1,
      servicesCount: 1,
      podsCount: 1,
      deployments: [
        {
          name: 'web-app',
          desiredReplicas: 1,
          availableReplicas: 1,
          status: 'Ready',
        },
      ],
      services: [
        {
          name: 'web-service',
          type: 'ClusterIP',
          clusterIP: '10.96.14.22',
          ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }],
        },
      ],
      pods: [
        {
          name: `${namespace}-pod-running`,
          phase: 'Running',
          ready: true,
          restarts: 0,
          containers: [{ name: 'nginx', state: 'running', ready: true }],
          creationTimestamp: new Date(Date.now() - 120000).toISOString(),
        },
      ],
      events: [
        {
          type: 'Normal',
          reason: 'Started',
          message: 'Started container nginx',
          timestamp: new Date(Date.now() - 105000).toISOString(),
        },
      ],
    };
  },

  /**
   * Fetch complete sandbox deployment status from Kubernetes cluster API
   * @param {string} namespace - Sandbox namespace
   * @returns {Object} Live status metrics & resource details
   */
  getSandboxStatus: async (namespace) => {
    if (!k8sClientWrapper.isConnected || !k8sClientWrapper.coreV1Api) {
      return await statusService.getSimulatedSandboxStatus(namespace);
    }

    try {
      // 1. Fetch Pods in Namespace
      const podRes = await k8sClientWrapper.coreV1Api.listNamespacedPod(namespace);
      const podList = podRes.body.items || [];

      const pods = podList.map((pod) => {
        const name = pod.metadata.name;
        const phase = pod.status?.phase || 'Unknown';
        const containerStatuses = pod.status?.containerStatuses || [];
        const restarts = containerStatuses.reduce((acc, c) => acc + (c.restartCount || 0), 0);
        const ready = containerStatuses.every((c) => c.ready === true);

        const containers = containerStatuses.map((c) => ({
          name: c.name,
          state: Object.keys(c.state || {})[0] || 'unknown',
          ready: c.ready,
          restarts: c.restartCount,
        }));

        return {
          name,
          phase,
          ready,
          restarts,
          containers,
          creationTimestamp: pod.metadata.creationTimestamp,
        };
      });

      // 2. Fetch Deployments in Namespace
      const depRes = await k8sClientWrapper.appsV1Api.listNamespacedDeployment(namespace);
      const depList = depRes.body.items || [];

      const deployments = depList.map((dep) => ({
        name: dep.metadata.name,
        desiredReplicas: dep.spec?.replicas || 0,
        availableReplicas: dep.status?.availableReplicas || 0,
        status: dep.status?.availableReplicas === dep.spec?.replicas ? 'Ready' : 'Progressing',
      }));

      // 3. Fetch Services in Namespace
      const svcRes = await k8sClientWrapper.coreV1Api.listNamespacedService(namespace);
      const svcList = svcRes.body.items || [];

      const services = svcList.map((svc) => ({
        name: svc.metadata.name,
        type: svc.spec?.type || 'ClusterIP',
        clusterIP: svc.spec?.clusterIP || 'None',
        ports: (svc.spec?.ports || []).map((p) => ({
          port: p.port,
          targetPort: p.targetPort,
          protocol: p.protocol,
        })),
      }));

      // 4. Fetch Events in Namespace
      const eventRes = await k8sClientWrapper.coreV1Api.listNamespacedEvent(namespace);
      const eventList = eventRes.body.items || [];

      const events = eventList.slice(0, 10).map((evt) => ({
        type: evt.type || 'Normal',
        reason: evt.reason || 'Event',
        message: evt.message || '',
        timestamp: evt.lastTimestamp || evt.eventTime || evt.metadata.creationTimestamp,
      }));

      // Compute overall status
      let overallStatus = 'running';
      if (pods.some((p) => p.phase === 'Failed' || p.containers.some((c) => c.state === 'waiting'))) {
        overallStatus = 'failed';
      } else if (pods.some((p) => p.phase === 'Pending' || p.phase === 'Unknown')) {
        overallStatus = 'deploying';
      } else if (pods.length === 0 && deployments.length === 0) {
        overallStatus = 'stopped';
      }

      return {
        namespace,
        namespaceStatus: 'Active',
        overallStatus,
        deploymentsCount: deployments.length,
        servicesCount: services.length,
        podsCount: pods.length,
        deployments,
        services,
        pods,
        events,
      };
    } catch (err) {
      console.error(`[Status Engine] Error inspecting namespace ${namespace}:`, err.message);
      return {
        namespace,
        namespaceStatus: 'Terminating or Missing',
        overallStatus: 'stopped',
        deploymentsCount: 0,
        servicesCount: 0,
        podsCount: 0,
        deployments: [],
        services: [],
        pods: [],
        events: [],
      };
    }
  },
};

export default statusService;
