import api from './api';

export const byoaService = {
  /**
   * Validate Kubernetes manifests against security rules and quotas
   * @param {string} manifestYaml
   */
  validateManifests: async (manifestYaml) => {
    const res = await api.post('/byoa/validate-manifests', { manifestYaml });
    return res.data;
  },

  /**
   * Create an isolated BYOA lab session
   * @param {string} manifestYaml
   * @param {string} appName
   * @param {string} description
   */
  createBYOALab: async (manifestYaml, appName = 'Custom Application', description = '') => {
    const res = await api.post('/byoa/create-lab', { manifestYaml, appName, description });
    return res.data;
  },

  /**
   * Run deterministic health check on BYOA workload
   * @param {string} labId
   */
  validateBYOAHealth: async (labId) => {
    const res = await api.post(`/byoa/${labId}/validate`);
    return res.data;
  },

  /**
   * List all BYOA labs created by the current user
   */
  getUserBYOALabs: async () => {
    const res = await api.get('/byoa/labs');
    return res.data;
  },
};

export default byoaService;
