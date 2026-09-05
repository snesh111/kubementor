import scenarioRegistry from './scenarioRegistry.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import contextService from '../context/contextService.js';
import aiService from '../ai/aiService.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const scenarioEngine = {
  /**
   * Execute controlled failure injection and verify resulting Kubernetes state
   */
  startScenario: async (project, deployment, scenarioDoc, userId) => {
    const scenarioId = scenarioDoc.scenarioId;
    const injector = scenarioRegistry.getInjector(scenarioId);

    if (!injector) {
      throw new ApiError(`No injector registered for scenario '${scenarioId}'.`, 404);
    }

    // Count existing attempts for attemptNumber
    const attemptCount = await ScenarioAttempt.countDocuments({
      user: userId,
      project: project._id,
      scenarioId,
    });

    // Create ScenarioAttempt record in DB (status: preparing)
    const attemptDoc = await ScenarioAttempt.create({
      user: userId,
      project: project._id,
      deployment: deployment._id,
      scenarioId,
      scenarioName: scenarioDoc.name,
      status: 'preparing',
      attemptNumber: attemptCount + 1,
      expectedState: scenarioDoc.expectedFailure,
    });

    try {
      // 1. Prepare & Inject Failure
      attemptDoc.status = 'injecting';
      await attemptDoc.save();

      const injectionDetails = await injector.inject(deployment.namespace, deployment);
      attemptDoc.injectionDetails = injectionDetails;
      attemptDoc.failureInjectedAt = new Date();

      // 2. Verify resulting Kubernetes failure state
      const verification = await injector.verifyFailure(deployment.namespace, deployment);
      attemptDoc.actualState = verification.actualState;

      if (verification.verified) {
        attemptDoc.status = 'active'; // Controlled failure active in sandbox
        await attemptDoc.save();

        // 3. Automatically generate initial ContextSnapshot & trigger proactive AI Diagnosis
        try {
          await contextService.generateAndSaveSnapshot(project._id, attemptDoc._id, userId);
          await aiService.diagnoseAttempt(project._id, attemptDoc._id, userId);
        } catch (ctxErr) {
          console.warn('[ScenarioEngine] Automatic context snapshot or AI diagnosis warning:', ctxErr.message);
        }
      } else {
        attemptDoc.status = 'failed';
        attemptDoc.errorMessage = 'Verification timed out: failure state could not be confirmed in Kubernetes.';
        await attemptDoc.save();
      }

      return attemptDoc.toResponseObject();
    } catch (err) {
      attemptDoc.status = 'failed';
      attemptDoc.errorMessage = err.message;
      await attemptDoc.save();
      throw new ApiError(`Scenario Injection Failed: ${err.message}`, 400);
    }
  },

  /**
   * Cancel active scenario attempt and restore original K8s configuration
   */
  cancelScenario: async (attemptId, projectId, userId) => {
    const attempt = await ScenarioAttempt.findOne({
      _id: attemptId,
      project: projectId,
      user: userId,
    }).populate('deployment');

    if (!attempt) {
      throw new ApiError('Scenario attempt not found or not accessible', 404);
    }

    if (attempt.status === 'cancelled') {
      return attempt.toResponseObject();
    }

    const injector = scenarioRegistry.getInjector(attempt.scenarioId);
    if (injector && attempt.injectionDetails && attempt.deployment) {
      try {
        const restoration = await injector.restore(attempt.deployment.namespace, attempt.injectionDetails);
        attempt.restorationDetails = restoration;
      } catch (err) {
        console.error(`[ScenarioEngine] Restoration error on ${attempt.scenarioId}:`, err.message);
      }
    }

    attempt.status = 'cancelled';
    await attempt.save();
    return attempt.toResponseObject();
  },
};

export default scenarioEngine;
