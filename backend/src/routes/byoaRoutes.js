import express from 'express';
import byoaController from '../controllers/byoaController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All BYOA endpoints require JWT authentication
router.use(protect);

router.post('/validate-manifests', byoaController.validateManifests);
router.post('/create-lab', byoaController.createLab);
router.post('/:labId/validate', byoaController.validateHealth);
router.get('/labs', byoaController.getUserLabs);

export default router;
