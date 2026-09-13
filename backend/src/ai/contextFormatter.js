export const formatContextForAI = (snapshotObj) => {
  if (!snapshotObj || !snapshotObj.context) {
    return 'NO_CONTEXT_AVAILABLE';
  }

  const ctx = snapshotObj.context;
  const scenario = ctx.scenario || {};
  const cluster = ctx.cluster || {};
  const deployment = ctx.deployment || {};
  const pods = ctx.pods || [];
  const logs = ctx.logs || {};
  const events = ctx.events || [];
  const services = ctx.services || [];
  const ingresses = ctx.ingresses || [];
  const configMaps = ctx.configMaps || [];
  const manifestDiff = ctx.manifestDiff || [];
  const observed = ctx.observedFailure || {};
  const scratchpad = ctx.scratchpad || snapshotObj.scratchpad || {};

  const pod = pods[0] || {};
  const container = pod.containers?.[0] || {};

  const formattedEvents = events.slice(0, 10).map((e) => `[${e.type || 'Normal'}] ${e.reason}: ${e.message}`).join('\n');
  const formattedDiff = manifestDiff.map((d) => `${d.field}: before="${d.before}" after="${d.after}"`).join('\n');

  let scratchpadSection = 'None recorded yet.';
  if (
    scratchpad.evidence ||
    scratchpad.hypothesis ||
    scratchpad.rootCause ||
    scratchpad.plannedFix ||
    scratchpad.result ||
    scratchpad.generalNotes
  ) {
    scratchpadSection = `
Evidence: ${scratchpad.evidence || '(empty)'}
Hypothesis: ${scratchpad.hypothesis || '(empty)'}
Suspected Root Cause: ${scratchpad.rootCause || '(empty)'}
Planned Fix: ${scratchpad.plannedFix || '(empty)'}
Result: ${scratchpad.result || '(empty)'}
General Notes: ${scratchpad.generalNotes || '(empty)'}
`;
  }

  return `
<<<TELEMETRY_CONTEXT>>>
SCENARIO: ${scenario.name || scenario.id || 'Kubernetes Lab'} (${scenario.id || 'scenario'}) | Category: ${scenario.category || 'Reliability'} | Expected Failure: ${scenario.expectedFailure || 'Failure'}
NAMESPACE: ${cluster.namespace || 'sandbox'}

DEPLOYMENT:
Name: ${deployment.name || 'web-app'}
Replicas: Desired=${deployment.replicas ?? 1}, Available=${deployment.availableReplicas ?? 0}

POD STATUS:
Pod Name: ${pod.name || 'N/A'}
Phase: ${pod.phase || 'Unknown'} | Ready: ${pod.ready ? 'True' : 'False'} | Restarts: ${pod.restarts || 0}
Container: ${container.name || 'nginx'} | State: ${container.state || 'Unknown'} | Reason: ${container.reason || observed.reason || 'N/A'} | Exit Code: ${container.exitCode ?? 'N/A'}

OBSERVED FAILURE SUMMARY:
Status: ${observed.status || 'Failed'}
Reason: ${observed.reason || 'Unknown'}
Affected Resource: ${observed.affectedResource || 'Deployment/web-app'}

LOG SNIPPET (Tail ${logs.lines || 0} lines):
${typeof logs.content === 'string' ? logs.content : 'No logs produced yet.'}

KUBERNETES EVENTS:
${formattedEvents || 'No recent events recorded.'}

MANIFEST DIFF (Original vs Injected Sandbox Config):
${formattedDiff || 'No manifest diff recorded.'}

SERVICES & ENDPOINTS:
${services.map((s) => `Service: ${s.name} | Type: ${s.type} | ClusterIP: ${s.clusterIP} | Ports: ${JSON.stringify(s.ports)} | Selector: ${JSON.stringify(s.selector || {})}`).join('\n') || 'None'}

INGRESSES:
${ingresses.map((i) => `Ingress: ${i.name} | Hosts: ${i.hosts?.join(', ')} | TLS Secret: ${i.tlsSecretName || 'None'}`).join('\n') || 'None'}

CONFIGMAPS:
${configMaps.map((c) => `ConfigMap: ${c.name} | Exists: ${c.exists}`).join('\n') || 'None'}

<<<LEARNER_INVESTIGATION_NOTES>>>
${scratchpadSection}
<<<END_LEARNER_INVESTIGATION_NOTES>>>
<<<END_TELEMETRY_CONTEXT>>>
`;
};

export default { formatContextForAI };
