import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import contextService from '../context/contextService.js';

/**
 * @desc    Get current sanitized context snapshot for scenario attempt
 * @route   GET /api/v1/projects/:projectId/scenario-attempts/:attemptId/context
 * @access  Private
 */
export const getContextSnapshot = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;

  const snapshotData = await contextService.getContextByAttemptId(projectId, attemptId, req.user._id);

  return ApiResponse.success(res, 'Context snapshot retrieved successfully', snapshotData, 200);
});

/**
 * @desc    Recollect live Kubernetes state and refresh context snapshot
 * @route   POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/context/refresh
 * @access  Private
 */
export const refreshContextSnapshot = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;

  const newSnapshot = await contextService.generateAndSaveSnapshot(projectId, attemptId, req.user._id);

  return ApiResponse.success(res, 'Context snapshot refreshed successfully', newSnapshot, 200);
});
