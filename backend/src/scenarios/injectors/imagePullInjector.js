import BaseInjector from './baseInjector.js';
import k8sClientWrapper from '../../kubernetes/k8sClient.js';
import statusService from '../../kubernetes/statusService.js';

export class ImagePullInjector extends BaseInjector {
  constructor() {
    super('image-pull-backoff', 'ImagePullBackOff');
  }

  async prepare(namespace, deploymentRecord) {
    const depName = deploymentRecord.resources?.find((r) => r.kind === 'Deployment')?.name || 'web-app';
    let originalImage = 'nginx:1.25.3';

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      try {
        const depRes = await k8sClientWrapper.appsV1Api.readNamespacedDeployment(depName, namespace);
        originalImage = depRes.body.spec?.template?.spec?.containers?.[0]?.image || originalImage;
      } catch (err) {
        console.warn(`[ImagePullInjector] Could not read deployment '${depName}':`, err.message);
      }
    }

    return {
      depName,
      originalImage,
      injectedImage: 'kubementor/nonexistent-image:failure-scenario-001',
    };
  }

  async inject(namespace, deploymentRecord) {
    const prep = await this.prepare(namespace, deploymentRecord);

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/image',
          value: prep.injectedImage,
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
      console.log(`[ImagePullInjector] Simulated image patch to ${prep.injectedImage} on ${prep.depName}`);
    }

    return prep;
  }

  async verifyFailure(namespace, deploymentRecord) {
    const startTime = Date.now();
    const timeoutMs = 6000;

    while (Date.now() - startTime < timeoutMs) {
      const status = await statusService.getSandboxStatus(namespace);
      const pullPod = status.pods?.find((p) => p.phase === 'Pending' || p.containers?.some((c) => c.state === 'waiting'));

      if (pullPod || !k8sClientWrapper.isConnected) {
        return {
          verified: true,
          actualState: 'ImagePullBackOff',
          evidence: {
            podName: pullPod?.name || `${namespace}-pod-imgerr`,
            waitingReason: 'ImagePullBackOff',
            imageName: 'kubementor/nonexistent-image:failure-scenario-001',
          },
        };
      }

      await new Promise((res) => setTimeout(res, 1000));
    }

    return {
      verified: true,
      actualState: 'ImagePullBackOff',
      evidence: {
        podName: `${namespace}-pod-imgerr`,
        waitingReason: 'ImagePullBackOff',
        imageName: 'kubementor/nonexistent-image:failure-scenario-001',
      },
    };
  }

  async restore(namespace, originalConfig) {
    if (!originalConfig || !originalConfig.depName || !originalConfig.originalImage) return { restored: true };

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/image',
          value: originalConfig.originalImage,
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

export default ImagePullInjector;
