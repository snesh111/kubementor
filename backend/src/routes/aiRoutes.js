import express from 'express';
import {
  diagnoseScenario,
  getScenarioHint,
  explainEvidenceTopic,
  explainConcept,
  chatWithMentor,
  getChatHistory,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post('/diagnose', diagnoseScenario);
router.post('/hint', getScenarioHint);
router.post('/explain', explainEvidenceTopic);
router.post('/concept', explainConcept);
router.post('/chat', chatWithMentor);
router.get('/chat', getChatHistory);

export default router;
