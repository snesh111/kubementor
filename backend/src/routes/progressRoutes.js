import express from 'express';
import progressController from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All progress endpoints require JWT authentication
router.use(protect);

router.get('/', progressController.getProgressSummary);
router.get('/scenarios', progressController.getScenarioMastery);
router.get('/topics', progressController.getTopicProgress);
router.get('/recent', progressController.getRecentPractice);
router.get('/recommendations', progressController.getRecommendations);

export default router;
