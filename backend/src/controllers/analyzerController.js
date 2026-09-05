import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import analyzerService from '../analyzer/analyzerService.js';

/**
 * @desc    Analyze selected project files
 * @route   POST /api/v1/projects/:projectId/analyze
 * @access  Private
 */
export const analyzeProjectFiles = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { fileIds } = req.body;

  const report = await analyzerService.analyzeProjectFiles(projectId, req.user._id, fileIds);

  return ApiResponse.success(res, 'Kubernetes deployment readiness analysis completed', { report }, 201);
});

/**
 * @desc    Get analysis history for a project
 * @route   GET /api/v1/projects/:projectId/analysis
 * @access  Private
 */
export const getAnalysisHistory = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const history = await analyzerService.getProjectAnalysisHistory(projectId, req.user._id);

  return ApiResponse.success(res, 'Analysis history retrieved successfully', { history }, 200);
});

/**
 * @desc    Get single complete analysis report by ID
 * @route   GET /api/v1/projects/:projectId/analysis/:analysisId
 * @access  Private
 */
export const getAnalysisReportById = asyncHandler(async (req, res) => {
  const { projectId, analysisId } = req.params;
  const report = await analyzerService.getAnalysisReportById(projectId, analysisId, req.user._id);

  return ApiResponse.success(res, 'Analysis report retrieved successfully', { report }, 200);
});
