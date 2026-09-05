import express from 'express';
import {
  analyzeProjectFiles,
  getAnalysisHistory,
  getAnalysisReportById,
} from '../controllers/analyzerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// POST /api/v1/projects/:projectId/analyze
router.post('/analyze', analyzeProjectFiles);

// GET /api/v1/projects/:projectId/analysis
router.get('/analysis', getAnalysisHistory);

// GET /api/v1/projects/:projectId/analysis/:analysisId
router.get('/analysis/:analysisId', getAnalysisReportById);

export default router;
