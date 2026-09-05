/**
 * Explainability Engine for Kubernetes Deployment Analyzer
 * Formats findings with explicit rule IDs, severity, deductions, impact explanations (why), and recommendations.
 */

export const explainabilityEngine = {
  /**
   * Enrich findings with standardized explainability metadata
   * @param {Array} findings - Raw rule findings
   * @returns {Array} Enriched explainable findings
   */
  enrichFindings: (findings = []) => {
    return findings.map((f, idx) => {
      const categoryPrefix = getCategoryPrefix(f.category);
      const ruleId = f.ruleId || `${categoryPrefix}-${String(idx + 1).padStart(3, '0')}`;
      const deduction = f.deduction ?? getSeverityDeduction(f.severity);

      return {
        ruleId,
        category: f.category || 'Best Practices',
        severity: (f.severity || 'INFO').toUpperCase(),
        title: f.title || f.message || 'Manifest Configuration Issue',
        message: f.message || f.description || f.title,
        deduction,
        resource: f.resource || 'Kubernetes Manifest',
        container: f.container || null,
        why: f.why || f.description || getWhyExplanation(ruleId, f.category, f.title),
        recommendation: f.recommendation || getRecommendation(ruleId, f.title),
      };
    });
  },

  /**
   * Compare previous analysis report vs current analysis report
   * @param {Object} beforeReport - Previous AnalysisReport document
   * @param {Object} afterReport - Current AnalysisReport document
   * @returns {Object} Score delta & fixed vs remaining issues comparison
   */
  compareAnalyses: (beforeReport, afterReport) => {
    if (!beforeReport || !afterReport) return null;

    const beforeScore = beforeReport.overallScore || 0;
    const afterScore = afterReport.overallScore || 0;
    const delta = afterScore - beforeScore;

    const beforeFindings = beforeReport.findings || [];
    const afterFindings = afterReport.findings || [];

    const beforeMap = new Map(beforeFindings.map((f) => [f.title, f]));
    const afterMap = new Map(afterFindings.map((f) => [f.title, f]));

    const fixedIssues = [];
    const remainingIssues = [];
    const newIssues = [];

    for (const [title, finding] of beforeMap.entries()) {
      if (afterMap.has(title)) {
        remainingIssues.push(finding);
      } else {
        fixedIssues.push(finding);
      }
    }

    for (const [title, finding] of afterMap.entries()) {
      if (!beforeMap.has(title)) {
        newIssues.push(finding);
      }
    }

    return {
      beforeScore,
      afterScore,
      delta: delta >= 0 ? `+${delta}` : `${delta}`,
      improved: delta > 0,
      fixedCount: fixedIssues.length,
      remainingCount: remainingIssues.length,
      newCount: newIssues.length,
      fixedIssues: fixedIssues.map((f) => ({ title: f.title, category: f.category, deduction: f.deduction })),
      remainingIssues: remainingIssues.map((f) => ({ title: f.title, category: f.category, deduction: f.deduction })),
      newIssues: newIssues.map((f) => ({ title: f.title, category: f.category, deduction: f.deduction })),
    };
  },
};

const getCategoryPrefix = (category) => {
  switch (category) {
    case 'Security':
      return 'SEC';
    case 'Reliability':
      return 'REL';
    case 'Performance':
      return 'PERF';
    case 'Best Practices':
      return 'BP';
    default:
      return 'GEN';
  }
};

const getSeverityDeduction = (severity) => {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL':
      return 20;
    case 'HIGH':
      return 15;
    case 'MEDIUM':
      return 10;
    case 'LOW':
      return 5;
    case 'INFO':
    default:
      return 2;
  }
};

const getWhyExplanation = (ruleId, category, title) => {
  const titleLower = (title || '').toLowerCase();
  if (titleLower.includes('root')) {
    return 'Containers running as root increase the blast radius if compromised, allowing potential host system access.';
  }
  if (titleLower.includes('privileged')) {
    return 'Privileged containers possess full root access to the host kernel, bypassing all container security boundaries.';
  }
  if (titleLower.includes('liveness')) {
    return 'Without a liveness probe, Kubernetes cannot detect deadlocks or frozen processes, leaving unresponsive pods running.';
  }
  if (titleLower.includes('readiness')) {
    return 'Without a readiness probe, Kubernetes may route traffic to uninitialized or failing pods during deployments.';
  }
  if (titleLower.includes('memory') || titleLower.includes('limit')) {
    return 'Unconstrained memory usage can allow a rogue container to exhaust node memory, causing OOM-killer node eviction.';
  }
  if (titleLower.includes('latest')) {
    return 'Using the :latest image tag makes deployments non-deterministic and prone to breaking changes across pod restarts.';
  }
  if (titleLower.includes('label')) {
    return 'Missing standard labels reduces observability and breaks Service/Ingress label selector routing.';
  }
  return `This ${category} misconfiguration reduces cluster stability and operational predictability.`;
};

const getRecommendation = (ruleId, title) => {
  const titleLower = (title || '').toLowerCase();
  if (titleLower.includes('root')) {
    return 'Add securityContext.runAsNonRoot: true and specify a non-zero runAsUser ID in your pod spec.';
  }
  if (titleLower.includes('privileged')) {
    return 'Remove securityContext.privileged: true unless required for host network driver agents.';
  }
  if (titleLower.includes('liveness')) {
    return 'Configure container.livenessProbe with appropriate httpGet or exec health check probes.';
  }
  if (titleLower.includes('readiness')) {
    return 'Configure container.readinessProbe to ensure traffic is only routed after application startup.';
  }
  if (titleLower.includes('memory') || titleLower.includes('limit')) {
    return 'Define resources.limits.memory and resources.requests.memory in your container spec.';
  }
  if (titleLower.includes('latest')) {
    return 'Pin explicit container image tags (e.g. nginx:1.25.3) or SHA digests instead of :latest.';
  }
  return 'Review Kubernetes manifest documentation and apply standard resource specifications.';
};

export default explainabilityEngine;
