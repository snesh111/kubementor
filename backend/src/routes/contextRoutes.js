import express from 'express';
import { getContextSnapshot, refreshContextSnapshot } from '../controllers/contextController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/context', getContextSnapshot);
router.post('/context/refresh', refreshContextSnapshot);

export default router;
