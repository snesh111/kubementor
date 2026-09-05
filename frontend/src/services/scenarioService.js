import api from './api';

export const scenarioService = {
  getScenarios: async (projectId) => {
    return await api.get(`/projects/${projectId}/scenarios`);
  },

  getScenarioById: async (projectId, scenarioId) => {
    return await api.get(`/projects/${projectId}/scenarios/${scenarioId}`);
  },

  startScenario: async (projectId, scenarioId, deploymentId) => {
    return await api.post(`/projects/${projectId}/scenarios/${scenarioId}/start`, { deploymentId });
  },

  getScenarioAttempts: async (projectId) => {
    return await api.get(`/projects/${projectId}/scenario-attempts`);
  },

  cancelScenarioAttempt: async (projectId, attemptId) => {
    return await api.post(`/projects/${projectId}/scenario-attempts/${attemptId}/cancel`);
  },
};

export default scenarioService;
