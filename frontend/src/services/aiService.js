import api from './api';

export const aiService = {
  diagnose: async (projectId, attemptId) => {
    return await api.post(`/projects/${projectId}/scenario-attempts/${attemptId}/ai/diagnose`);
  },

  getHint: async (projectId, attemptId, level) => {
    return await api.post(`/projects/${projectId}/scenario-attempts/${attemptId}/ai/hint`, { level });
  },

  explainEvidence: async (projectId, attemptId, topic) => {
    return await api.post(`/projects/${projectId}/scenario-attempts/${attemptId}/ai/explain`, { topic });
  },

  explainConcept: async (projectId, attemptId, concept) => {
    return await api.post(`/projects/${projectId}/scenario-attempts/${attemptId}/ai/concept`, { concept });
  },

  sendMessage: async (projectId, attemptId, message) => {
    return await api.post(`/projects/${projectId}/scenario-attempts/${attemptId}/ai/chat`, { message });
  },

  getChatHistory: async (projectId, attemptId) => {
    return await api.get(`/projects/${projectId}/scenario-attempts/${attemptId}/ai/chat`);
  },
};

export default aiService;
