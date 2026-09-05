export const checkMissingMemoryLimits = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      if (!container.resources?.limits?.memory) {
        findings.push({
          ruleId: 'performance.memoryLimits',
          category: 'Performance',
          severity: 'Medium',
          title: 'Missing Memory Limits',
          description: `Container '${container.name || 'unnamed'}' does not specify memory limits.`,
          deduction: 5,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Specify resources.limits.memory (e.g. 512Mi or 1Gi) to protect the host node from Out-Of-Memory (OOM) starvation caused by memory leaks.',
        });
      }
    });
  }

  return findings;
};

export default checkMissingMemoryLimits;
