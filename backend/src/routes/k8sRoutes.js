import express from 'express';
import {
  getClusterResources,
  getPodLogs,
  deployManifest,
} from '../controllers/k8sController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/resources', authenticate, getClusterResources);
router.get('/pods/:podName/logs', authenticate, getPodLogs);
router.post('/deploy', authenticate, upload.single('manifest'), deployManifest);

export default router;
