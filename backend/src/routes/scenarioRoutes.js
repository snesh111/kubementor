import express from 'express';
import {
  getScenarios,
  getScenarioById,
  startScenario,
  getScenarioAttempts,
  getScenarioAttemptById,
  cancelScenarioAttempt,
} from '../controllers/scenarioController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/scenarios', getScenarios);
router.get('/scenarios/:scenarioId', getScenarioById);
router.post('/scenarios/:scenarioId/start', startScenario);

router.get('/scenario-attempts', getScenarioAttempts);
router.get('/scenario-attempts/:attemptId', getScenarioAttemptById);
router.post('/scenario-attempts/:attemptId/cancel', cancelScenarioAttempt);

export default router;
