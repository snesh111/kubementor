import Project from '../models/Project.js';
import storageService from '../storage/storageService.js';
import {
  validateFileMetadata,
  validateFileContent,
} from '../validators/projectFileValidator.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const projectFileService = {
  /**
   * Helper: Verify project existence and ownership
   */
  _verifyProjectOwnership: async (projectId, userId) => {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }
    return project;
  },

  /**
   * Upload a new project file
   */
  uploadFile: async (projectId, userId, fileObject, textContentOverride) => {
    // 1. Verify project ownership
    await projectFileService._verifyProjectOwnership(projectId, userId);

    if (!fileObject && !textContentOverride) {
      throw new ApiError('No file content provided', 400);
    }

    const originalName = fileObject ? fileObject.originalname : 'manifest.yaml';
    const size = fileObject ? fileObject.size : Buffer.byteLength(textContentOverride || '', 'utf8');
    const mimeType = fileObject ? fileObject.mimetype : 'text/plain';
    const contentString = fileObject
      ? fileObject.buffer.toString('utf8')
      : textContentOverride || '';

    // 2. Metadata validation
    const metaVal = validateFileMetadata(originalName, size);
    if (!metaVal.valid) {
      throw new ApiError(metaVal.errors.join(' '), 400);
    }

    // 3. Content syntax validation
    const contentVal = validateFileContent(metaVal.fileType, contentString);
    if (!contentVal.valid) {
      throw new ApiError(contentVal.error, 400);
    }

    // 4. Save to storage
    const fileDoc = await storageService.storeFile({
      projectId,
      ownerId: userId,
      originalName,
      storedName: originalName,
      fileType: metaVal.fileType,
      mimeType,
      size,
      content: contentString,
    });

    return fileDoc.toResponseObject(true);
  },

  /**
   * Get all files for a project owned by user
   */
  getProjectFiles: async (projectId, userId) => {
    await projectFileService._verifyProjectOwnership(projectId, userId);
    const files = await storageService.getFilesByProject(projectId, userId);
    return files.map((f) => f.toResponseObject(false)); // Summary list excludes heavy content
  },

  /**
   * Get specific file details and content
   */
  getFileDetails: async (projectId, fileId, userId) => {
    await projectFileService._verifyProjectOwnership(projectId, userId);
    const fileDoc = await storageService.getFileById(fileId, projectId, userId);
    if (!fileDoc) {
      throw new ApiError('File not found or not accessible', 404);
    }
    return fileDoc.toResponseObject(true); // Includes content for viewer
  },

  /**
   * Replace/update an existing file
   */
  replaceFile: async (projectId, fileId, userId, fileObject, textContentOverride) => {
    await projectFileService._verifyProjectOwnership(projectId, userId);

    const existingFile = await storageService.getFileById(fileId, projectId, userId);
    if (!existingFile) {
      throw new ApiError('File not found or not accessible', 404);
    }

    const originalName = fileObject ? fileObject.originalname : existingFile.originalName;
    const size = fileObject ? fileObject.size : Buffer.byteLength(textContentOverride || '', 'utf8');
    const mimeType = fileObject ? fileObject.mimetype : existingFile.mimeType;
    const contentString = fileObject
      ? fileObject.buffer.toString('utf8')
      : textContentOverride !== undefined
      ? textContentOverride
      : existingFile.content;

    // Validate
    const metaVal = validateFileMetadata(originalName, size);
    if (!metaVal.valid) {
      throw new ApiError(metaVal.errors.join(' '), 400);
    }

    const contentVal = validateFileContent(metaVal.fileType, contentString);
    if (!contentVal.valid) {
      throw new ApiError(contentVal.error, 400);
    }

    const updatedFile = await storageService.updateFile(fileId, projectId, userId, {
      originalName,
      storedName: originalName,
      fileType: metaVal.fileType,
      mimeType,
      size,
      content: contentString,
    });

    return updatedFile.toResponseObject(true);
  },

  /**
   * Delete a project file
   */
  deleteFile: async (projectId, fileId, userId) => {
    await projectFileService._verifyProjectOwnership(projectId, userId);
    const deleted = await storageService.deleteFile(fileId, projectId, userId);
    if (!deleted) {
      throw new ApiError('File not found or not accessible', 404);
    }
    return true;
  },
};

export default projectFileService;
