import api from './api';

export const projectService = {
  getProjects: async () => {
    return await api.get('/projects');
  },

  getProjectById: async (id) => {
    return await api.get(`/projects/${id}`);
  },

  createProject: async (projectData) => {
    return await api.post('/projects', projectData);
  },

  updateProject: async (id, projectData) => {
    return await api.put(`/projects/${id}`, projectData);
  },

  deleteProject: async (id) => {
    return await api.delete(`/projects/${id}`);
  },
};

export default projectService;
