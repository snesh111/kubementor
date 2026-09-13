import k8sClientWrapper from './k8sClient.js';
import k8s from '@kubernetes/client-node';

export const namespaceService = {
  /**
   * Generate deterministic, DNS-compliant Kubernetes sandbox namespace name
   * @param {string} userId
   * @param {string} projectId
   * @returns {string} Namespace name (e.g. kubementor-u66a12-p66b34)
   */
  generateNamespaceName: (userId, projectId) => {
    const shortUser = userId.toString().slice(-6).toLowerCase().replace(/[^a-z0-9]/g, '');
    const shortProject = projectId.toString().slice(-6).toLowerCase().replace(/[^a-z0-9]/g, '');
    return `kubementor-u${shortUser}-p${shortProject}`;
  },

  /**
   * Ensure the sandbox namespace exists in Kubernetes
   */
  ensureNamespace: async (namespaceName) => {
    if (!k8sClientWrapper.isConnected || !k8sClientWrapper.coreV1Api) {
      console.log(`[Namespace Engine] Simulated namespace creation: ${namespaceName}`);
      return { created: true, simulated: true, namespace: namespaceName };
    }

    try {
      // Check if namespace already exists
      await k8sClientWrapper.coreV1Api.readNamespace(namespaceName);
      console.log(`[Namespace Engine] Namespace '${namespaceName}' already exists.`);
      return { created: false, existing: true, namespace: namespaceName };
    } catch (err) {
      if (err.response && err.response.statusCode === 404) {
        try {
          // Create new sandbox namespace
          const nsManifest = {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
              name: namespaceName,
              labels: {
                'app.kubernetes.io/managed-by': 'kubementor',
                'kubementor.io/sandbox': 'true',
              },
            },
          };

          await k8sClientWrapper.coreV1Api.createNamespace(nsManifest);
          console.log(`[Namespace Engine] Created sandbox namespace '${namespaceName}'.`);

          // Apply basic ResourceQuota to prevent cluster resource starvation
          try {
            const quotaManifest = {
              apiVersion: 'v1',
              kind: 'ResourceQuota',
              metadata: {
                name: 'sandbox-quota',
                namespace: namespaceName,
              },
              spec: {
                hard: {
                  'requests.cpu': '2',
                  'requests.memory': '2Gi',
                  'limits.cpu': '4',
                  'limits.memory': '4Gi',
                  pods: '10',
                },
              },
            };
            await k8sClientWrapper.coreV1Api.createNamespacedResourceQuota(namespaceName, quotaManifest);
          } catch (qErr) {
            console.warn('[Namespace Engine] Quota application warning:', qErr.message);
          }

          return { created: true, namespace: namespaceName };
        } catch (createErr) {
          console.warn('[Namespace Engine] Could not create namespace on cluster, switching to simulation:', createErr.message);
          k8sClientWrapper.isConnected = false;
          return { created: true, simulated: true, namespace: namespaceName };
        }
      }

      console.warn(`[Namespace Engine] Cluster unreachable (${err.message}). Activating sandbox simulation.`);
      k8sClientWrapper.isConnected = false;
      return { created: true, simulated: true, namespace: namespaceName };
    }
  },

  /**
   * Delete sandbox namespace and all contained resources
   */
  deleteNamespace: async (namespaceName) => {
    if (!k8sClientWrapper.isConnected || !k8sClientWrapper.coreV1Api) {
      console.log(`[Namespace Engine] Simulated namespace deletion: ${namespaceName}`);
      return { deleted: true, simulated: true };
    }

    try {
      await k8sClientWrapper.coreV1Api.deleteNamespace(namespaceName);
      console.log(`[Namespace Engine] Deleted sandbox namespace '${namespaceName}'.`);
      return { deleted: true };
    } catch (err) {
      if (err.response && err.response.statusCode === 404) {
        return { deleted: true, alreadyMissing: true };
      }
      throw err;
    }
  },

  deleteSandboxNamespace: async (namespaceName) => {
    return await namespaceService.deleteNamespace(namespaceName);
  },
};

export default namespaceService;
