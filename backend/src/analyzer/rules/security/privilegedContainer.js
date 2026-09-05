export const checkPrivilegedContainer = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      if (container.securityContext?.privileged === true) {
        findings.push({
          ruleId: 'security.privilegedContainer',
          category: 'Security',
          severity: 'Critical',
          title: 'Privileged Container',
          description: `Container '${container.name || 'unnamed'}' is running in privileged mode.`,
          deduction: 20,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Remove privileged: true from securityContext unless absolutely required for low-level host device access.',
        });
      }
    });
  }

  return findings;
};

export default checkPrivilegedContainer;
