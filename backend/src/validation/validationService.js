import Project from '../models/Project.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import ContextSnapshot from '../models/ContextSnapshot.js';
import ValidationResult from '../models/ValidationResult.js';
import ProjectFile from '../models/ProjectFile.js';
import deploymentService from '../kubernetes/deploymentService.js';
import contextService from '../context/contextService.js';
import solutionValidator from './solutionValidator.js';
import { compareSnapshots } from './stateComparator.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const validationService = {
  /**
   * Execute full solution validation flow: redeploy -> poll K8s -> new snapshot -> validate rules -> save result
   */
  validateUserFix: async (projectId, attemptId, fileIds, userId) => {
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

    // 3. Verify files belong to project
    let filesToDeploy = [];
    if (fileIds && fileIds.length > 0) {
      filesToDeploy = await ProjectFile.find({
        _id: { $in: fileIds },
        project: projectId,
      });
      if (filesToDeploy.length === 0) {
        throw new ApiError('No valid project files selected for redeployment', 400);
      }
    } else {
      filesToDeploy = await ProjectFile.find({ project: projectId, fileType: 'yaml' });
    }

    const namespace = deploymentRecord.namespace;

    // 4. Redeploy user's modified files into sandbox namespace
    try {
      await deploymentService.deployManifests(namespace, filesToDeploy);
    } catch (deployErr) {
      throw new ApiError(`Sandbox Redeployment Failed: ${deployErr.message}`, 400);
    }

    // 5. Poll K8s sandbox stability
    const { durationMs } = await solutionValidator.pollSandboxStability(namespace);

    // 6. Collect NEW ContextSnapshot (AFTER state)
    const afterSnapshotResult = await contextService.generateAndSaveSnapshot(projectId, attemptId, userId);
    const afterSnapshot = await ContextSnapshot.findById(afterSnapshotResult.snapshotId);

    // 7. Retrieve initial failure ContextSnapshot (BEFORE state)
    let beforeSnapshot = await ContextSnapshot.findOne({
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
    }).sort({ createdAt: 1 }); // Oldest snapshot for this attempt

    if (!beforeSnapshot) {
      beforeSnapshot = afterSnapshot;
    }

    // 8. Run deterministic rule validation
    const evalResult = solutionValidator.validateSolution(attempt.scenarioId, beforeSnapshot, afterSnapshot);

    // Count previous validation attempts
    const attemptCount = await ValidationResult.countDocuments({
      scenarioAttempt: attemptId,
      user: userId,
    });

    // 9. Create ValidationResult document
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
      attemptNumber: attemptCount + 1,
      durationMs,
      validatedAt: new Date(),
    });

    // Update ScenarioAttempt status if PASS
    if (evalResult.status === 'PASS') {
      attempt.status = 'completed';
      await attempt.save();
    }

    // Compute comparison diff
    const comparison = compareSnapshots(beforeSnapshot, afterSnapshot);

    return {
      validationId: valResultDoc._id,
      scenarioId: attempt.scenarioId,
      status: valResultDoc.status,
      summary: valResultDoc.summary,
      checks: valResultDoc.checks,
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
};

export default validationService;
