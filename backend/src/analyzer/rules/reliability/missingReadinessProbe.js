export const checkMissingReadinessProbe = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      if (!container.readinessProbe) {
        findings.push({
          ruleId: 'reliability.readinessProbe',
          category: 'Reliability',
          severity: 'Medium',
          title: 'Missing Readiness Probe',
          description: `Container '${container.name || 'unnamed'}' does not define a readinessProbe.`,
          deduction: 10,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Configure a readinessProbe (httpGet, tcpSocket, or exec) to ensure Kubernetes does not route traffic to the container before it is ready.',
        });
      }
    });
  }

  return findings;
};

export default checkMissingReadinessProbe;
