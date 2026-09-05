import clusterSimulator from '../kubernetes/clusterSimulator.js';

export const k8sService = {
  fetchNamespaceResources: async (namespace = 'default') => {
    return await clusterSimulator.getResources(namespace);
  },

  applyManifestSpec: async (yamlContent, namespace = 'default') => {
    return await clusterSimulator.applyManifest(yamlContent, namespace);
  },
};

export default k8sService;
