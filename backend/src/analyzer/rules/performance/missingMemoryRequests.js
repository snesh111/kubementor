export const checkMissingMemoryRequests = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      if (!container.resources?.requests?.memory) {
        findings.push({
          ruleId: 'performance.memoryRequests',
          category: 'Performance',
          severity: 'Medium',
          title: 'Missing Memory Requests',
          description: `Container '${container.name || 'unnamed'}' does not specify memory requests.`,
          deduction: 5,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Specify resources.requests.memory (e.g. 128Mi or 256Mi) to ensure proper node allocation during scheduling.',
        });
      }
    });
  }

  return findings;
};

export default checkMissingMemoryRequests;
