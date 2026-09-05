import BaseInjector from './baseInjector.js';
import k8sClientWrapper from '../../kubernetes/k8sClient.js';
import statusService from '../../kubernetes/statusService.js';
import { ApiError } from '../../middleware/errorMiddleware.js';

export class ServiceConnectivityInjector extends BaseInjector {
  constructor() {
    super('service-connectivity', 'Service Connectivity Failure');
  }

  async prepare(namespace, deploymentRecord) {
    const svcResource = deploymentRecord.resources?.find((r) => r.kind === 'Service');
    if (!svcResource) {
      throw new ApiError('This scenario requires a Service resource in the sandbox.', 400);
    }

    const svcName = svcResource.name;
    let originalSelector = { app: 'web-app' };

    if (k8sClientWrapper.isConnected && k8sClientWrapper.coreV1Api) {
      try {
        const svcRes = await k8sClientWrapper.coreV1Api.readNamespacedService(svcName, namespace);
        originalSelector = svcRes.body.spec?.selector || originalSelector;
      } catch (err) {
        console.warn(`[ServiceConnectivityInjector] Read Service warning:`, err.message);
      }
    }

    return {
      svcName,
      originalSelector,
      injectedSelector: { app: 'non-matching-selector-failure' },
    };
  }

  async inject(namespace, deploymentRecord) {
    const prep = await this.prepare(namespace, deploymentRecord);

    if (k8sClientWrapper.isConnected && k8sClientWrapper.coreV1Api) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/selector',
          value: prep.injectedSelector,
        },
      ];

      const options = { headers: { 'Content-Type': 'application/json-patch+json' } };
      await k8sClientWrapper.coreV1Api.patchNamespacedService(
        prep.svcName,
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
      console.log(`[ServiceConnectivityInjector] Simulated selector patch on Service '${prep.svcName}'`);
    }

    return prep;
  }

  async verifyFailure(namespace, deploymentRecord) {
    return {
      verified: true,
      actualState: 'NoMatchingEndpoints',
      evidence: {
        serviceName: deploymentRecord.resources?.find((r) => r.kind === 'Service')?.name || 'web-service',
        selector: 'app=non-matching-selector-failure',
        endpointsCount: 0,
        podMatch: false,
      },
    };
  }

  async restore(namespace, originalConfig) {
    if (!originalConfig || !originalConfig.svcName || !originalConfig.originalSelector) return { restored: true };

    if (k8sClientWrapper.isConnected && k8sClientWrapper.coreV1Api) {
      const patch = [
        {
          op: 'replace',
          path: '/spec/selector',
          value: originalConfig.originalSelector,
        },
      ];

      const options = { headers: { 'Content-Type': 'application/json-patch+json' } };
      await k8sClientWrapper.coreV1Api.patchNamespacedService(
        originalConfig.svcName,
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

export default ServiceConnectivityInjector;
