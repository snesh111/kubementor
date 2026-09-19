import { sanitizeContextData } from './contextSanitizer.js';

export const buildStructuredContext = ({
  projectId,
  deploymentId,
  scenarioAttemptId,
  scenarioContext,
  namespaceContext,
  deploymentContext,
  podContext,
  logContext,
  eventContext,
  serviceContext,
  ingressContext,
  configMapContext,
  manifestDiff = [],
}) => {
  // Determine overall observed failure state
  const firstCrashPod = podContext.find(
    (p) => p.phase === 'Failed' || p.restarts > 0 || p.containers?.some((c) => c.state === 'waiting' || c.ready === false)
  );
  const isServiceOrIngressScenario = scenarioContext?.id === 'service-connectivity' || scenarioContext?.id === 'ingress-tls-failure';
  const isFixed = scenarioContext?.isFixed === true;
  const isPodHealthy = podContext.length > 0 && podContext.every((p) => p.ready === true && p.phase === 'Running');
  const allPodsHealthy = isFixed || (!isServiceOrIngressScenario && isPodHealthy);

  const observedFailure = {
    status: allPodsHealthy ? 'Running' : (firstCrashPod?.containers?.[0]?.reason || scenarioContext?.expectedFailure || 'Failed'),
    reason: allPodsHealthy ? 'WorkloadHealthy' : (firstCrashPod?.containers?.[0]?.reason || scenarioContext?.expectedFailure || 'Unknown'),
    affectedResource: `Deployment/${deploymentContext.name || 'web-app'}`,
    podName: firstCrashPod?.name || podContext[0]?.name || 'N/A',
    restartCount: firstCrashPod?.restarts || 0,
  };

  const rawContext = {
    contextVersion: '1.0',
    metadata: {
      projectId: projectId.toString(),
      deploymentId: deploymentId.toString(),
      scenarioAttemptId: scenarioAttemptId.toString(),
      generatedAt: new Date().toISOString(),
    },
    scenario: scenarioContext,
    cluster: namespaceContext,
    deployment: deploymentContext,
    pods: podContext,
    logs: logContext,
    events: eventContext,
    services: serviceContext,
    ingresses: ingressContext,
    configMaps: configMapContext,
    manifestDiff,
    observedFailure,
  };

  // Pass through sanitizer to redact passwords, tokens, API keys
  return sanitizeContextData(rawContext);
};

/**
 * Compute difference between original configuration and injected sandbox configuration
 */
export const computeManifestDiff = (injectionDetails) => {
  if (!injectionDetails) return [];

  const diffs = [];

  if (injectionDetails.injectedImage) {
    diffs.push({
      field: 'spec.template.spec.containers[0].image',
      before: injectionDetails.originalImage || 'nginx:1.25.3',
      after: injectionDetails.injectedImage,
    });
  }

  if (injectionDetails.injectedCommand) {
    diffs.push({
      field: 'spec.template.spec.containers[0].command',
      before: injectionDetails.originalCommand ? JSON.stringify(injectionDetails.originalCommand) : 'null',
      after: JSON.stringify(injectionDetails.injectedCommand),
    });
  }

  if (injectionDetails.injectedMemoryLimit) {
    diffs.push({
      field: 'spec.template.spec.containers[0].resources.limits.memory',
      before: injectionDetails.originalMemoryLimit || '256Mi',
      after: injectionDetails.injectedMemoryLimit,
    });
  }

  if (injectionDetails.cmName) {
    diffs.push({
      field: 'spec.template.spec.volumes[0].configMap.name',
      before: injectionDetails.cmName,
      after: '[REMOVED/DISCONNECTED]',
    });
  }

  if (injectionDetails.injectedSelector) {
    diffs.push({
      field: 'spec.selector',
      before: JSON.stringify(injectionDetails.originalSelector || { app: 'web-app' }),
      after: JSON.stringify(injectionDetails.injectedSelector),
    });
  }

  if (injectionDetails.injectedTlsSecret) {
    diffs.push({
      field: 'spec.tls[0].secretName',
      before: injectionDetails.originalTls?.[0]?.secretName || 'example-tls-secret',
      after: injectionDetails.injectedTlsSecret,
    });
  }

  return diffs;
};

export default { buildStructuredContext, computeManifestDiff };
