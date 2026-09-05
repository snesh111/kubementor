export const checkMissingCpuRequests = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      if (!container.resources?.requests?.cpu) {
        findings.push({
          ruleId: 'performance.cpuRequests',
          category: 'Performance',
          severity: 'Medium',
          title: 'Missing CPU Requests',
          description: `Container '${container.name || 'unnamed'}' does not specify CPU requests.`,
          deduction: 5,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Specify resources.requests.cpu (e.g. 100m or 250m) so Kubernetes scheduler can place pods on nodes with sufficient CPU capacity.',
        });
      }
    });
  }

  return findings;
};

export default checkMissingCpuRequests;
