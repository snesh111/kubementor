import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import validationService from '../validation/validationService.js';

/**
 * @desc    Redeploy corrected files & execute solution validation
 * @route   POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/validate
 * @access  Private
 */
export const validateFix = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;
  const { fileIds } = req.body;

  const result = await validationService.validateUserFix(projectId, attemptId, fileIds, req.user._id);

  return ApiResponse.success(res, 'Solution validation executed successfully', result, 200);
});

/**
 * @desc    Get latest validation result for scenario attempt
 * @route   GET /api/v1/projects/:projectId/scenario-attempts/:attemptId/validation
 * @access  Private
 */
export const getLatestResult = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;

  const result = await validationService.getLatestValidationResult(projectId, attemptId, req.user._id);

  return ApiResponse.success(res, 'Latest validation result retrieved', result, 200);
});

/**
 * @desc    Get validation history for scenario attempt
 * @route   GET /api/v1/projects/:projectId/scenario-attempts/:attemptId/validations
 * @access  Private
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { projectId, attemptId } = req.params;

  const history = await validationService.getValidationHistory(projectId, attemptId, req.user._id);

  return ApiResponse.success(res, 'Validation history retrieved', history, 200);
});
