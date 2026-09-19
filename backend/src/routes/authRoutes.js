import express from 'express';
import {
  registerUser,
  loginUser,
  googleLoginUser,
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
router.post('/demo', demoLoginUser);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
