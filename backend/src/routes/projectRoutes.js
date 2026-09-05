import express from 'express';
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply JWT authentication to all project endpoints
router.use(authenticate);

router.post('/', createProject);
router.get('/', getUserProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
