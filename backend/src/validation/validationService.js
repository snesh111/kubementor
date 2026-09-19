import Project from '../models/Project.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import ContextSnapshot from '../models/ContextSnapshot.js';
import ValidationResult from '../models/ValidationResult.js';
import ProjectFile from '../models/ProjectFile.js';
import FailureScenario from '../models/FailureScenario.js';
import LabNote from '../models/LabNote.js';
import deploymentService from '../kubernetes/deploymentService.js';
import contextService from '../context/contextService.js';
import progressService from '../services/progressService.js';
import solutionValidator from './solutionValidator.js';
import { compareSnapshots } from './stateComparator.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const validationService = {
  /**
   * Execute solution validation flow: optionally redeploy -> poll K8s -> fresh snapshot -> validate rules -> save result
   */
  validateUserFix: async (projectId, attemptId, fileIds, userId, options = {}) => {
    // 1. Verify project ownership
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    // 2. Fetch scenario attempt & populate deployment
    const attempt = await ScenarioAttempt.findOne({
      _id: attemptId,
      project: projectId,
      user: userId,
    }).populate('deployment');

    if (!attempt) {
      throw new ApiError('Scenario attempt not found or not accessible', 404);
    }

    const deploymentRecord = attempt.deployment;
    if (!deploymentRecord) {
      throw new ApiError('Associated deployment record not found', 404);
    }

    const namespace = deploymentRecord.namespace;

    // 3. Optionally redeploy user's modified files if explicitly requested
    if (fileIds && fileIds.length > 0) {
      const filesToDeploy = await ProjectFile.find({
        _id: { $in: fileIds },
        project: projectId,
      });
      if (filesToDeploy.length === 0) {
        throw new ApiError('No valid project files selected for redeployment', 400);
      }
      try {
        await deploymentService.deployManifests(namespace, filesToDeploy);
      } catch (deployErr) {
        throw new ApiError(`Sandbox Redeployment Failed: ${deployErr.message}`, 400);
      }
    }

    // 4. Poll K8s sandbox stability
    let durationMs = 0;
    let latestStatus = null;
    try {
      const pollResult = await solutionValidator.pollSandboxStability(namespace);
      durationMs = pollResult.durationMs;
      latestStatus = pollResult.latestStatus;
    } catch (pollErr) {
      console.warn('[ValidationService] Stability polling non-critical warning:', pollErr.message);
    }

    // 5. Collect fresh ContextSnapshot (AFTER state)
    let afterSnapshot = null;
    try {
      const afterSnapshotResult = await contextService.generateAndSaveSnapshot(projectId, attemptId, userId);
      afterSnapshot = await ContextSnapshot.findById(afterSnapshotResult.snapshotId);
    } catch (snapErr) {
      // If snapshot generation failed due to infrastructure error
      const attemptCount = await ValidationResult.countDocuments({
        scenarioAttempt: attemptId,
        user: userId,
      });

      const errorValDoc = await ValidationResult.create({
        user: userId,
        project: projectId,
        deployment: deploymentRecord._id,
        scenarioAttempt: attemptId,
        scenario: attempt.scenarioId,
        status: 'ERROR',
        summary: 'Validation could not be completed due to an unexpected backend issue. Please retry.',
        checks: [],
        score: 0,
        evidence: [`Telemetry Error: ${snapErr.message}`],
        nextAction: 'Retry validation or check terminal status.',
        errorMessage: snapErr.message,
        attemptNumber: attemptCount + 1,
        durationMs,
        validatedAt: new Date(),
      });

      return {
        validationId: errorValDoc._id,
        scenarioId: attempt.scenarioId,
        status: 'ERROR',
        summary: errorValDoc.summary,
        checks: [],
        score: 0,
        evidence: errorValDoc.evidence,
        nextAction: errorValDoc.nextAction,
        attemptNumber: errorValDoc.attemptNumber,
        durationMs,
        validatedAt: errorValDoc.validatedAt,
      };
    }

    // 6. Retrieve initial failure ContextSnapshot (BEFORE state)
    let beforeSnapshot = await ContextSnapshot.findOne({
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
    }).sort({ createdAt: 1 }); // Oldest snapshot for this attempt

    if (!beforeSnapshot) {
      beforeSnapshot = afterSnapshot;
    }

    // 7. Run deterministic rule validation
    const evalResult = solutionValidator.validateSolution(attempt.scenarioId, beforeSnapshot, afterSnapshot);

    // 8. Deterministic score calculation
    const passCount = evalResult.checks.filter((c) => c.status === 'PASS').length;
    const totalCount = evalResult.checks.length || 1;
    let score = 0;

    if (evalResult.status === 'PASS') {
      const pod = afterSnapshot?.context?.pods?.[0] || {};
      const restarts = pod.restarts || 0;
      const stabilityBonus = restarts === 0 ? 8 : Math.max(0, 8 - restarts * 2);
      score = Math.min(100, Math.max(90, Math.round(92 + stabilityBonus)));
    } else if (evalResult.status === 'PARTIAL') {
      score = Math.round((passCount / totalCount) * 70);
    } else {
      score = Math.round((passCount / totalCount) * 45);
    }

    // Count previous validation attempts
    const attemptCount = await ValidationResult.countDocuments({
      scenarioAttempt: attemptId,
      user: userId,
    });

    // 9. Fetch Learner Scratchpad Notes & Scenario Doc for Post-Mortem
    const learnerNotes = await LabNote.findOne({ user: userId, labId: attempt.scenarioId });
    const scenarioDoc = await FailureScenario.findOne({ scenarioId: attempt.scenarioId });

    let postMortemData = null;
    if (evalResult.status === 'PASS') {
      postMortemData = {
        scenarioId: attempt.scenarioId,
        scenarioName: scenarioDoc?.name || attempt.scenarioName || 'Kubernetes Troubleshooting Lab',
        resolvedAt: new Date(),
        score,
        durationMs,
        attemptNumber: attemptCount + 1,
        sections: [
          {
            title: '1. Failure Condition Identified',
            content: scenarioDoc?.description || 'The container workload entered an unready/failing state.',
            category: scenarioDoc?.category || 'Reliability',
          },
          {
            title: '2. Observed Telemetry Evidence',
            content:
              learnerNotes?.evidence ||
              evalResult.evidence?.join('; ') ||
              'Runtime pod telemetry, container logs, and Kubernetes events revealed anomalous exit codes and configuration mismatches.',
            source: learnerNotes?.evidence ? 'Learner Scratchpad + Telemetry' : 'Runtime Telemetry',
          },
          {
            title: '3. Root Cause Analysis',
            content:
              learnerNotes?.rootCause ||
              evalResult.summary ||
              'Underlying manifest configuration or resource constraint caused Kubernetes to fail container health/routing.',
            source: learnerNotes?.rootCause ? 'Learner Scratchpad' : 'Deterministic Analysis',
          },
          {
            title: '4. Applied Solution & Fix',
            content:
              learnerNotes?.plannedFix ||
              'Corrected YAML manifest specification applied and synchronized into the sandbox namespace.',
            source: learnerNotes?.plannedFix ? 'Learner Scratchpad' : 'Manifest Deployment',
          },
          {
            title: '5. Runtime Proof & Health Confirmation',
            content: `All ${evalResult.checks.length} runtime checks verified: ${evalResult.checks
              .map((c) => `${c.name}: ${c.actual}`)
              .join(', ')}`,
            passedChecks: evalResult.checks.map((c) => c.name),
          },
          {
            title: '6. Key Takeaway & Future Prevention',
            content:
              scenarioDoc?.concept?.takeaway ||
              'Always inspect container exit codes, termination states, and readiness probes before making resource modifications.',
          },
        ],
        scratchpadNotes: {
          evidence: learnerNotes?.evidence || '',
          hypothesis: learnerNotes?.hypothesis || '',
          rootCause: learnerNotes?.rootCause || '',
          plannedFix: learnerNotes?.plannedFix || '',
          result: learnerNotes?.result || '',
          generalNotes: learnerNotes?.generalNotes || '',
        },
      };
    }

    // Extract sanitized deployment & runtime state
    const afterCtx = afterSnapshot?.context || {};
    const pod = afterCtx.pods?.[0] || {};
    const deploymentState = {
      name: afterCtx.deployment?.name || 'web-app',
      replicas: afterCtx.deployment?.replicas ?? 1,
      availableReplicas: afterCtx.deployment?.availableReplicas ?? 0,
      ready: pod.ready ?? false,
    };
    const runtimeState = {
      phase: pod.phase || 'Unknown',
      ready: pod.ready ?? false,
      restarts: pod.restarts ?? 0,
      exitCode: pod.containers?.[0]?.exitCode ?? null,
      serviceEndpoints: afterCtx.services?.[0]?.endpointCount ?? 0,
    };

    // 10. Create ValidationResult document
    const valResultDoc = await ValidationResult.create({
      user: userId,
      project: projectId,
      deployment: deploymentRecord._id,
      scenarioAttempt: attemptId,
      beforeContextSnapshot: beforeSnapshot._id,
      afterContextSnapshot: afterSnapshot._id,
      scenario: attempt.scenarioId,
      status: evalResult.status,
      summary: evalResult.summary,
      checks: evalResult.checks,
      score,
      evidence: evalResult.evidence || [],
      nextAction: evalResult.nextAction || null,
      deploymentState,
      runtimeState,
      changedResources: deploymentRecord.resources?.map((r) => `${r.kind}/${r.name}`) || [],
      postMortem: postMortemData,
      attemptNumber: attemptCount + 1,
      durationMs,
      validatedAt: new Date(),
    });

    // Update ScenarioAttempt status if PASS
    if (evalResult.status === 'PASS') {
      attempt.status = 'completed';
      await attempt.save();
    }

    // Record authoritative progress event (for guided scenarios)
    try {
      if (!project.isBYOA && attempt.scenarioId !== 'byoa') {
        await progressService.recordValidationEvent(userId, attempt.scenarioId, valResultDoc);
      }
    } catch (progErr) {
      console.warn('[ValidationService] Progress tracking update warning:', progErr.message);
    }

    // Compute comparison diff
    const comparison = compareSnapshots(beforeSnapshot, afterSnapshot);

    return {
      validationId: valResultDoc._id,
      scenarioId: attempt.scenarioId,
      scenarioName: scenarioDoc?.name || attempt.scenarioName || 'Lab Scenario',
      status: valResultDoc.status,
      summary: valResultDoc.summary,
      checks: valResultDoc.checks,
      score: valResultDoc.score,
      evidence: valResultDoc.evidence,
      nextAction: valResultDoc.nextAction,
      deploymentState: valResultDoc.deploymentState,
      runtimeState: valResultDoc.runtimeState,
      changedResources: valResultDoc.changedResources,
      postMortem: valResultDoc.postMortem,
      attemptNumber: valResultDoc.attemptNumber,
      durationMs: valResultDoc.durationMs,
      validatedAt: valResultDoc.validatedAt,
      comparison,
      afterSnapshotId: afterSnapshot._id,
      contextVersion: afterSnapshot.contextVersion || '1.0',
    };
  },

  /**
   * Get latest validation result for scenario attempt
   */
  getLatestValidationResult: async (projectId, attemptId, userId) => {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    const valDoc = await ValidationResult.findOne({
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
    }).sort({ createdAt: -1 });

    if (!valDoc) {
      return null;
    }

    return valDoc.toResponseObject();
  },

  /**
   * Get validation history for scenario attempt
   */
  getValidationHistory: async (projectId, attemptId, userId) => {
    const history = await ValidationResult.find({
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
    }).sort({ createdAt: -1 });

    return history.map((h) => h.toResponseObject());
  },

  /**
   * Get specific validation attempt by ID
   */
  getValidationAttemptById: async (projectId, attemptId, validationId, userId) => {
    const valDoc = await ValidationResult.findOne({
      _id: validationId,
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
    });

    if (!valDoc) {
      throw new ApiError('Validation attempt record not found', 404);
    }

    return valDoc.toResponseObject();
  },

  /**
   * Build or retrieve guided post-mortem report for successful attempt
   */
  buildPostMortem: async (projectId, attemptId, userId) => {
    const valDoc = await ValidationResult.findOne({
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
      status: 'PASS',
    }).sort({ createdAt: -1 });

    if (!valDoc) {
      throw new ApiError('No passed validation found for this scenario attempt to build post-mortem', 404);
    }

    return valDoc.postMortem;
  },
};

export default validationService;
