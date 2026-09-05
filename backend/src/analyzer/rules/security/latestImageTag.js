export const checkLatestImageTag = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      const image = container.image || '';
      if (!image.includes(':') || image.endsWith(':latest')) {
        findings.push({
          ruleId: 'security.latestImageTag',
          category: 'Security',
          severity: 'Medium',
          title: 'Latest Image Tag',
          description: `Container '${container.name || 'unnamed'}' uses the ':latest' or untagged image '${image}'.`,
          deduction: 5,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Specify an explicit immutable semantic version tag (e.g., nginx:1.25.3 or git SHA) for predictable deployments.',
        });
      }
    });
  }

  return findings;
};

export default checkLatestImageTag;
