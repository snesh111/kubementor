import k8sClientWrapper from './k8sClient.js';

export const deploymentService = {
  /**
   * Apply Kubernetes manifest documents to the sandbox namespace
   * @param {Array<Object>} documents - Enforced K8s resource objects
   * @param {string} namespace - Sandbox namespace
   * @returns {Array<Object>} Resource deployment results [{ kind, name, status }]
   */
  applyManifestDocuments: async (documents, namespace) => {
    const resourceResults = [];

    // Sort documents by deployment order: ConfigMap/Secret -> Service -> Deployment -> Ingress
    const orderPriority = { ConfigMap: 1, Secret: 1, Service: 2, Deployment: 3, Ingress: 4 };
    const sortedDocs = [...documents].sort((a, b) => {
      const pA = orderPriority[a.kind] || 5;
      const pB = orderPriority[b.kind] || 5;
      return pA - pB;
    });

    for (const doc of sortedDocs) {
      const kind = doc.kind;
      const name = doc.metadata?.name || 'unnamed';

      if (!k8sClientWrapper.isConnected || !k8sClientWrapper.coreV1Api) {
        console.log(`[Deployment Engine] Simulated applying ${kind}/${name} in ${namespace}`);
        resourceResults.push({
          kind,
          name,
          status: 'Applied (Simulated)',
        });
        continue;
      }

      try {
        switch (kind) {
          case 'ConfigMap':
            try {
              await k8sClientWrapper.coreV1Api.replaceNamespacedConfigMap(name, namespace, doc);
            } catch (err) {
              await k8sClientWrapper.coreV1Api.createNamespacedConfigMap(namespace, doc);
            }
            break;

          case 'Secret':
            try {
              await k8sClientWrapper.coreV1Api.replaceNamespacedSecret(name, namespace, doc);
            } catch (err) {
              await k8sClientWrapper.coreV1Api.createNamespacedSecret(namespace, doc);
            }
            break;

          case 'Service':
            try {
              await k8sClientWrapper.coreV1Api.replaceNamespacedService(name, namespace, doc);
            } catch (err) {
              await k8sClientWrapper.coreV1Api.createNamespacedService(namespace, doc);
            }
            break;

          case 'Deployment':
            try {
              await k8sClientWrapper.appsV1Api.replaceNamespacedDeployment(name, namespace, doc);
            } catch (err) {
              await k8sClientWrapper.appsV1Api.createNamespacedDeployment(namespace, doc);
            }
            break;

          case 'Ingress':
            try {
              await k8sClientWrapper.networkingV1Api.replaceNamespacedIngress(name, namespace, doc);
            } catch (err) {
              await k8sClientWrapper.networkingV1Api.createNamespacedIngress(namespace, doc);
            }
            break;

          default:
            break;
        }

        resourceResults.push({ kind, name, status: 'Applied' });
      } catch (err) {
        console.error(`[Deployment Engine] Failed to apply ${kind}/${name}:`, err.message);
        throw new Error(`Failed to apply ${kind}/${name}: ${err.message}`);
      }
    }

    return resourceResults;
  },
};

export default deploymentService;
