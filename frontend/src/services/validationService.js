import api from './api';

export const validationService = {
  validateFix: async (projectId, attemptId, fileIds) => {
    return await api.post(`/projects/${projectId}/scenario-attempts/${attemptId}/validate`, { fileIds });
  },

  getLatestValidation: async (projectId, attemptId) => {
    return await api.get(`/projects/${projectId}/scenario-attempts/${attemptId}/validation`);
  },

  getValidationsHistory: async (projectId, attemptId) => {
    return await api.get(`/projects/${projectId}/scenario-attempts/${attemptId}/validations`);
  },
};

export default validationService;
