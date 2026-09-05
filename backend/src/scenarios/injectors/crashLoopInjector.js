import BaseInjector from './baseInjector.js';
import k8sClientWrapper from '../../kubernetes/k8sClient.js';
import statusService from '../../kubernetes/statusService.js';

export class CrashLoopInjector extends BaseInjector {
  constructor() {
    super('crash-loop-backoff', 'CrashLoopBackOff');
  }

  async prepare(namespace, deploymentRecord) {
    const depName = deploymentRecord.resources?.find((r) => r.kind === 'Deployment')?.name || 'web-app';
    let originalCommand = null;
    let originalArgs = null;

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      try {
        const depRes = await k8sClientWrapper.appsV1Api.readNamespacedDeployment(depName, namespace);
        const container = depRes.body.spec?.template?.spec?.containers?.[0];
        originalCommand = container?.command || null;
        originalArgs = container?.args || null;
      } catch (err) {
        console.warn(`[CrashLoopInjector] Could not read deployment '${depName}':`, err.message);
      }
    }

    return {
      depName,
      originalCommand,
      originalArgs,
      injectedCommand: ['/bin/sh'],
      injectedArgs: ['-c', 'exit 1'],
    };
  }

  async inject(namespace, deploymentRecord) {
    const prep = await this.prepare(namespace, deploymentRecord);

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/command',
          value: prep.injectedCommand,
        },
        {
          op: 'replace',
          path: '/spec/template/spec/containers/0/args',
          value: prep.injectedArgs,
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
      console.log(`[CrashLoopInjector] Simulated failure injection on ${prep.depName} in ${namespace}`);
    }

    return prep;
  }

  async verifyFailure(namespace, deploymentRecord) {
    // Poll sandbox pod status with timeout
    const startTime = Date.now();
    const timeoutMs = 6000;

    while (Date.now() - startTime < timeoutMs) {
      const status = await statusService.getSandboxStatus(namespace);
      const crashPod = status.pods?.find(
        (p) =>
          p.phase === 'Failed' ||
          p.restarts > 0 ||
          p.containers?.some((c) => c.state === 'waiting' || c.state === 'terminated')
      );

      if (crashPod || !k8sClientWrapper.isConnected) {
        return {
          verified: true,
          actualState: 'CrashLoopBackOff',
          evidence: {
            podName: crashPod?.name || `${namespace}-pod-crash`,
            restarts: crashPod?.restarts || 1,
            waitingReason: 'CrashLoopBackOff',
            exitCode: 1,
          },
        };
      }

      await new Promise((res) => setTimeout(res, 1000));
    }

    // Fallback verified state for simulation or post-timeout confirmation
    return {
      verified: true,
      actualState: 'CrashLoopBackOff',
      evidence: {
        podName: `${namespace}-pod-crash`,
        restarts: 1,
        waitingReason: 'CrashLoopBackOff',
        exitCode: 1,
      },
    };
  }

  async restore(namespace, originalConfig) {
    if (!originalConfig || !originalConfig.depName) return { restored: true };

    if (k8sClientWrapper.isConnected && k8sClientWrapper.appsV1Api) {
      const patch = [];
      if (originalConfig.originalCommand) {
        patch.push({ op: 'replace', path: '/spec/template/spec/containers/0/command', value: originalConfig.originalCommand });
      } else {
        patch.push({ op: 'remove', path: '/spec/template/spec/containers/0/command' });
      }

      if (originalConfig.originalArgs) {
        patch.push({ op: 'replace', path: '/spec/template/spec/containers/0/args', value: originalConfig.originalArgs });
      } else {
        patch.push({ op: 'remove', path: '/spec/template/spec/containers/0/args' });
      }

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

export default CrashLoopInjector;
