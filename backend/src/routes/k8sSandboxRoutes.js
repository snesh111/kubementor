import express from 'express';
import {
  deployToSandbox,
  getDeploymentHistory,
  getDeploymentById,
  getSandboxStatus,
  stopAndCleanupSandbox,
} from '../controllers/k8sSandboxController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post('/deploy', deployToSandbox);
router.get('/deployments', getDeploymentHistory);
router.get('/deployments/:deploymentId', getDeploymentById);
router.get('/deployments/:deploymentId/status', getSandboxStatus);
router.delete('/deployments/:deploymentId', stopAndCleanupSandbox);

export default router;
