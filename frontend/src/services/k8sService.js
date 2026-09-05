import api from './api';

export const k8sService = {
  getResources: async (namespace = 'default') => {
    return await api.get(`/k8s/resources?namespace=${namespace}`);
  },
  getPodLogs: async (podName, namespace = 'default') => {
    return await api.get(`/k8s/pods/${podName}/logs?namespace=${namespace}`);
  },
  deployManifest: async (formData) => {
    return await api.post('/k8s/deploy', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default k8sService;
