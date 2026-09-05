import Project from '../models/Project.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import FailureScenario from '../models/FailureScenario.js';
import scenarioRegistry from './scenarioRegistry.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const validateScenarioStartRequest = async (projectId, scenarioId, deploymentId, userId) => {
  // 1. Verify project ownership
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) {
    throw new ApiError('Project not found or not accessible', 404);
  }

  // 2. Verify scenario exists in database or registry
  if (!scenarioRegistry.hasInjector(scenarioId)) {
    throw new ApiError(`Scenario '${scenarioId}' is not registered in the system.`, 404);
  }

  // 3. Verify deployment belongs to project and user
  const deployment = await DeploymentRecord.findOne({
    _id: deploymentId,
    project: projectId,
    user: userId,
  });

  if (!deployment) {
    throw new ApiError('Deployment record not found or not accessible', 404);
  }

  if (deployment.status === 'stopped') {
    throw new ApiError('Cannot inject failure into a stopped sandbox. Please deploy to sandbox first.', 400);
  }

  return { project, deployment };
};

export default { validateScenarioStartRequest };
