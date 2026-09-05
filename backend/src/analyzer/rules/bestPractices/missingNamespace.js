export const checkMissingNamespace = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (!doc.metadata?.namespace) {
    findings.push({
      ruleId: 'bestPractices.namespace',
      category: 'Best Practices',
      severity: 'Low',
      title: 'Missing Namespace Specification',
      description: `Namespace is not explicitly defined in metadata for '${resourceIdentifier}'.`,
      deduction: 3,
      resource: resourceIdentifier,
      recommendation: 'Explicitly specify metadata.namespace (e.g. production or staging) to avoid accidental deployment into default namespace.',
    });
  }

  return findings;
};

export default checkMissingNamespace;
