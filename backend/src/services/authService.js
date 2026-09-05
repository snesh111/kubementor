import User from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { name, email, password, avatar }
   * @returns {Object} { user, token }
   */
  registerUser: async ({ name, email, password, avatar }) => {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw new ApiError('An account with this email address already exists', 400);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      avatar: avatar || undefined,
    });

    const token = generateToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    return {
      user: user.toResponseObject(),
      token,
    };
  },

  /**
   * Authenticate existing user
   * @param {Object} credentials - { email, password }
   * @returns {Object} { user, token }
   */
  loginUser: async ({ email, password }) => {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError('Invalid email or password', 401);
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    return {
      user: user.toResponseObject(),
      token,
    };
  },

  /**
   * Get user profile by ID
   * @param {string} userId
   * @returns {Object} user profile
   */
  getUserProfile: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User profile not found', 404);
    }
    return user.toResponseObject();
  },

  /**
   * Update user profile
   * @param {string} userId
   * @param {Object} updateData - { name, email, avatar, password }
   * @returns {Object} updated user profile
   */
  updateUserProfile: async (userId, { name, email, avatar, password }) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const emailTaken = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailTaken) {
        throw new ApiError('Email address is already in use by another account', 400);
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (avatar) user.avatar = avatar;
    if (password) user.password = password; // pre('save') hook will hash this

    await user.save();
    return user.toResponseObject();
  },
};

export default authService;
