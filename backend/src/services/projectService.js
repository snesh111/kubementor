import Project from '../models/Project.js';
import ProjectFile from '../models/ProjectFile.js';
import AnalysisReport from '../models/AnalysisReport.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import ScenarioAttempt from '../models/ScenarioAttempt.js';
import ContextSnapshot from '../models/ContextSnapshot.js';
import AIConversation from '../models/AIConversation.js';
import ValidationResult from '../models/ValidationResult.js';
import namespaceService from '../kubernetes/namespaceService.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const projectService = {
  /**
   * Create a new project for the authenticated user
   * @param {string} ownerId - User ID from JWT
   * @param {Object} projectData - { name, description, status }
   * @returns {Object} Created project document
   */
  createProject: async (ownerId, { name, description, status }) => {
    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      owner: ownerId,
      status: status || 'draft',
    });

    return project.toResponseObject();
  },

  /**
   * Get all projects belonging strictly to the authenticated user
   * @param {string} ownerId - User ID from JWT
   * @returns {Array} List of projects
   */
  getUserProjects: async (ownerId) => {
    const projects = await Project.find({ owner: ownerId }).sort({ updatedAt: -1 });
    return projects.map((p) => p.toResponseObject());
  },

  /**
   * Get a specific project by ID if it belongs to the authenticated user
   * @param {string} projectId - Project ObjectId
   * @param {string} ownerId - User ID from JWT
   * @returns {Object} Project document
   */
  getProjectById: async (projectId, ownerId) => {
    const project = await Project.findOne({ _id: projectId, owner: ownerId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }
    return project.toResponseObject();
  },

  /**
   * Update a specific project by ID if it belongs to the authenticated user
   * @param {string} projectId - Project ObjectId
   * @param {string} ownerId - User ID from JWT
   * @param {Object} updateData - { name, description, status }
   * @returns {Object} Updated project document
   */
  updateProject: async (projectId, ownerId, { name, description, status }) => {
    const project = await Project.findOne({ _id: projectId, owner: ownerId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status !== undefined) project.status = status;

    await project.save();
    return project.toResponseObject();
  },

  /**
   * Delete a specific project by ID with cascading cleanup of files, sandbox namespaces, snapshots & results
   * @param {string} projectId - Project ObjectId
   * @param {string} ownerId - User ID from JWT
   * @returns {boolean} True if deleted
   */
  deleteProject: async (projectId, ownerId) => {
    const project = await Project.findOne({ _id: projectId, owner: ownerId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    // 1. Clean up K8s sandbox namespace if active
    const activeDeployment = await DeploymentRecord.findOne({ project: projectId, user: ownerId });
    if (activeDeployment && activeDeployment.namespace) {
      try {
        await namespaceService.deleteSandboxNamespace(activeDeployment.namespace);
      } catch (err) {
        console.warn(`[Project Cleanup] Could not delete K8s namespace ${activeDeployment.namespace}:`, err.message);
      }
    }

    // 2. Cascading deletion of associated MongoDB resources
    await Promise.all([
      ProjectFile.deleteMany({ project: projectId, owner: ownerId }),
      AnalysisReport.deleteMany({ project: projectId, user: ownerId }),
      DeploymentRecord.deleteMany({ project: projectId, user: ownerId }),
      ScenarioAttempt.deleteMany({ project: projectId, user: ownerId }),
      ContextSnapshot.deleteMany({ project: projectId, user: ownerId }),
      AIConversation.deleteMany({ project: projectId, user: ownerId }),
      ValidationResult.deleteMany({ project: projectId, user: ownerId }),
      Project.deleteOne({ _id: projectId, owner: ownerId }),
    ]);

    return true;
  },
};

export default projectService;
