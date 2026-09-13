import express from 'express';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import projectFileRoutes from './projectFileRoutes.js';
import analyzerRoutes from './analyzerRoutes.js';
import k8sSandboxRoutes from './k8sSandboxRoutes.js';
import scenarioRoutes from './scenarioRoutes.js';
import contextRoutes from './contextRoutes.js';
import aiRoutes from './aiRoutes.js';
import validationRoutes from './validationRoutes.js';
import k8sRoutes from './k8sRoutes.js';
import labRoutes from './labRoutes.js';

const router = express.Router();

// Mount API Endpoints under /api/v1
router.use('/auth', authRoutes);
router.use('/labs', labRoutes);
router.use('/projects', projectRoutes);
router.use('/projects/:projectId/files', projectFileRoutes);
router.use('/projects/:projectId', analyzerRoutes);
router.use('/projects/:projectId', k8sSandboxRoutes);
router.use('/projects/:projectId', scenarioRoutes);
router.use('/projects/:projectId/scenario-attempts/:attemptId', contextRoutes);
router.use('/projects/:projectId/scenario-attempts/:attemptId/ai', aiRoutes);
router.use('/projects/:projectId/scenario-attempts/:attemptId', validationRoutes);
router.use('/scenarios', scenarioRoutes); // Global scenarios fallback
router.use('/k8s', k8sRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
