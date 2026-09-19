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
  const exitCode = container.exitCode ?? 1;
  const restarts = pod.restarts || 0;

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

  const evidence = [
    `Pod Phase: ${pod.phase || 'Unknown'} (Ready: ${isReady ? 'True' : 'False'})`,
    `Container State: ${container.state || 'Unknown'} (${container.reason || 'Exit code ' + exitCode})`,
    `Restarts: ${restarts} | Exit Code: ${exitCode}`,
    `Available Replicas: ${availableReplicas} / Desired: ${dep.replicas || 1}`,
  ];

  const passCount = checks.filter((c) => c.status === 'PASS').length;

  let status = 'FAIL';
  let summary = 'The workload remains in CrashLoopBackOff state and pod is not ready.';
  let nextAction = 'Inspect container logs and startup command in deployment.yaml to remove the failing exit command.';

  if (passCount === 3) {
    status = 'PASS';
    summary = 'Workload successfully recovered! Pod is Running, Ready, and CrashLoopBackOff is resolved.';
    nextAction = 'Review the post-mortem to reflect on root-cause analysis and preventive practices.';
  } else if (isRunning && !isCrashLoop) {
    status = 'PARTIAL';
    summary = 'Pod is Running and no longer in CrashLoopBackOff, but is not yet fully Ready.';
    nextAction = 'Check container readiness probe or wait for initialization to complete.';
  }

  return { status, summary, checks, evidence, nextAction };
};

const evaluateImagePullBackOff = (pod, container, dep, events) => {
  const isReady = pod.ready ? true : false;
  const isImagePullError =
    container.reason === 'ImagePullBackOff' ||
    container.reason === 'ErrImagePull' ||
    events.some((e) => e.reason === 'Failed' && e.message?.includes('pull'));
  const imageName = container.image || dep.image || 'Unknown';

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

  const evidence = [
    `Container Image: ${imageName}`,
    `Pod Phase: ${pod.phase || 'Pending'} (Ready: ${isReady ? 'True' : 'False'})`,
    `Container Reason: ${container.reason || 'OK'}`,
  ];

  let status = 'FAIL';
  let summary = 'Container image pull failed. ImagePullBackOff condition persists.';
  let nextAction = 'Inspect image repository tag in deployment.yaml and correct any typos or nonexistent tags.';

  if (!isImagePullError && isReady) {
    status = 'PASS';
    summary = 'Image pull failure resolved! Container image was pulled cleanly and Pod is Ready.';
    nextAction = 'Review post-mortem reflections for image tag pinning and registry best practices.';
  } else if (!isImagePullError) {
    status = 'PARTIAL';
    summary = 'Image pull error resolved, but container process has not reached Ready state.';
    nextAction = 'Verify container process startup logs.';
  }

  return { status, summary, checks, evidence, nextAction };
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

  const evidence = [
    `Pod Phase: ${pod.phase || 'Unknown'} (Ready: ${isReady ? 'True' : 'False'})`,
    `Exit Code: ${exitCode || 0} (OOMKilled: ${isOOM ? 'Yes' : 'No'})`,
    `Memory Limit: ${dep.resources?.limits?.memory || '16Mi'}`,
  ];

  let status = 'FAIL';
  let summary = 'Container memory limits are still insufficient. OOMKilled condition persists.';
  let nextAction = 'Increase resources.limits.memory in deployment.yaml from 16Mi to at least 256Mi and redeploy.';

  if (!isOOM && isReady) {
    status = 'PASS';
    summary = 'Memory limit resolution verified! Pod is Running cleanly with sufficient memory limits.';
    nextAction = 'Review post-mortem reflections for memory sizing and limit best practices.';
  } else if (!isOOM) {
    status = 'PARTIAL';
    summary = 'OOMKilled termination resolved, but pod readiness stability is still building.';
    nextAction = 'Monitor pod readiness status.';
  }

  return { status, summary, checks, evidence, nextAction };
};

const evaluateMissingConfigMap = (pod, container, configMaps, events) => {
  const isReady = pod.ready ? true : false;
  const hasConfigError =
    container.reason === 'CreateContainerConfigError' ||
    events.some((e) => e.message?.includes('configmap') || e.reason === 'FailedMount');
  const configMapExists = configMaps.some((cm) => (cm.name === 'app-config' || !cm.name) && cm.exists !== false);

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

  const evidence = [
    `ConfigMap 'app-config' Exists: ${configMapExists ? 'True' : 'False'}`,
    `Container State Reason: ${container.reason || 'OK'}`,
    `Pod Phase: ${pod.phase || 'Pending'} (Ready: ${isReady ? 'True' : 'False'})`,
  ];

  let status = 'FAIL';
  let summary = 'ConfigMap is still missing or container failed to mount required keys.';
  let nextAction = 'Ensure configmap.yaml creates ConfigMap "app-config" matching the deployment reference.';

  if (configMapExists && !hasConfigError && isReady) {
    status = 'PASS';
    summary = 'Missing ConfigMap scenario resolved! ConfigMap exists, container mounted config, and Pod is Ready.';
    nextAction = 'Review post-mortem on decouple-configuration architectural patterns.';
  } else if (configMapExists && !hasConfigError) {
    status = 'PARTIAL';
    summary = 'ConfigMap created successfully, but Pod container is still initializing.';
    nextAction = 'Wait for container initialization.';
  }

  return { status, summary, checks, evidence, nextAction };
};

const evaluateServiceConnectivity = (pod, services) => {
  const isReady = pod.ready ? true : false;
  const svc = services[0] || {};
  const endpointCount = svc.endpointCount ?? 0;

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

  const evidence = [
    `Service 'web-service' Active Endpoints: ${endpointCount}`,
    `Backend Pods Ready: ${isReady ? 'True' : 'False'}`,
  ];

  let status = 'FAIL';
  let summary = 'Service selector mismatch persists. Service has 0 matching pod endpoints.';
  let nextAction = 'In service.yaml, update spec.selector to "app: web-app" matching deployment pod labels.';

  if (endpointCount > 0 && isReady) {
    status = 'PASS';
    summary = 'Service connectivity resolved! Service selector matched backend pods and endpoints > 0.';
    nextAction = 'Review post-mortem on Kubernetes Service discovery and selector mapping.';
  } else if (endpointCount > 0) {
    status = 'PARTIAL';
    summary = 'Service selector matches pods, but backend pods are not yet Ready.';
    nextAction = 'Check pod readiness state.';
  }

  return { status, summary, checks, evidence, nextAction };
};

const evaluateIngressTlsFailure = (pod, services, ingresses) => {
  const isReady = pod.ready ? true : false;
  const ing = ingresses[0] || {};
  const svc = services[0] || {};
  const tlsSecret = ing.tlsSecretName || ing.tls?.[0]?.secretName || null;
  const hasValidTlsSecret = Boolean(tlsSecret && tlsSecret !== 'nonexistent-tls-secret-failure' && !tlsSecret.includes('nonexistent'));
  const hasEndpoints = (svc.endpointCount ?? 0) > 0;

  const checks = [
    {
      name: 'TLS Secret Reference',
      expected: true,
      actual: hasValidTlsSecret,
      status: hasValidTlsSecret ? 'PASS' : 'FAIL',
      description: 'Verifies Ingress references valid TLS secret.',
    },
    {
      name: 'Backend Endpoint Routing',
      expected: '> 0',
      actual: svc.endpointCount ?? 0,
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

  const evidence = [
    `Ingress 'web-ingress' TLS Secret: ${tlsSecret || 'Missing'}`,
    `Backend Service Endpoints: ${svc.endpointCount ?? 0}`,
    `Backend Pods Ready: ${isReady ? 'True' : 'False'}`,
  ];

  let status = 'FAIL';
  let summary = 'Ingress TLS configuration remains broken or TLS secret is missing.';
  let nextAction = 'In ingress.yaml, update spec.tls[0].secretName to "example-tls-secret" and redeploy.';

  if (hasValidTlsSecret && hasEndpoints && isReady) {
    status = 'PASS';
    summary = 'Ingress/TLS failure resolved! TLS secret referenced and backend endpoints active.';
    nextAction = 'Review post-mortem on Ingress TLS routing and Kubernetes Secret management.';
  } else if (hasValidTlsSecret) {
    status = 'PARTIAL';
    summary = 'TLS Secret configured, but backend service endpoints are not yet fully active.';
    nextAction = 'Wait for backend service endpoints to register.';
  }

  return { status, summary, checks, evidence, nextAction };
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

  const evidence = [`Pod Phase: ${pod.phase || 'Unknown'} (Ready: ${isReady ? 'True' : 'False'})`];

  return {
    status: isReady ? 'PASS' : 'FAIL',
    summary: isReady ? 'Workload is Ready.' : 'Workload is not Ready.',
    checks,
    evidence,
    nextAction: isReady ? 'Review post-mortem.' : 'Inspect pod status and logs.',
  };
};

export default validationRules;
