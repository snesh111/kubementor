import asyncHandler from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/apiResponse.js';
import authService from '../services/authService.js';
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
} from '../validators/authValidator.js';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { valid, errors } = validateRegistration(req.body);
  if (!valid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const result = await authService.registerUser(req.body);
  return ApiResponse.success(res, 'User registered successfully', result, 201);
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { valid, errors } = validateLogin(req.body);
  if (!valid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const result = await authService.loginUser(req.body);
  return ApiResponse.success(res, 'Logged in successfully', result, 200);
});

/**
 * @desc    Google OAuth Sign-In / Sign-Up
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
export const googleLoginUser = asyncHandler(async (req, res) => {
  const result = await authService.googleAuth(req.body || {});
  return ApiResponse.success(res, 'Logged in with Google account', result, 200);
});

/**
  * @desc    One-click demo evaluation login
  * @route   POST /api/v1/auth/demo
  * @access  Public
  */
export const demoLoginUser = asyncHandler(async (req, res) => {
  const result = await authService.demoLogin();
  return ApiResponse.success(res, 'Logged in with Demo Evaluator profile', result, 200);
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/v1/auth/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getUserProfile(req.user._id);
  return ApiResponse.success(res, 'Profile retrieved successfully', { user: profile });
});

/**
 * @desc    Update current authenticated user profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { valid, errors } = validateProfileUpdate(req.body);
  if (!valid) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  const updatedProfile = await authService.updateUserProfile(req.user._id, req.body);
  return ApiResponse.success(res, 'Profile updated successfully', { user: updatedProfile });
});

export default {
  registerUser,
  loginUser,
  googleLoginUser,
  demoLoginUser,
  getProfile,
  updateProfile,
};
