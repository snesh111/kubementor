export const checkMissingLabels = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  const labels = doc.metadata?.labels || {};
  if (Object.keys(labels).length === 0 || (!labels.app && !labels['app.kubernetes.io/name'])) {
    findings.push({
      ruleId: 'bestPractices.labels',
      category: 'Best Practices',
      severity: 'Low',
      title: 'Missing Standard Metadata Labels',
      description: `Resource '${resourceIdentifier}' does not define standard organizational labels (e.g. app or app.kubernetes.io/name).`,
      deduction: 3,
      resource: resourceIdentifier,
      recommendation: 'Add standard metadata labels like app, version, and environment for effective filtering and observability.',
    });
  }

  return findings;
};

export default checkMissingLabels;
