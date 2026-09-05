import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import projectFileService from '../services/projectFileService.js';

/**
 * @desc    Upload a new project file
 * @route   POST /api/v1/projects/:projectId/files
 * @access  Private
 */
export const uploadFile = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const fileObject = req.file;
  const textContentOverride = req.body?.content;

  const result = await projectFileService.uploadFile(
    projectId,
    req.user._id,
    fileObject,
    textContentOverride
  );

  return ApiResponse.success(res, 'File uploaded successfully', { file: result }, 201);
});

/**
 * @desc    Get all files for a project
 * @route   GET /api/v1/projects/:projectId/files
 * @access  Private
 */
export const getProjectFiles = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const files = await projectFileService.getProjectFiles(projectId, req.user._id);

  return ApiResponse.success(res, 'Project files retrieved successfully', { files }, 200);
});

/**
 * @desc    Get file details and content
 * @route   GET /api/v1/projects/:projectId/files/:fileId
 * @access  Private
 */
export const getFileDetails = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;
  const file = await projectFileService.getFileDetails(projectId, fileId, req.user._id);

  return ApiResponse.success(res, 'File details retrieved successfully', { file }, 200);
});

/**
 * @desc    Replace/update an existing file
 * @route   PUT /api/v1/projects/:projectId/files/:fileId
 * @access  Private
 */
export const replaceFile = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;
  const fileObject = req.file;
  const textContentOverride = req.body?.content;

  const file = await projectFileService.replaceFile(
    projectId,
    fileId,
    req.user._id,
    fileObject,
    textContentOverride
  );

  return ApiResponse.success(res, 'File updated successfully', { file }, 200);
});

/**
 * @desc    Delete a project file
 * @route   DELETE /api/v1/projects/:projectId/files/:fileId
 * @access  Private
 */
export const deleteFile = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;
  await projectFileService.deleteFile(projectId, fileId, req.user._id);

  return ApiResponse.success(res, 'File deleted successfully', null, 200);
});
