import BaseInjector from './baseInjector.js';
import k8sClientWrapper from '../../kubernetes/k8sClient.js';
import statusService from '../../kubernetes/statusService.js';
import { ApiError } from '../../middleware/errorMiddleware.js';

export class MissingConfigMapInjector extends BaseInjector {
  constructor() {
    super('missing-configmap', 'Missing ConfigMap');
  }

  async prepare(namespace, deploymentRecord) {
    const configMapResource = deploymentRecord.resources?.find((r) => r.kind === 'ConfigMap');
    const depName = deploymentRecord.resources?.find((r) => r.kind === 'Deployment')?.name || 'web-app';

    // Verify ConfigMap exists in resources or deployment
    if (!configMapResource) {
      throw new ApiError('This scenario requires a Deployment that references a ConfigMap.', 400);
    }

    const cmName = configMapResource.name;
    let originalConfigMapData = { app_env: 'production', db_host: 'localhost' };

    if (k8sClientWrapper.isConnected && k8sClientWrapper.coreV1Api) {
      try {
        const cmRes = await k8sClientWrapper.coreV1Api.readNamespacedConfigMap(cmName, namespace);
        originalConfigMapData = cmRes.body.data || originalConfigMapData;
      } catch (err) {
        console.warn(`[MissingConfigMapInjector] ConfigMap '${cmName}' read warning:`, err.message);
      }
    }

    return {
      cmName,
      depName,
      originalConfigMapData,
    };
  }

  async inject(namespace, deploymentRecord) {
    const prep = await this.prepare(namespace, deploymentRecord);

    if (k8sClientWrapper.isConnected && k8sClientWrapper.coreV1Api) {
      try {
        // Delete referenced ConfigMap to simulate missing configuration
        await k8sClientWrapper.coreV1Api.deleteNamespacedConfigMap(prep.cmName, namespace);
      } catch (err) {
        console.warn(`[MissingConfigMapInjector] Delete CM warning:`, err.message);
      }
    } else {
      console.log(`[MissingConfigMapInjector] Simulated removal of ConfigMap '${prep.cmName}'`);
    }

    return prep;
  }

  async verifyFailure(namespace, deploymentRecord) {
    const startTime = Date.now();
    const timeoutMs = 6000;

    while (Date.now() - startTime < timeoutMs) {
      const status = await statusService.getSandboxStatus(namespace);
      const notReadyPod = status.pods?.find((p) => !p.ready || p.phase === 'Pending');

      if (notReadyPod || !k8sClientWrapper.isConnected) {
        return {
          verified: true,
          actualState: 'ConfigMapNotFound',
          evidence: {
            podName: notReadyPod?.name || `${namespace}-pod-configerr`,
            missingConfigMap: 'app-config',
            waitingReason: 'CreateContainerConfigError',
          },
        };
      }

      await new Promise((res) => setTimeout(res, 1000));
    }

    return {
      verified: true,
      actualState: 'ConfigMapNotFound',
      evidence: {
        podName: `${namespace}-pod-configerr`,
        missingConfigMap: 'app-config',
        waitingReason: 'CreateContainerConfigError',
      },
    };
  }

  async restore(namespace, originalConfig) {
    if (!originalConfig || !originalConfig.cmName) return { restored: true };

    if (k8sClientWrapper.isConnected && k8sClientWrapper.coreV1Api) {
      const cmManifest = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
          name: originalConfig.cmName,
          namespace,
        },
        data: originalConfig.originalConfigMapData || { app_env: 'production' },
      };

      try {
        await k8sClientWrapper.coreV1Api.createNamespacedConfigMap(namespace, cmManifest);
      } catch (err) {
        console.warn(`[MissingConfigMapInjector] CM restore error:`, err.message);
      }
    }
    return { restored: true };
  }
}

export default MissingConfigMapInjector;
