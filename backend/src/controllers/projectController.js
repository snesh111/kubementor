import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import projectService from '../services/projectService.js';
import {
  validateProjectCreate,
  validateProjectUpdate,
} from '../validators/projectValidator.js';

/**
 * @desc    Create a new project
 * @route   POST /api/v1/projects
 * @access  Private
 */
export const createProject = asyncHandler(async (req, res) => {
  const { valid, errors } = validateProjectCreate(req.body);
  if (!valid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const project = await projectService.createProject(req.user._id, req.body);
  return ApiResponse.success(res, 'Project created successfully', { project }, 201);
});

/**
 * @desc    Get all projects belonging to authenticated user
 * @route   GET /api/v1/projects
 * @access  Private
 */
export const getUserProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getUserProjects(req.user._id);
  return ApiResponse.success(res, 'Projects retrieved successfully', { projects }, 200);
});

/**
 * @desc    Get a specific project by ID
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id, req.user._id);
  return ApiResponse.success(res, 'Project retrieved successfully', { project }, 200);
});

/**
 * @desc    Update a specific project by ID
 * @route   PUT /api/v1/projects/:id
 * @access  Private
 */
export const updateProject = asyncHandler(async (req, res) => {
  const { valid, errors } = validateProjectUpdate(req.body);
  if (!valid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const project = await projectService.updateProject(req.params.id, req.user._id, req.body);
  return ApiResponse.success(res, 'Project updated successfully', { project }, 200);
});

/**
 * @desc    Delete a specific project by ID
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user._id);
  return ApiResponse.success(res, 'Project deleted successfully', null, 200);
});
