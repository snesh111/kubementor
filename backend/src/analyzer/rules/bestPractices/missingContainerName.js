export const checkMissingContainerName = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container, idx) => {
      if (!container.name || container.name.trim().length === 0) {
        findings.push({
          ruleId: 'bestPractices.missingContainerName',
          category: 'Best Practices',
          severity: 'Low',
          title: 'Missing Container Name',
          description: `Container at index ${idx} in '${resourceIdentifier}' does not have a valid name specified.`,
          deduction: 5,
          resource: resourceIdentifier,
          recommendation: 'Specify a descriptive name for every container in the pod specification.',
        });
      }
    });
  }

  return findings;
};

export default checkMissingContainerName;
