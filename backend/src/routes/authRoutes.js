import express from 'express';
import {
  registerUser,
  loginUser,
  googleLoginUser,
  githubLoginUser,
  demoLoginUser,
  getProfile,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLoginUser);
router.post('/github', githubLoginUser);
router.post('/demo', demoLoginUser);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
