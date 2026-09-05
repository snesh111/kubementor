import checkMissingSecurityContext from './rules/security/missingSecurityContext.js';
import checkRunningAsRoot from './rules/security/runningAsRoot.js';
import checkPrivilegedContainer from './rules/security/privilegedContainer.js';
import checkLatestImageTag from './rules/security/latestImageTag.js';
import checkHardcodedSecrets from './rules/security/hardcodedSecrets.js';

import checkMissingReadinessProbe from './rules/reliability/missingReadinessProbe.js';
import checkMissingLivenessProbe from './rules/reliability/missingLivenessProbe.js';
import checkSingleReplica from './rules/reliability/singleReplica.js';
import checkMissingUpdateStrategy from './rules/reliability/missingUpdateStrategy.js';

import checkMissingCpuRequests from './rules/performance/missingCpuRequests.js';
import checkMissingCpuLimits from './rules/performance/missingCpuLimits.js';
import checkMissingMemoryRequests from './rules/performance/missingMemoryRequests.js';
import checkMissingMemoryLimits from './rules/performance/missingMemoryLimits.js';

import checkMissingLabels from './rules/bestPractices/missingLabels.js';
import checkMissingNamespace from './rules/bestPractices/missingNamespace.js';
import checkMutableImageTag from './rules/bestPractices/mutableImageTag.js';
import checkMissingContainerName from './rules/bestPractices/missingContainerName.js';

const SUPPORTED_KINDS = ['Deployment', 'Service', 'ConfigMap', 'Secret', 'Ingress', 'Pod'];

const ALL_RULES = [
  // Security
  checkMissingSecurityContext,
  checkRunningAsRoot,
  checkPrivilegedContainer,
  checkLatestImageTag,
  checkHardcodedSecrets,

  // Reliability
  checkMissingReadinessProbe,
  checkMissingLivenessProbe,
  checkSingleReplica,
  checkMissingUpdateStrategy,

  // Performance
  checkMissingCpuRequests,
  checkMissingCpuLimits,
  checkMissingMemoryRequests,
  checkMissingMemoryLimits,

  // Best Practices
  checkMissingLabels,
  checkMissingNamespace,
  checkMutableImageTag,
  checkMissingContainerName,
];

export const runRulesOnDocuments = (parsedDocs) => {
  const allFindings = [];

  parsedDocs.forEach((doc, idx) => {
    if (!doc || typeof doc !== 'object') return;

    const kind = doc.kind || 'Unknown';
    const name = doc.metadata?.name || `unnamed-${idx + 1}`;
    const resourceIdentifier = `${kind}/${name}`;

    if (!SUPPORTED_KINDS.includes(kind)) {
      allFindings.push({
        ruleId: 'general.unsupportedKind',
        category: 'Best Practices',
        severity: 'Info',
        title: `Unsupported Resource Type: ${kind}`,
        description: `Resource '${resourceIdentifier}' uses kind '${kind}', which is not currently supported for deep rule-based analysis.`,
        deduction: 0,
        resource: resourceIdentifier,
        recommendation: 'Analysis skipped for unsupported kind. Deep analysis is active for Deployment, Service, ConfigMap, Secret, and Ingress.',
      });
      return;
    }

    // Run each rule against the document
    ALL_RULES.forEach((ruleFn) => {
      try {
        const ruleFindings = ruleFn(doc, resourceIdentifier);
        if (Array.isArray(ruleFindings) && ruleFindings.length > 0) {
          allFindings.push(...ruleFindings);
        }
      } catch (err) {
        console.error(`Rule execution error on ${resourceIdentifier}:`, err.message);
      }
    });
  });

  return allFindings;
};

export default { runRulesOnDocuments };
