import contextCollector from './contextCollector.js';
import { buildStructuredContext, computeManifestDiff } from './contextBuilder.js';
import { buildHumanSummary } from './contextSummarizer.js';
import ContextSnapshot from '../models/ContextSnapshot.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import FailureScenario from '../models/FailureScenario.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import Project from '../models/Project.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const contextService = {
  /**
   * Generate and persist a new ContextSnapshot for a scenario attempt
   */
  generateAndSaveSnapshot: async (projectId, attemptId, userId) => {
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

    const deploymentId = attempt.deployment?._id || attempt.deployment;
    const deploymentRecord = await DeploymentRecord.findById(deploymentId);
    if (!deploymentRecord) {
      throw new ApiError('Associated deployment record not found', 404);
    }

    // 3. Fetch scenario definition metadata
    const scenarioDoc = await FailureScenario.findOne({ scenarioId: attempt.scenarioId });

    const namespace = deploymentRecord.namespace;

    // 4. Collect context components from Kubernetes sandbox
    const scenarioContext = contextCollector.collectScenarioContext(attempt, scenarioDoc);
    const namespaceContext = contextCollector.collectNamespaceContext(deploymentRecord);
    const deploymentContext = await contextCollector.collectDeploymentContext(namespace, deploymentRecord);
    const podContext = await contextCollector.collectPodContext(namespace);
    const logContext = await contextCollector.collectLogContext(namespace, podContext);
    const eventContext = await contextCollector.collectEventContext(namespace);
    const serviceContext = await contextCollector.collectServiceContext(namespace);
    const ingressContext = await contextCollector.collectIngressContext(namespace);
    const configMapContext = await contextCollector.collectConfigMapContext(namespace);

    // Compute manifest diff
    const manifestDiff = computeManifestDiff(attempt.injectionDetails);

    // 5. Build structured & sanitized JSON context
    const structuredContext = buildStructuredContext({
      projectId,
      deploymentId: deploymentRecord._id,
      scenarioAttemptId: attempt._id,
      scenarioContext,
      namespaceContext,
      deploymentContext,
      podContext,
      logContext,
      eventContext,
      serviceContext,
      ingressContext,
      configMapContext,
      manifestDiff,
    });

    // 6. Save ContextSnapshot document in MongoDB
    const snapshot = await ContextSnapshot.create({
      project: projectId,
      user: userId,
      deployment: deploymentRecord._id,
      scenarioAttempt: attempt._id,
      contextVersion: '1.0',
      context: structuredContext,
      generatedAt: new Date(),
    });

    const humanSummary = buildHumanSummary(structuredContext);

    return {
      snapshotId: snapshot._id,
      generatedAt: snapshot.generatedAt,
      contextVersion: snapshot.contextVersion,
      summary: humanSummary,
      context: structuredContext,
    };
  },

  /**
   * Get latest context snapshot for scenario attempt
   */
  getContextByAttemptId: async (projectId, attemptId, userId) => {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    let snapshot = await ContextSnapshot.findOne({
      scenarioAttempt: attemptId,
      project: projectId,
      user: userId,
    }).sort({ createdAt: -1 });

    if (!snapshot) {
      // If snapshot doesn't exist yet, generate it automatically
      return await contextService.generateAndSaveSnapshot(projectId, attemptId, userId);
    }

    const humanSummary = buildHumanSummary(snapshot.context);

    return {
      snapshotId: snapshot._id,
      generatedAt: snapshot.generatedAt,
      contextVersion: snapshot.contextVersion,
      summary: humanSummary,
      context: snapshot.context,
    };
  },
};

export default contextService;
