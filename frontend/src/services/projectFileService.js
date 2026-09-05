import api from './api';

export const projectFileService = {
  getFiles: async (projectId) => {
    return await api.get(`/projects/${projectId}/files`);
  },

  getFileDetails: async (projectId, fileId) => {
    return await api.get(`/projects/${projectId}/files/${fileId}`);
  },

  uploadFile: async (projectId, formData) => {
    return await api.post(`/projects/${projectId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  replaceFile: async (projectId, fileId, formData) => {
    return await api.put(`/projects/${projectId}/files/${fileId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteFile: async (projectId, fileId) => {
    return await api.delete(`/projects/${projectId}/files/${fileId}`);
  },
};

export default projectFileService;
