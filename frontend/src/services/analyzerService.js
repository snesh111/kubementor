import api from './api';

export const analyzerService = {
  analyzeFiles: async (projectId, fileIds) => {
    return await api.post(`/projects/${projectId}/analyze`, { fileIds });
  },

  getAnalysisHistory: async (projectId) => {
    return await api.get(`/projects/${projectId}/analysis`);
  },

  getAnalysisReportById: async (projectId, analysisId) => {
    return await api.get(`/projects/${projectId}/analysis/${analysisId}`);
  },

  analyzeRaw: async (content, type = 'auto') => {
    return await api.post('/analyzer/raw', { content, type });
  },
};

export default analyzerService;
