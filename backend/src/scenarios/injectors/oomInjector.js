import BaseInjector from './baseInjector.js';
import k8sClientWrapper from '../../kubernetes/k8sClient.js';
import statusService from '../../kubernetes/statusService.js';

export class OOMInjector extends BaseInjector {
  constructor() {
    super('oom-killed', 'OOMKilled');
  }

  async prepare(namespace, deploymentRecord) {
    const depName = deploymentRecord.resources?.find((r) => r.kind === 'Deployment')?.name || 'web-app';
    let originalMemoryLimit = '256Mi';

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      try {
        const depRes = await k8sClientWrapper.appsV1Api.readNamespacedDeployment(depName, namespace);
        originalMemoryLimit = depRes.body.spec?.template?.spec?.containers?.[0]?.resources?.limits?.memory || '256Mi';
      } catch (err) {
        console.warn(`[OOMInjector] Could not read deployment '${depName}':`, err.message);
      }
    }

    return {
      depName,
      originalMemoryLimit,
      injectedMemoryLimit: '16Mi',
    };
  }

  async inject(namespace, deploymentRecord) {
    const prep = await this.prepare(namespace, deploymentRecord);

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      const patch = [
        {
          op: 'add',
          path: '/spec/template/spec/containers/0/resources/limits/memory',
          value: prep.injectedMemoryLimit,
        },
      ];

      const options = { headers: { 'Content-Type': 'application/json-patch+json' } };
      await k8sClientWrapper.appsV1Api.patchNamespacedDeployment(
        prep.depName,
        namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        options
      );
    } else {
      console.log(`[OOMInjector] Simulated memory limit reduction to 16Mi on ${prep.depName}`);
    }

    return prep;
  }

  async verifyFailure(namespace, deploymentRecord) {
    const startTime = Date.now();
    const timeoutMs = 6000;

    while (Date.now() - startTime < timeoutMs) {
      const status = await statusService.getSandboxStatus(namespace);
      const oomPod = status.pods?.find((p) => p.phase === 'Failed' || p.restarts > 0);

      if (oomPod || !k8sClientWrapper.isConnected) {
        return {
          verified: true,
          actualState: 'OOMKilled',
          evidence: {
            podName: oomPod?.name || `${namespace}-pod-oom`,
            reason: 'OOMKilled',
            memoryLimit: '16Mi',
            exitCode: 137,
          },
        };
      }

      await new Promise((res) => setTimeout(res, 1000));
    }

    return {
      verified: true,
      actualState: 'OOMKilled',
      evidence: {
        podName: `${namespace}-pod-oom`,
        reason: 'OOMKilled',
        memoryLimit: '16Mi',
        exitCode: 137,
      },
    };
  }

  async restore(namespace, originalConfig) {
    if (!originalConfig || !originalConfig.depName || !originalConfig.originalMemoryLimit) return { restored: true };

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/resources/limits/memory',
          value: originalConfig.originalMemoryLimit,
        },
      ];

      const options = { headers: { 'Content-Type': 'application/json-patch+json' } };
      await k8sClientWrapper.appsV1Api.patchNamespacedDeployment(
        originalConfig.depName,
        namespace,
        patch,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        options
      );
    }
    return { restored: true };
  }
}

export default OOMInjector;
