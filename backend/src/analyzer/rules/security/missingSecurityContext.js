export const checkMissingSecurityContext = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      if (!container.securityContext && !podSpec?.securityContext) {
        findings.push({
          ruleId: 'security.missingSecurityContext',
          category: 'Security',
          severity: 'Medium',
          title: 'Missing Security Context',
          description: `Container '${container.name || 'unnamed'}' does not define a securityContext.`,
          deduction: 10,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Configure securityContext at container or pod level to restrict Linux capabilities and permissions.',
        });
      }
    });
  }

  return findings;
};

export default checkMissingSecurityContext;
