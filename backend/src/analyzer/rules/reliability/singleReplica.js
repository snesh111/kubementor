export const checkSingleReplica = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  if (doc.kind === 'Deployment') {
    const replicas = doc.spec?.replicas;
    if (replicas === undefined || replicas <= 1) {
      findings.push({
        ruleId: 'reliability.singleReplica',
        category: 'Reliability',
        severity: 'Medium',
        title: 'Single Replica Deployment',
        description: `Deployment specifies ${replicas === undefined ? '1 (default)' : replicas} replica, offering no high availability redundant instances.`,
        deduction: 10,
        resource: resourceIdentifier,
        recommendation: 'Increase replicas to at least 2 or configure a HorizontalPodAutoscaler (HPA) to maintain service availability during node failures or rolling updates.',
      });
    }
  }

  return findings;
};

export default checkSingleReplica;
