import namespaceService from './namespaceService.js';
import { parseAndEnforceSandboxManifests } from './manifestParser.js';
import deploymentService from './deploymentService.js';
import statusService from './statusService.js';
import Project from '../models/Project.js';
import ProjectFile from '../models/ProjectFile.js';
import DeploymentRecord from '../models/DeploymentRecord.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const k8sService = {
  /**
   * Deploy selected project manifest files to isolated Kubernetes sandbox
   */
  deployToSandbox: async (projectId, userId, fileIds) => {
    // 1. Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new ApiError('Please select at least one Kubernetes YAML file to deploy.', 400);
    }

    // 2. Fetch files belonging to project and user
    const files = await ProjectFile.find({
      _id: { $in: fileIds },
      project: projectId,
      owner: userId,
    });

    if (files.length === 0) {
      throw new ApiError('None of the specified files were found in this project.', 404);
    }

    // Combine all file contents into single manifest stream
    const combinedContent = files.map((f) => f.content).join('\n---\n');

    // 3. Generate deterministic sandbox namespace (e.g. kubementor-u66a12-p66b34)
    const sandboxNamespace = namespaceService.generateNamespaceName(userId, projectId);

    // 4. Parse YAML & enforce kind whitelist / sandbox namespace
    const parseResult = parseAndEnforceSandboxManifests(combinedContent, sandboxNamespace);
    if (!parseResult.valid) {
      throw new ApiError(parseResult.error, 400);
    }

    // 5. Ensure sandbox namespace exists
    await namespaceService.ensureNamespace(sandboxNamespace);

    // 6. Create DeploymentRecord doc in DB
    const deploymentRecord = await DeploymentRecord.create({
      project: projectId,
      user: userId,
      namespace: sandboxNamespace,
      fileIds: files.map((f) => f._id),
      status: 'deploying',
      startedAt: new Date(),
    });

    try {
      // 7. Apply resources to sandbox namespace
      const resourceResults = await deploymentService.applyManifestDocuments(
        parseResult.documents,
        sandboxNamespace
      );

      deploymentRecord.resources = resourceResults;
      deploymentRecord.status = 'running';
      deploymentRecord.completedAt = new Date();
      await deploymentRecord.save();

      // Update project status to 'deployed'
      project.status = 'deployed';
      await project.save();

      return deploymentRecord.toResponseObject();
    } catch (err) {
      deploymentRecord.status = 'failed';
      deploymentRecord.errorMessage = err.message;
      deploymentRecord.completedAt = new Date();
      await deploymentRecord.save();
      throw new ApiError(`Deployment Execution Failed: ${err.message}`, 400);
    }
  },

  /**
   * Get deployment history for a project
   */
  getDeploymentHistory: async (projectId, userId) => {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    const records = await DeploymentRecord.find({ project: projectId, user: userId })
      .sort({ createdAt: -1 });

    return records.map((r) => r.toResponseObject());
  },

  /**
   * Get specific deployment details by ID
   */
  getDeploymentById: async (projectId, deploymentId, userId) => {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    const record = await DeploymentRecord.findOne({
      _id: deploymentId,
      project: projectId,
      user: userId,
    });

    if (!record) {
      throw new ApiError('Deployment record not found or not accessible', 404);
    }

    return record.toResponseObject();
  },

  /**
   * Inspect live sandbox status (Pods, Services, Replicas, Events)
   */
  getSandboxLiveStatus: async (projectId, deploymentId, userId) => {
    const record = await DeploymentRecord.findOne({
      _id: deploymentId,
      project: projectId,
      user: userId,
    });

    if (!record) {
      throw new ApiError('Deployment record not found or not accessible', 404);
    }

    const liveStatus = await statusService.getSandboxStatus(record.namespace);

    // Sync live status if running/failed
    if (record.status !== 'stopped' && liveStatus.overallStatus) {
      record.status = liveStatus.overallStatus;
      await record.save();
    }

    return {
      deploymentRecord: record.toResponseObject(),
      liveStatus,
    };
  },

  /**
   * Stop deployment and delete sandbox namespace cleanly
   */
  stopAndCleanupSandbox: async (projectId, deploymentId, userId) => {
    const record = await DeploymentRecord.findOne({
      _id: deploymentId,
      project: projectId,
      user: userId,
    });

    if (!record) {
      throw new ApiError('Deployment record not found or not accessible', 404);
    }

    // Delete sandbox namespace
    await namespaceService.deleteNamespace(record.namespace);

    record.status = 'stopped';
    record.completedAt = new Date();
    await record.save();

    return {
      success: true,
      message: `Sandbox namespace '${record.namespace}' deleted successfully.`,
    };
  },
};

export default k8sService;
