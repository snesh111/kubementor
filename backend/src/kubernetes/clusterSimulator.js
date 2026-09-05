export const clusterSimulator = {
  getResources: async (namespace = 'default') => {
    return {
      namespace,
      pods: [
        { name: 'frontend-7c959779d-q8k2', status: 'Running', restarts: 0 },
        { name: 'backend-api-5569485b9-9xlp', status: 'CrashLoopBackOff', restarts: 4 },
      ],
      deployments: [{ name: 'frontend', replicas: '1/1' }],
      services: [{ name: 'frontend-svc', type: 'ClusterIP', port: 80 }],
    };
  },

  applyManifest: async (yamlContent, namespace = 'default') => {
    return {
      status: 'Success',
      appliedAt: new Date().toISOString(),
      namespace,
    };
  },
};

export default clusterSimulator;
