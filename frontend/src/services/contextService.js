import api from './api';

export const contextService = {
  getContext: async (projectId, attemptId) => {
    return await api.get(`/projects/${projectId}/scenario-attempts/${attemptId}/context`);
  },

  refreshContext: async (projectId, attemptId) => {
    return await api.post(`/projects/${projectId}/scenario-attempts/${attemptId}/context/refresh`);
  },
};

export default contextService;
