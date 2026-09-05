import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * @desc    Get simulated cluster resources
 * @route   GET /api/v1/k8s/resources
 * @access  Private
 */
export const getClusterResources = asyncHandler(async (req, res) => {
  const namespace = req.query.namespace || 'default';
  return ApiResponse.success(res, `Cluster resources for namespace: ${namespace}`, {
    namespace,
    pods: [
      { name: 'frontend-7c959779d-q8k2', status: 'Running', restarts: 0 },
      { name: 'backend-api-5569485b9-9xlp', status: 'CrashLoopBackOff', restarts: 4 },
    ],
    deployments: [{ name: 'frontend', replicas: '1/1' }],
    services: [{ name: 'frontend-svc', type: 'ClusterIP', port: 80 }],
  });
});

/**
 * @desc    Get logs for a specific pod container
 * @route   GET /api/v1/k8s/pods/:podName/logs
 * @access  Private
 */
export const getPodLogs = asyncHandler(async (req, res) => {
  const { podName } = req.params;
  return ApiResponse.success(res, `Logs for pod ${podName}`, {
    podName,
    logs: `[INFO] Container starting...\n[ERROR] Connection error: MongoError\n[FATAL] CrashLoopBackOff state entered`,
  });
});

/**
 * @desc    Deploy/Apply YAML manifest simulation
 * @route   POST /api/v1/k8s/deploy
 * @access  Private
 */
export const deployManifest = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 'Manifest submitted to simulation cluster', {
    status: 'Applied',
    resourcesCreated: ['Pod/backend-api'],
  });
});
