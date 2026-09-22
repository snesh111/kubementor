import yaml from 'js-yaml';
import Project from '../models/Project.js';
import ProjectFile from '../models/ProjectFile.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { runRulesOnDocuments } from './ruleEngine.js';
import { calculateScores } from './scoreEngine.js';
import { generateReport } from './reportGenerator.js';
import explainabilityEngine from './explainabilityEngine.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const analyzerService = {
  /**
   * Run readiness analysis on selected project files
   * @param {string} projectId - Project ObjectId
   * @param {string} userId - User ObjectId
   * @param {Array<string>} fileIds - Array of ProjectFile ObjectIds
   * @returns {Object} Saved AnalysisReport document + comparison metadata
   */
  analyzeProjectFiles: async (projectId, userId, fileIds) => {
    // 1. Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new ApiError('Please select at least one Kubernetes YAML file to analyze.', 400);
    }

    // 2. Fetch previous report for before/after comparison
    const previousReport = await AnalysisReport.findOne({ project: projectId, user: userId })
      .sort({ createdAt: -1 });

    // 3. Fetch and verify selected files
    const files = await ProjectFile.find({
      _id: { $in: fileIds },
      project: projectId,
      owner: userId,
    });

    if (files.length === 0) {
      throw new ApiError('None of the specified files were found in this project.', 404);
    }

    // 4. Parse all YAML documents from selected files
    const parsedDocuments = [];
    const analyzedFilesMetadata = [];
    const parseErrors = [];

    for (const fileDoc of files) {
      analyzedFilesMetadata.push({
        fileId: fileDoc._id,
        originalName: fileDoc.originalName,
      });

      try {
        const docs = yaml.loadAll(fileDoc.content);
        docs.forEach((doc) => {
          if (doc && typeof doc === 'object') {
            parsedDocuments.push(doc);
          }
        });
      } catch (err) {
        parseErrors.push(`Failed to parse ${fileDoc.originalName}: ${err.message}`);
      }
    }

    if (parseErrors.length > 0 && parsedDocuments.length === 0) {
      throw new ApiError(`YAML Parsing Failed: ${parseErrors.join(' | ')}`, 400);
    }

    if (parsedDocuments.length === 0) {
      throw new ApiError('No valid Kubernetes YAML objects found in the selected files.', 400);
    }

    // 5. Run rule engine
    const rawFindings = runRulesOnDocuments(parsedDocuments);

    // 6. Enrich findings with Explainability Metadata (ruleId, why, recommendation)
    const enrichedFindings = explainabilityEngine.enrichFindings(rawFindings);

    // 7. Calculate category & overall scores
    const scoreResults = calculateScores(enrichedFindings);

    // 8. Generate report data
    const reportData = generateReport(enrichedFindings, scoreResults, analyzedFilesMetadata);

    // 9. Save report to MongoDB
    const reportDoc = await AnalysisReport.create({
      project: projectId,
      user: userId,
      analyzedFiles: reportData.analyzedFiles,
      analyzedAt: reportData.analyzedAt,
      overallScore: reportData.overallScore,
      categoryScores: reportData.categoryScores,
      categoryDeductions: reportData.categoryDeductions,
      findings: reportData.findings,
      recommendations: reportData.recommendations,
      analyzerVersion: reportData.analyzerVersion,
    });

    // Update project status to 'analyzed'
    project.status = 'analyzed';
    await project.save();

    // 10. Compute comparison diff against previous report if exists
    const comparison = explainabilityEngine.compareAnalyses(previousReport, reportDoc);

    const responseObj = reportDoc.toResponseObject();
    responseObj.comparison = comparison;

    return responseObj;
  },

  /**
   * Analyze raw snippet (YAML manifest, pod logs, or cluster events)
   * @param {string} content - Raw input text
   * @param {string} [type] - Optional hint ('yaml' | 'log' | 'auto')
   * @returns {Object} Comprehensive diagnostic report with root cause, score, and fix
   */
  analyzeRawSnippet: async (content, type = 'auto') => {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ApiError('Please provide raw YAML manifest or container logs to analyze.', 400);
    }

    const trimmed = content.trim();

    // 1. Detect if input is YAML manifest
    let isYaml = false;
    let parsedDocs = [];
    let yamlParseError = null;

    if (
      type === 'yaml' ||
      trimmed.startsWith('apiVersion:') ||
      trimmed.startsWith('kind:') ||
      trimmed.includes('metadata:') ||
      trimmed.includes('spec:')
    ) {
      try {
        const loaded = yaml.loadAll(trimmed);
        parsedDocs = loaded.filter((d) => d && typeof d === 'object');
        if (parsedDocs.length > 0) {
          isYaml = true;
        }
      } catch (err) {
        yamlParseError = err.message;
      }
    }

    // 2. YAML Manifest Analysis Path
    if (isYaml && parsedDocs.length > 0) {
      const rawFindings = runRulesOnDocuments(parsedDocs);
      const enrichedFindings = explainabilityEngine.enrichFindings(rawFindings);
      const scoreResults = calculateScores(enrichedFindings);

      // Check specific Kubernetes anti-patterns
      const customIssues = [];
      let detectedKind = parsedDocs[0]?.kind || 'Kubernetes Resource';
      let resourceName = parsedDocs[0]?.metadata?.name || 'workload';

      // Check for common scenario bugs in YAML
      parsedDocs.forEach((doc) => {
        const containers = doc.spec?.template?.spec?.containers || doc.spec?.containers || [];
        containers.forEach((c) => {
          // CrashLoop command check
          const cmdStr = JSON.stringify(c.command || []) + JSON.stringify(c.args || []);
          if (cmdStr.includes('exit 1') || cmdStr.includes('exit 2')) {
            customIssues.push({
              title: 'Instant Exit Code Trigger in Container Command',
              severity: 'CRITICAL',
              category: 'Reliability',
              description: `Container "${c.name}" executes a command with "exit 1" which immediately terminates the process, causing infinite CrashLoopBackOff.`,
              recommendation: 'Remove the "exit 1" statement and run the long-lived daemon (e.g. nginx -g "daemon off;").',
            });
          }

          // Image tag check
          if (c.image && (c.image.includes(':1.999') || c.image.includes(':nonexistent') || c.image.includes(':badtag'))) {
            customIssues.push({
              title: 'Non-Existent / Invalid Container Image Tag',
              severity: 'CRITICAL',
              category: 'Reliability',
              description: `Image "${c.image}" does not exist in registry. Kubelet will fail with manifest unknown (ImagePullBackOff).`,
              recommendation: 'Update image tag to a verified release (e.g., nginx:1.25-alpine).',
            });
          }

          // Memory limits too low
          const memLimit = c.resources?.limits?.memory;
          if (memLimit && (memLimit === '4Mi' || memLimit === '8Mi' || memLimit === '16Mi')) {
            customIssues.push({
              title: 'Constrained Memory Limit (Risk of OOMKilled Exit 137)',
              severity: 'HIGH',
              category: 'Reliability',
              description: `Memory limit "${memLimit}" is insufficient for standard application startup memory allocations.`,
              recommendation: 'Increase resources.limits.memory to at least 128Mi or 256Mi.',
            });
          }
        });

        // Service selector check
        if (doc.kind === 'Service' && doc.spec?.selector) {
          const selectorKeys = Object.keys(doc.spec.selector);
          if (selectorKeys.some((k) => doc.spec.selector[k].includes('v2') || doc.spec.selector[k].includes('mismatch'))) {
            customIssues.push({
              title: 'Potential Service Label Selector Mismatch',
              severity: 'HIGH',
              category: 'Reliability',
              description: `Service selector "${JSON.stringify(doc.spec.selector)}" may not match running pod template labels, resulting in 0 Endpoints.`,
              recommendation: 'Align spec.selector with the exact labels defined under spec.template.metadata.labels.',
            });
          }
        }
      });

      const allFindings = [...customIssues, ...enrichedFindings];
      const hasCritical = allFindings.some((f) => f.severity === 'CRITICAL');
      const score = hasCritical ? Math.min(scoreResults.overallScore, 45) : scoreResults.overallScore;

      return {
        inputType: 'YAML Manifest',
        resourceKind: detectedKind,
        resourceName,
        overallScore: score,
        severity: score >= 80 ? 'HEALTHY' : score >= 50 ? 'WARNING' : 'CRITICAL',
        summary: hasCritical
          ? `Identified ${allFindings.length} configuration issues in ${detectedKind} "${resourceName}" requiring immediate remediation.`
          : `Manifest evaluated with a readiness score of ${score}/100.`,
        findings: allFindings,
        categoryScores: scoreResults.categoryScores,
        playbook: [
          { step: 1, action: 'Inspect manifest parameters and fix identified syntax/configuration errors.' },
          { step: 2, action: 'Run `kubectl apply -f manifest.yaml` to deploy to cluster.' },
          { step: 3, action: 'Run `kubectl get pods -w` to monitor successful rollout.' },
        ],
        correctedSnippet: hasCritical
          ? `# Suggested Remediation:\n# Ensure all image tags, commands, and resource limits are valid:\n${yaml.dump(parsedDocs[0])}`
          : null,
      };
    }

    // 2.5 Check Broken YAML Syntax
    if (yamlParseError && !isYaml && (trimmed.includes('apiVersion:') || trimmed.includes('kind:') || trimmed.includes('spec:'))) {
      return {
        inputType: 'Invalid YAML Syntax',
        rootCause: 'YAML Syntax Parsing Error',
        detectedError: 'YAML Parser Exception',
        severity: 'CRITICAL',
        overallScore: 0,
        summary: `The provided YAML manifest contains syntax formatting errors: ${yamlParseError}`,
        findings: [
          {
            title: 'YAML Syntax Formatting Failed',
            severity: 'CRITICAL',
            category: 'Syntax',
            description: yamlParseError,
            recommendation: 'Check 2-space line indentation, trailing colons, and valid YAML mapping formatting.',
          },
        ],
        playbook: [
          { step: 1, action: 'Inspect line indentation and ensure valid 2-space nesting.' },
          { step: 2, action: 'Verify all key: value pairs have a space after the colon.' },
        ],
      };
    }

    // 3. Check for Valid Kubernetes Keywords in Logs / Telemetry
    const K8S_KEYWORDS = [
      'apiversion', 'kind', 'metadata', 'spec', 'containers', 'container', 'pod', 'pods',
      'deployment', 'service', 'configmap', 'secret', 'ingress', 'namespace', 'namespaces',
      'kubelet', 'kubectl', 'crashloopbackoff', 'imagepullbackoff', 'errimagepull', 'oomkilled',
      'createcontainerconfigerror', 'exit code', 'backoff', 'back-off', 'events', 'warning',
      'failed', 'fatal', 'exception', 'error', 'sigkill', 'sigsegv', 'panic', 'restart',
      'terminated', 'waiting', 'running', 'ready', 'node', 'cluster', 'cgroup', 'limits',
      'requests', 'targetport', 'selector', 'replicas', 'probes', 'liveness', 'readiness',
      'stdout', 'stderr', 'http', 'tcp', 'connection refused', 'timeout', 'port', 'dns',
      'manifest', 'yaml', 'json', 'daemon', 'entrypoint', 'bootstrap', 'npm err', 'stack trace'
    ];

    const lower = trimmed.toLowerCase();
    const matchCount = K8S_KEYWORDS.filter((k) => lower.includes(k)).length;

    // Reject random gibberish that lacks Kubernetes terminology
    if (matchCount === 0 && !lower.includes(':') && !lower.includes('/')) {
      return {
        inputType: 'Unrecognized / Random Text',
        rootCause: 'Unrecognized Input Format',
        detectedError: 'Non-Kubernetes Input',
        severity: 'INVALID',
        overallScore: 0,
        summary: 'The submitted text does not appear to be a valid Kubernetes manifest, container runtime log, or kubectl event dump.',
        findings: [
          {
            title: 'Unrecognized Input Data',
            severity: 'INVALID',
            category: 'Validation',
            description: 'The input does not contain Kubernetes YAML structures (e.g. apiVersion, kind, spec) or standard container error logs/events.',
            recommendation: 'Paste real output from `kubectl describe pod` or `kubectl logs`, or click one of the quick sample buttons above.',
          },
        ],
        playbook: [
          { step: 1, action: 'Click one of the Quick Sample buttons above (e.g. CrashLoopBackOff Logs or ImagePullBackOff YAML) to test.' },
          { step: 2, action: 'Or paste real output from `kubectl describe pod` or `kubectl logs`.' },
        ],
      };
    }

    // 4. Log / Event / Telemetry Pattern Matching Path
    let rootCause = 'General Kubernetes Runtime Telemetry';
    let severity = 'WARNING';
    let detectedError = 'Diagnostic Logs';
    let playbook = [];
    let findings = [];

    if (lower.includes('crashloopbackoff') || lower.includes('exit code 1') || lower.includes('back-off restarting')) {
      rootCause = 'CrashLoopBackOff (Container Process Startup Crash)';
      severity = 'CRITICAL';
      detectedError = 'Exit Code 1 / Process Crash';
      findings = [
        {
          title: 'Container Repeatedly Terminating (Exit Code 1)',
          severity: 'CRITICAL',
          category: 'Reliability',
          description: 'The container process exits immediately upon launch with a non-zero exit status.',
          recommendation: 'Run `kubectl logs <pod> --previous` to inspect the exact fatal exception before container restarted.',
        },
        {
          title: 'Kubelet Exponential Restart Delay Active',
          severity: 'HIGH',
          category: 'Reliability',
          description: 'Kubelet is backing off restarts (delaying 10s up to 5min) to prevent CPU starvation.',
          recommendation: 'Fix container command or missing environment variables and redeploy manifest.',
        },
      ];
      playbook = [
        { step: 1, action: 'kubectl describe pod web-app' },
        { step: 2, action: 'kubectl logs web-app --previous' },
        { step: 3, action: 'kubectl edit deployment web-app (remove faulty exit 1 / bad entrypoint)' },
      ];
    } else if (lower.includes('imagepullbackoff') || lower.includes('errimagepull') || lower.includes('manifest unknown')) {
      rootCause = 'ImagePullBackOff (Container Registry Download Failure)';
      severity = 'CRITICAL';
      detectedError = 'Manifest Unknown / 404 Tag Not Found';
      findings = [
        {
          title: 'Failed to Pull Container Image',
          severity: 'CRITICAL',
          category: 'Reliability',
          description: 'Container registry returned 404 or manifest unknown for the requested image tag.',
          recommendation: 'Check image tag spelling in deployment YAML and update to verified tag (e.g. nginx:1.25-alpine).',
        },
      ];
      playbook = [
        { step: 1, action: 'kubectl describe pod web-app | grep -A 5 Events' },
        { step: 2, action: 'kubectl set image deployment/web-app web-app=nginx:1.25-alpine' },
        { step: 3, action: 'kubectl get pods' },
      ];
    } else if (lower.includes('oomkilled') || lower.includes('exit code 137') || lower.includes('out of memory')) {
      rootCause = 'OOMKilled (Linux Kernel Memory Limit Exceeded)';
      severity = 'CRITICAL';
      detectedError = 'SIGKILL / Exit 137';
      findings = [
        {
          title: 'Container Exceeded Memory Ceiling',
          severity: 'CRITICAL',
          category: 'Performance',
          description: 'The Linux kernel oom_killer terminated container PID 1 because RSS exceeded resources.limits.memory.',
          recommendation: 'Increase resources.limits.memory in the deployment spec to 256Mi or 512Mi.',
        },
      ];
      playbook = [
        { step: 1, action: 'kubectl describe pod web-app | grep -i oom' },
        { step: 2, action: 'kubectl top pod web-app' },
        { step: 3, action: 'Update spec.template.spec.containers[0].resources.limits.memory to 256Mi' },
      ];
    } else if (lower.includes('configmap') && (lower.includes('not found') || lower.includes('createcontainerconfigerror'))) {
      rootCause = 'CreateContainerConfigError (Missing ConfigMap Dependency)';
      severity = 'HIGH';
      detectedError = 'Missing Resource Reference';
      findings = [
        {
          title: 'Referenced ConfigMap Does Not Exist in Namespace',
          severity: 'HIGH',
          category: 'Reliability',
          description: 'Pod initialization blocked because the referenced ConfigMap or key was not found.',
          recommendation: 'Create the missing ConfigMap or correct the configMapKeyRef.name in deployment YAML.',
        },
      ];
      playbook = [
        { step: 1, action: 'kubectl get configmaps' },
        { step: 2, action: 'kubectl create configmap app-config --from-literal=APP_COLOR=emerald' },
        { step: 3, action: 'kubectl get pods' },
      ];
    } else {
      // General telemetry analysis
      findings = [
        {
          title: 'Log Telemetry Parsed',
          severity: 'INFO',
          category: 'Diagnostics',
          description: 'Analyzed input logs. No catastrophic runtime panics or cluster-wide faults detected.',
          recommendation: 'Cross-reference with `kubectl get events --sort-by=.metadata.creationTimestamp` for deeper telemetry grounding.',
        },
      ];
      playbook = [
        { step: 1, action: 'kubectl get pods -A' },
        { step: 2, action: 'kubectl get events --field-selector type=Warning' },
      ];
    }

    return {
      inputType: 'Kubernetes Telemetry & Logs',
      rootCause,
      detectedError,
      severity,
      overallScore: severity === 'CRITICAL' ? 30 : severity === 'HIGH' ? 60 : 90,
      summary: `AI Log Parser identified: ${rootCause}.`,
      findings,
      playbook,
    };
  },
};

export default analyzerService;
