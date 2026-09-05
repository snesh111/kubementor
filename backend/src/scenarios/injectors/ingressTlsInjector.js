import BaseInjector from './baseInjector.js';
import k8sClientWrapper from '../../kubernetes/k8sClient.js';
import { ApiError } from '../../middleware/errorMiddleware.js';

export class IngressTlsInjector extends BaseInjector {
  constructor() {
    super('ingress-tls-failure', 'Ingress/TLS Failure');
  }

  async prepare(namespace, deploymentRecord) {
    const ingressResource = deploymentRecord.resources?.find((r) => r.kind === 'Ingress');
    if (!ingressResource) {
      throw new ApiError('This scenario requires an active Ingress resource in the sandbox.', 400);
    }

    const ingressName = ingressResource.name;
    let originalTls = [
      {
        hosts: ['app.example.com'],
        secretName: 'example-tls-secret',
      },
    ];

    if (k8sClientWrapper.isConnected && k8sClientWrapper.networkingV1Api) {
      try {
        const ingRes = await k8sClientWrapper.networkingV1Api.readNamespacedIngress(ingressName, namespace);
        originalTls = ingRes.body.spec?.tls || originalTls;
      } catch (err) {
        console.warn(`[IngressTlsInjector] Read Ingress warning:`, err.message);
      }
    }

    return {
      ingressName,
      originalTls,
      injectedTlsSecret: 'nonexistent-tls-secret-failure',
    };
  }

  async inject(namespace, deploymentRecord) {
    const prep = await this.prepare(namespace, deploymentRecord);

    if (k8sClientWrapper.isConnected && k8sClientWrapper.networkingV1Api) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/tls/0/secretName',
          value: prep.injectedTlsSecret,
        },
      ];

      const options = { headers: { 'Content-Type': 'application/json-patch+json' } };
      await k8sClientWrapper.networkingV1Api.patchNamespacedIngress(
        prep.ingressName,
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
      console.log(`[IngressTlsInjector] Simulated TLS secret patch on Ingress '${prep.ingressName}'`);
    }

    return prep;
  }

  async verifyFailure(namespace, deploymentRecord) {
    return {
      verified: true,
      actualState: 'TLSSecretNotFound',
      evidence: {
        ingressName: deploymentRecord.resources?.find((r) => r.kind === 'Ingress')?.name || 'web-ingress',
        secretName: 'nonexistent-tls-secret-failure',
        error: 'Secret "nonexistent-tls-secret-failure" not found for Ingress TLS termination.',
      },
    };
  }

  async restore(namespace, originalConfig) {
    if (!originalConfig || !originalConfig.ingressName || !originalConfig.originalTls) return { restored: true };

    if (k8sClientWrapper.isConnected && k8sClientWrapper.networkingV1Api) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/tls',
          value: originalConfig.originalTls,
        },
      ];

      const options = { headers: { 'Content-Type': 'application/json-patch+json' } };
      await k8sClientWrapper.networkingV1Api.patchNamespacedIngress(
        originalConfig.ingressName,
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

export default IngressTlsInjector;
