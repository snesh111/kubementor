export const checkMissingCpuLimits = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      if (!container.resources?.limits?.cpu) {
        findings.push({
          ruleId: 'performance.cpuLimits',
          category: 'Performance',
          severity: 'Medium',
          title: 'Missing CPU Limits',
          description: `Container '${container.name || 'unnamed'}' does not specify CPU limits.`,
          deduction: 5,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Specify resources.limits.cpu (e.g. 500m or 1) to prevent CPU hogging and guarantee fair node sharing.',
        });
      }
    });
  }

  return findings;
};

export default checkMissingCpuLimits;
