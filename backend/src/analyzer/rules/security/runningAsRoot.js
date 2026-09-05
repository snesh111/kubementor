export const checkRunningAsRoot = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      const secContext = container.securityContext || podSpec?.securityContext || {};
      
      if (secContext.runAsUser === 0 || secContext.runAsNonRoot === false) {
        findings.push({
          ruleId: 'security.runningAsRoot',
          category: 'Security',
          severity: 'High',
          title: 'Running as Root',
          description: `Container '${container.name || 'unnamed'}' is explicitly configured to run as root user (UID 0).`,
          deduction: 15,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Configure runAsNonRoot: true and specify a non-zero runAsUser (e.g. 10001) to prevent root privileges inside container.',
        });
      }
    });
  }

  return findings;
};

export default checkRunningAsRoot;
