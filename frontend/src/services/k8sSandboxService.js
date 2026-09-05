import api from './api';

export const k8sSandboxService = {
  deploy: async (projectId, fileIds) => {
    return await api.post(`/projects/${projectId}/deploy`, { fileIds });
  },

  getDeploymentHistory: async (projectId) => {
    return await api.get(`/projects/${projectId}/deployments`);
  },

  getDeploymentById: async (projectId, deploymentId) => {
    return await api.get(`/projects/${projectId}/deployments/${deploymentId}`);
  },

  getSandboxStatus: async (projectId, deploymentId) => {
    return await api.get(`/projects/${projectId}/deployments/${deploymentId}/status`);
  },

  stopAndCleanup: async (projectId, deploymentId) => {
    return await api.delete(`/projects/${projectId}/deployments/${deploymentId}`);
  },
};

export default k8sSandboxService;
