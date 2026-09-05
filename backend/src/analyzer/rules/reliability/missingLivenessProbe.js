export const checkMissingLivenessProbe = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      if (!container.livenessProbe) {
        findings.push({
          ruleId: 'reliability.livenessProbe',
          category: 'Reliability',
          severity: 'Medium',
          title: 'Missing Liveness Probe',
          description: `Container '${container.name || 'unnamed'}' does not define a livenessProbe.`,
          deduction: 10,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Configure a livenessProbe so Kubernetes can automatically restart deadlock or unresponsive containers.',
        });
      }
    });
  }

  return findings;
};

export default checkMissingLivenessProbe;
