import api from './api';

export const labService = {
  getCatalog: async () => {
    return await api.get('/labs/catalog');
  },

  startLab: async (labId) => {
    return await api.post(`/labs/${labId}/start`);
  },

  getLabSession: async (labId) => {
    return await api.get(`/labs/${labId}/session`);
  },

  resetLab: async (labId) => {
    return await api.post(`/labs/${labId}/reset`);
  },

  getLabFiles: async (labId) => {
    return await api.get(`/labs/${labId}/files`);
  },

  getLabFile: async (labId, filename) => {
    return await api.get(`/labs/${labId}/files/${filename}`);
  },

  saveLabFile: async (labId, filename, content) => {
    return await api.put(`/labs/${labId}/files/${filename}`, { content });
  },

  deployLab: async (labId) => {
    return await api.post(`/labs/${labId}/deploy`);
  },

  getLabNotes: async (labId) => {
    return await api.get(`/labs/${labId}/notes`);
  },

  saveLabNotes: async (labId, noteData) => {
    return await api.put(`/labs/${labId}/notes`, noteData);
  },

  aiDiagnose: async (labId) => {
    return await api.post(`/labs/${labId}/ai/diagnose`);
  },

  aiHint: async (labId, level) => {
    return await api.post(`/labs/${labId}/ai/hint`, { level });
  },

  aiChat: async (labId, message) => {
    return await api.post(`/labs/${labId}/ai/chat`, { message });
  },

  aiHistory: async (labId) => {
    return await api.get(`/labs/${labId}/ai/chat`);
  },

  aiExplain: async (labId, topic) => {
    return await api.post(`/labs/${labId}/ai/explain`, { topic });
  },

  aiConcept: async (labId, concept) => {
    return await api.post(`/labs/${labId}/ai/concept`, { concept });
  },
};

export default labService;
