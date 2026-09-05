import express from 'express';
import {
  validateFix,
  getLatestResult,
  getHistory,
} from '../controllers/validationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post('/validate', validateFix);
router.get('/validation', getLatestResult);
router.get('/validations', getHistory);

export default router;
