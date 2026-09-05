import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import k8sService from '../kubernetes/k8sService.js';

/**
 * @desc    Deploy project files to Kubernetes Sandbox
 * @route   POST /api/v1/projects/:projectId/deploy
 * @access  Private
 */
export const deployToSandbox = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { fileIds } = req.body;

  const deploymentRecord = await k8sService.deployToSandbox(projectId, req.user._id, fileIds);

  return ApiResponse.success(res, 'Deployment to sandbox initiated successfully', { deployment: deploymentRecord }, 201);
});

/**
 * @desc    Get deployment history for project
 * @route   GET /api/v1/projects/:projectId/deployments
 * @access  Private
 */
export const getDeploymentHistory = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const deployments = await k8sService.getDeploymentHistory(projectId, req.user._id);

  return ApiResponse.success(res, 'Deployment history retrieved successfully', { deployments }, 200);
});

/**
 * @desc    Get specific deployment record details
 * @route   GET /api/v1/projects/:projectId/deployments/:deploymentId
 * @access  Private
 */
export const getDeploymentById = asyncHandler(async (req, res) => {
  const { projectId, deploymentId } = req.params;
  const deployment = await k8sService.getDeploymentById(projectId, deploymentId, req.user._id);

  return ApiResponse.success(res, 'Deployment details retrieved successfully', { deployment }, 200);
});

/**
 * @desc    Get live status of sandbox deployment
 * @route   GET /api/v1/projects/:projectId/deployments/:deploymentId/status
 * @access  Private
 */
export const getSandboxStatus = asyncHandler(async (req, res) => {
  const { projectId, deploymentId } = req.params;
  const statusData = await k8sService.getSandboxLiveStatus(projectId, deploymentId, req.user._id);

  return ApiResponse.success(res, 'Sandbox live status retrieved successfully', statusData, 200);
});

/**
 * @desc    Stop sandbox deployment and clean up namespace
 * @route   DELETE /api/v1/projects/:projectId/deployments/:deploymentId
 * @access  Private
 */
export const stopAndCleanupSandbox = asyncHandler(async (req, res) => {
  const { projectId, deploymentId } = req.params;
  const result = await k8sService.stopAndCleanupSandbox(projectId, deploymentId, req.user._id);

  return ApiResponse.success(res, result.message, null, 200);
});
