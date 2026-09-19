import k8sClientWrapper from './k8sClient.js';
import { parseAndEnforceSandboxManifests } from './manifestParser.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';

export const deploymentService = {
  /**
   * Parse, enforce sandbox rules, and deploy project file manifests to sandbox namespace
   * @param {string} namespace - Sandbox namespace
   * @param {Array<Object>} files - Array of ProjectFile documents
   * @returns {Array<Object>} Resource deployment results
   */
  deployManifests: async (namespace, files) => {
    if (!Array.isArray(files) || files.length === 0) {
      return [];
    }

    const combinedContent = files.map((f) => f.content).join('\n---\n');
    const parseResult = parseAndEnforceSandboxManifests(combinedContent, namespace);
    if (!parseResult.valid) {
      throw new Error(parseResult.error);
    }

    // In simulation mode, evaluate if user fix resolved the failure scenario
    if (!k8sClientWrapper.isConnected || !k8sClientWrapper.coreV1Api) {
      try {
        const depDoc = parseResult.documents.find((d) => d.kind === 'Deployment');
        const container = depDoc?.spec?.template?.spec?.containers?.[0];
        const commandStr = JSON.stringify(container?.command || []) + JSON.stringify(container?.args || []);
        const isExitCommand = commandStr.includes('exit 1') || commandStr.includes('exit 2') || commandStr.includes('exit');
        const isBadImage = (container?.image || '').includes('nonexistent') || (container?.image || '').includes('invalid');

        const deploymentRecord = await DeploymentRecord.findOne({ namespace });
        if (deploymentRecord) {
          const activeAttempt = await ScenarioAttempt.findOne({
            $or: [{ deployment: deploymentRecord._id }, { project: deploymentRecord.project }],
            status: { $in: ['active', 'injecting'] },
          }).sort({ createdAt: -1 });

          if (activeAttempt) {
            let isFixed = false;
            if (activeAttempt.scenarioId === 'crash-loop-backoff' && !isExitCommand) {
              isFixed = true;
            } else if (activeAttempt.scenarioId === 'image-pull-backoff' && !isBadImage) {
              isFixed = true;
            } else if (activeAttempt.scenarioId === 'oom-killed' && (container?.resources?.limits?.memory || '256Mi') !== '16Mi') {
              isFixed = true;
            } else if (activeAttempt.scenarioId === 'missing-configmap' && parseResult.documents.some((d) => d.kind === 'ConfigMap' && (d.metadata?.name === 'app-config' || !d.metadata?.name))) {
              isFixed = true;
            } else if (activeAttempt.scenarioId === 'service-connectivity') {
              const svcDoc = parseResult.documents.find((d) => d.kind === 'Service');
              const depLabels = depDoc?.spec?.template?.metadata?.labels || { app: 'web-app' };
              const svcSelector = svcDoc?.spec?.selector || {};
              if (Object.keys(svcSelector).length > 0 && Object.entries(svcSelector).every(([k, v]) => depLabels[k] === v)) {
                isFixed = true;
              }
            } else if (activeAttempt.scenarioId === 'ingress-tls-failure') {
              const ingDoc = parseResult.documents.find((d) => d.kind === 'Ingress');
              const tlsSecret = ingDoc?.spec?.tls?.[0]?.secretName;
              if (tlsSecret && tlsSecret === 'example-tls-secret') {
                isFixed = true;
              }
            }

            if (isFixed) {
              activeAttempt.restorationDetails = { fixApplied: true };
              await activeAttempt.save();
            } else {
              activeAttempt.restorationDetails = null;
              await activeAttempt.save();
            }
          }
        }
      } catch (simErr) {
        console.warn('[Deployment Engine] Simulated validation check error:', simErr.message);
      }
    }

    return await deploymentService.applyManifestDocuments(parseResult.documents, namespace);
  },

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
          replicas: doc.spec?.replicas ?? 1,
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
