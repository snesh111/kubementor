export const checkHardcodedSecrets = (doc, resourceIdentifier) => {
  const findings = [];
  if (!doc || !doc.kind) return findings;

  const sensitiveKeysRegex = /(password|passwd|secret|api_key|apikey|private_key|auth_token|jwt_secret)/i;

  if (doc.kind === 'ConfigMap' && doc.data) {
    Object.keys(doc.data).forEach((key) => {
      if (sensitiveKeysRegex.test(key)) {
        findings.push({
          ruleId: 'security.hardcodedSecrets',
          category: 'Security',
          severity: 'High',
          title: 'Hardcoded Sensitive Value',
          description: `ConfigMap contains potentially sensitive key '${key}' in plaintext data.`,
          deduction: 10,
          resource: resourceIdentifier,
          recommendation: 'Move sensitive values out of ConfigMap into Kubernetes Secret or an external secret vault.',
        });
      }
    });
  }

  if (doc.kind === 'Deployment' || doc.kind === 'Pod') {
    const podSpec = doc.kind === 'Deployment' ? doc.spec?.template?.spec : doc.spec;
    const containers = podSpec?.containers || [];

    containers.forEach((container) => {
      const envs = container.env || [];
      envs.forEach((envVar) => {
        if (envVar.name && sensitiveKeysRegex.test(envVar.name) && envVar.value) {
          findings.push({
            ruleId: 'security.hardcodedSecrets',
            category: 'Security',
            severity: 'High',
            title: 'Hardcoded Sensitive Value in Env',
            description: `Container '${container.name}' defines sensitive environment variable '${envVar.name}' with literal plaintext value.`,
            deduction: 10,
            resource: resourceIdentifier,
            container: container.name,
            recommendation: 'Use secretKeyRef to reference credentials from a Kubernetes Secret instead of hardcoding values in spec.',
          });
        }
      });
    });
  }

  return findings;
};

export default checkHardcodedSecrets;
