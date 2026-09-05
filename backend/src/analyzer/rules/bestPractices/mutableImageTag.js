export const checkMutableImageTag = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    const mutableTags = [':latest', ':dev', ':main', ':master', ':staging', ':latest-alpine'];

    containers.forEach((container) => {
      const image = container.image || '';
      if (mutableTags.some((tag) => image.endsWith(tag))) {
        findings.push({
          ruleId: 'bestPractices.mutableImageTag',
          category: 'Best Practices',
          severity: 'Low',
          title: 'Mutable Image Tag Usage',
          description: `Container '${container.name || 'unnamed'}' uses mutable tag '${image}'.`,
          deduction: 5,
          resource: resourceIdentifier,
          container: container.name || 'unnamed',
          recommendation: 'Use explicit version tags or image digest SHA256 hashes to enforce immutable application releases.',
        });
      }
    });
  }

  return findings;
};

export default checkMutableImageTag;
