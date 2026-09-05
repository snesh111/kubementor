import statusService from '../kubernetes/statusService.js';
import validationRules from './validationRules.js';

const TIMEOUT_SECONDS = parseInt(process.env.VALIDATION_TIMEOUT_SECONDS || '15', 10);
const POLL_INTERVAL_MS = parseInt(process.env.VALIDATION_POLL_INTERVAL_MS || '2000', 10);

export const solutionValidator = {
  /**
   * Poll Kubernetes sandbox until workload stabilizes or timeout is reached
   */
  pollSandboxStability: async (namespace) => {
    const startTime = Date.now();
    const timeoutMs = TIMEOUT_SECONDS * 1000;

    let latestStatus = null;

    while (Date.now() - startTime < timeoutMs) {
      latestStatus = await statusService.getSandboxStatus(namespace);
      const pod = latestStatus.pods?.[0];

      if (pod && pod.phase === 'Running' && pod.ready) {
        // Workload is Ready, break polling early!
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    return {
      durationMs: Date.now() - startTime,
      latestStatus,
    };
  },

  /**
   * Run validation logic against BEFORE and AFTER ContextSnapshots
   */
  validateSolution: (scenarioId, beforeSnapshot, afterSnapshot) => {
    return validationRules.evaluateScenarioSolution(scenarioId, beforeSnapshot, afterSnapshot);
  },
};

export default solutionValidator;
