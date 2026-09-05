export const validationRules = {
  /**
   * Evaluate solution for a scenario attempt using fresh ContextSnapshot
   */
  evaluateScenarioSolution: (scenarioId, beforeSnapshot, afterSnapshot) => {
    const aCtx = afterSnapshot?.context || {};
    const pod = aCtx.pods?.[0] || {};
    const container = pod.containers?.[0] || {};
    const dep = aCtx.deployment || {};
    const events = aCtx.events || [];
    const services = aCtx.services || [];
    const ingresses = aCtx.ingresses || [];
    const configMaps = aCtx.configMaps || [];

    switch (scenarioId) {
      case 'crash-loop-backoff':
        return evaluateCrashLoopBackOff(pod, container, dep, events);
      case 'image-pull-backoff':
        return evaluateImagePullBackOff(pod, container, dep, events);
      case 'oom-killed':
        return evaluateOOMKilled(pod, container, dep, events);
      case 'missing-configmap':
        return evaluateMissingConfigMap(pod, container, configMaps, events);
      case 'service-connectivity':
        return evaluateServiceConnectivity(pod, services);
      case 'ingress-tls-failure':
        return evaluateIngressTlsFailure(pod, services, ingresses);
      default:
        return evaluateGeneric(pod);
    }
  },
};

const evaluateCrashLoopBackOff = (pod, container, dep, events) => {
  const isReady = pod.ready ? true : false;
  const isRunning = pod.phase === 'Running';
  const isCrashLoop = container.state === 'waiting' && container.reason === 'CrashLoopBackOff';
  const availableReplicas = dep.availableReplicas || 0;

  const checks = [
    {
      name: 'Pod Ready State',
      expected: true,
      actual: isReady,
      status: isReady ? 'PASS' : 'FAIL',
      description: 'Verifies whether pod has passed readiness probes and is serving traffic.',
    },
    {
      name: 'CrashLoopBackOff Condition',
      expected: false,
      actual: isCrashLoop,
      status: !isCrashLoop ? 'PASS' : 'FAIL',
      description: 'Verifies that container is not in CrashLoopBackOff restart loop.',
    },
    {
      name: 'Deployment Available Replicas',
      expected: 1,
      actual: availableReplicas,
      status: availableReplicas >= 1 ? 'PASS' : 'FAIL',
      description: 'Verifies that desired replicas are available and healthy.',
    },
  ];

  const passCount = checks.filter((c) => c.status === 'PASS').length;

  let status = 'FAIL';
  let summary = 'The workload remains in CrashLoopBackOff state and pod is not ready.';

  if (passCount === 3) {
    status = 'PASS';
    summary = 'Workload successfully recovered! Pod is Running, Ready, and CrashLoopBackOff is resolved.';
  } else if (isRunning && !isCrashLoop) {
    status = 'PARTIAL';
    summary = 'Pod is Running and no longer in CrashLoopBackOff, but is not yet fully Ready.';
  }

  return { status, summary, checks };
};

const evaluateImagePullBackOff = (pod, container, dep, events) => {
  const isReady = pod.ready ? true : false;
  const isImagePullError =
    container.reason === 'ImagePullBackOff' ||
    container.reason === 'ErrImagePull' ||
    events.some((e) => e.reason === 'Failed' && e.message?.includes('pull'));

  const checks = [
    {
      name: 'Image Pull Condition',
      expected: false,
      actual: isImagePullError,
      status: !isImagePullError ? 'PASS' : 'FAIL',
      description: 'Verifies that container image was successfully pulled from registry.',
    },
    {
      name: 'Pod Readiness',
      expected: true,
      actual: isReady,
      status: isReady ? 'PASS' : 'FAIL',
      description: 'Verifies that container started cleanly and passed readiness checks.',
    },
  ];

  let status = 'FAIL';
  let summary = 'Container image pull failed. ImagePullBackOff condition persists.';

  if (!isImagePullError && isReady) {
    status = 'PASS';
    summary = 'Image pull failure resolved! Container image was pulled cleanly and Pod is Ready.';
  } else if (!isImagePullError) {
    status = 'PARTIAL';
    summary = 'Image pull error resolved, but container process has not reached Ready state.';
  }

  return { status, summary, checks };
};

const evaluateOOMKilled = (pod, container, dep, events) => {
  const isReady = pod.ready ? true : false;
  const isOOM = container.reason === 'OOMKilled' || events.some((e) => e.reason === 'OOMKilled');
  const exitCode = container.exitCode;

  const checks = [
    {
      name: 'OOMKilled Condition',
      expected: false,
      actual: isOOM,
      status: !isOOM ? 'PASS' : 'FAIL',
      description: 'Verifies that container memory consumption stays within defined limits.',
    },
    {
      name: 'Exit Code 137 Check',
      expected: 0,
      actual: exitCode || 0,
      status: exitCode !== 137 ? 'PASS' : 'FAIL',
      description: 'Verifies that container exit code is clean (0) rather than SIGKILL (137).',
    },
    {
      name: 'Pod Readiness',
      expected: true,
      actual: isReady,
      status: isReady ? 'PASS' : 'FAIL',
      description: 'Verifies pod is Running and Ready.',
    },
  ];

  let status = 'FAIL';
  let summary = 'Container memory limits are still insufficient. OOMKilled condition persists.';

  if (!isOOM && isReady) {
    status = 'PASS';
    summary = 'Memory limit resolution verified! Pod is Running cleanly with sufficient memory limits.';
  } else if (!isOOM) {
    status = 'PARTIAL';
    summary = 'OOMKilled termination resolved, but pod readiness stability is still building.';
  }

  return { status, summary, checks };
};

const evaluateMissingConfigMap = (pod, container, configMaps, events) => {
  const isReady = pod.ready ? true : false;
  const hasConfigError = container.reason === 'CreateContainerConfigError';
  const configMapExists = configMaps.some((cm) => cm.exists);

  const checks = [
    {
      name: 'ConfigMap Existence',
      expected: true,
      actual: configMapExists,
      status: configMapExists ? 'PASS' : 'FAIL',
      description: 'Verifies that referenced ConfigMap resource exists in sandbox namespace.',
    },
    {
      name: 'CreateContainerConfigError Check',
      expected: false,
      actual: hasConfigError,
      status: !hasConfigError ? 'PASS' : 'FAIL',
      description: 'Verifies container configuration loaded without error.',
    },
    {
      name: 'Pod Readiness',
      expected: true,
      actual: isReady,
      status: isReady ? 'PASS' : 'FAIL',
      description: 'Verifies pod started and passed readiness probes.',
    },
  ];

  let status = 'FAIL';
  let summary = 'ConfigMap is still missing or container failed to mount required keys.';

  if (configMapExists && !hasConfigError && isReady) {
    status = 'PASS';
    summary = 'Missing ConfigMap scenario resolved! ConfigMap exists, container mounted config, and Pod is Ready.';
  } else if (configMapExists && !hasConfigError) {
    status = 'PARTIAL';
    summary = 'ConfigMap created successfully, but Pod container is still initializing.';
  }

  return { status, summary, checks };
};

const evaluateServiceConnectivity = (pod, services) => {
  const isReady = pod.ready ? true : false;
  const svc = services[0] || {};
  const endpointCount = svc.endpointCount || 0;

  const checks = [
    {
      name: 'Service Endpoints Count',
      expected: '> 0',
      actual: endpointCount,
      status: endpointCount > 0 ? 'PASS' : 'FAIL',
      description: 'Verifies Service selector matches active backend pod labels.',
    },
    {
      name: 'Backend Pod Readiness',
      expected: true,
      actual: isReady,
      status: isReady ? 'PASS' : 'FAIL',
      description: 'Verifies matching backend pods are Ready to receive traffic.',
    },
  ];

  let status = 'FAIL';
  let summary = 'Service selector mismatch persists. Service has 0 matching pod endpoints.';

  if (endpointCount > 0 && isReady) {
    status = 'PASS';
    summary = 'Service connectivity resolved! Service selector matched backend pods and endpoints > 0.';
  } else if (endpointCount > 0) {
    status = 'PARTIAL';
    summary = 'Service selector matches pods, but backend pods are not yet Ready.';
  }

  return { status, summary, checks };
};

const evaluateIngressTlsFailure = (pod, services, ingresses) => {
  const isReady = pod.ready ? true : false;
  const ing = ingresses[0] || {};
  const svc = services[0] || {};
  const hasTlsSecret = ing.tlsSecretName ? true : false;
  const hasEndpoints = (svc.endpointCount || 0) > 0;

  const checks = [
    {
      name: 'TLS Secret Reference',
      expected: true,
      actual: hasTlsSecret,
      status: hasTlsSecret ? 'PASS' : 'FAIL',
      description: 'Verifies Ingress references valid TLS secret.',
    },
    {
      name: 'Backend Endpoint Routing',
      expected: '> 0',
      actual: svc.endpointCount || 0,
      status: hasEndpoints ? 'PASS' : 'FAIL',
      description: 'Verifies Ingress backend Service routes to active pod endpoints.',
    },
    {
      name: 'Pod Readiness',
      expected: true,
      actual: isReady,
      status: isReady ? 'PASS' : 'FAIL',
      description: 'Verifies backend pod is Ready.',
    },
  ];

  let status = 'FAIL';
  let summary = 'Ingress TLS configuration remains broken or TLS secret is missing.';

  if (hasTlsSecret && hasEndpoints && isReady) {
    status = 'PASS';
    summary = 'Ingress/TLS failure resolved! TLS secret referenced and backend endpoints active.';
  } else if (hasTlsSecret) {
    status = 'PARTIAL';
    summary = 'TLS Secret configured, but backend service endpoints are not yet fully active.';
  }

  return { status, summary, checks };
};

const evaluateGeneric = (pod) => {
  const isReady = pod.ready ? true : false;
  const checks = [
    {
      name: 'Pod Readiness',
      expected: true,
      actual: isReady,
      status: isReady ? 'PASS' : 'FAIL',
      description: 'Verifies overall workload readiness.',
    },
  ];

  return {
    status: isReady ? 'PASS' : 'FAIL',
    summary: isReady ? 'Workload is Ready.' : 'Workload is not Ready.',
    checks,
  };
};

export default validationRules;
