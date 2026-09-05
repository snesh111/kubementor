import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import scenarioService from '../scenarios/scenarioService.js';

/**
 * @desc    Get all available failure scenarios
 * @route   GET /api/v1/projects/:projectId/scenarios
 * @access  Private
 */
export const getScenarios = asyncHandler(async (req, res) => {
  const scenarios = await scenarioService.getScenarios();
  return ApiResponse.success(res, 'Scenarios retrieved successfully', { scenarios }, 200);
});

/**
 * @desc    Get scenario details by ID
 * @route   GET /api/v1/projects/:projectId/scenarios/:scenarioId
 * @access  Private
 */
export const getScenarioById = asyncHandler(async (req, res) => {
  const { scenarioId } = req.params;
  const scenario = await scenarioService.getScenarioById(scenarioId);
  return ApiResponse.success(res, 'Scenario details retrieved successfully', { scenario }, 200);
});

/**
 * @desc    Start failure scenario injection
 * @route   POST /api/v1/projects/:projectId/scenarios/:scenarioId/start
 * @access  Private
 */
export const startScenario = asyncHandler(async (req, res) => {
  const { projectId, scenarioId } = req.params;
  const { deploymentId } = req.body;

  const attempt = await scenarioService.startScenario(projectId, scenarioId, deploymentId, req.user._id);

  return ApiResponse.success(res, `Failure scenario '${scenarioId}' started successfully`, { attempt }, 201);
});

/**
 * @desc    Get user's scenario attempts for project
 * @route   GET /api/v1/projects/:projectId/scenario-attempts
 * @access  Private
 */
export const getScenarioAttempts = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const attempts = await scenarioService.getScenarioAttempts(projectId, req.user._id);

  return ApiResponse.success(res, 'Scenario attempts retrieved successfully', { attempts }, 200);
});

/**
 * @desc    Get single scenario attempt by ID
 * @route   GET /api/v1/projects/:projectId/scenario-attempts/:attemptId
 * @access  Private
 */
export const getScenarioAttemptById = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;
  const attempt = await scenarioService.getScenarioAttemptById(projectId, attemptId, req.user._id);

  return ApiResponse.success(res, 'Scenario attempt details retrieved successfully', { attempt }, 200);
});

/**
 * @desc    Cancel scenario attempt & restore K8s config
 * @route   POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/cancel
 * @access  Private
 */
export const cancelScenarioAttempt = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;
  const attempt = await scenarioService.cancelScenarioAttempt(projectId, attemptId, req.user._id);

  return ApiResponse.success(res, 'Scenario attempt cancelled and configuration restored', { attempt }, 200);
});
