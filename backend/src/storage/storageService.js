import ProjectFile from '../models/ProjectFile.js';

export const storageService = {
  /**
   * Store a file document in MongoDB
   */
  storeFile: async ({ projectId, ownerId, originalName, storedName, fileType, mimeType, size, content }) => {
    const fileDoc = await ProjectFile.create({
      project: projectId,
      owner: ownerId,
      originalName,
      storedName: storedName || originalName,
      fileType,
      mimeType,
      size,
      content,
    });
    return fileDoc;
  },

  /**
   * Retrieve all files metadata for a specific project
   */
  getFilesByProject: async (projectId, ownerId) => {
    const files = await ProjectFile.find({ project: projectId, owner: ownerId }).sort({ updatedAt: -1 });
    return files;
  },

  /**
   * Retrieve a specific file by fileId and owner
   */
  getFileById: async (fileId, projectId, ownerId) => {
    const fileDoc = await ProjectFile.findOne({ _id: fileId, project: projectId, owner: ownerId });
    return fileDoc;
  },

  /**
   * Update / Replace file content and metadata
   */
  updateFile: async (fileId, projectId, ownerId, { originalName, storedName, fileType, mimeType, size, content }) => {
    const fileDoc = await ProjectFile.findOne({ _id: fileId, project: projectId, owner: ownerId });
    if (!fileDoc) return null;

    if (originalName) fileDoc.originalName = originalName;
    if (storedName) fileDoc.storedName = storedName;
    if (fileType) fileDoc.fileType = fileType;
    if (mimeType) fileDoc.mimeType = mimeType;
    if (size !== undefined) fileDoc.size = size;
    if (content !== undefined) fileDoc.content = content;

    await fileDoc.save();
    return fileDoc;
  },

  /**
   * Delete file document
   */
  deleteFile: async (fileId, projectId, ownerId) => {
    const deleted = await ProjectFile.findOneAndDelete({ _id: fileId, project: projectId, owner: ownerId });
    return !!deleted;
  },
};

export default storageService;
