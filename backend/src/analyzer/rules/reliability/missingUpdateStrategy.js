export const checkMissingUpdateStrategy = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment') {
    const strategy = doc.spec?.strategy;
    if (!strategy || !strategy.type) {
      findings.push({
        ruleId: 'reliability.updateStrategy',
        category: 'Reliability',
        severity: 'Low',
        title: 'Missing Rolling Update Strategy',
        description: 'Deployment update strategy is not explicitly configured in spec.strategy.',
        deduction: 5,
        resource: resourceIdentifier,
        recommendation: 'Explicitly configure spec.strategy.type: RollingUpdate with maxSurge and maxUnavailable settings for controlled zero-downtime rollouts.',
      });
    }
  }

  return findings;
};

export default checkMissingUpdateStrategy;
