import api from './api';

export const scenarioService = {
  getScenarios: async (projectId) => {
    return projectId ? await api.get(`/projects/${projectId}/scenarios`) : await api.get('/scenarios');
  },

  getScenarioById: async (projectId, scenarioId) => {
    return projectId ? await api.get(`/projects/${projectId}/scenarios/${scenarioId}`) : await api.get(`/scenarios/${scenarioId}`);
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
