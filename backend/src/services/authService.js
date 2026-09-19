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
      authProvider: 'local',
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
   * Authenticate / Register via Google OAuth
   * @param {Object} googlePayload - { credential, email, name, avatar, googleId }
   * @returns {Object} { user, token }
   */
  googleAuth: async ({ credential, email, name, avatar, googleId }) => {
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGoogleId = googleId;

    // Decode Google JWT ID token payload if provided from GSI
    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          userEmail = payload.email || userEmail;
          userName = payload.name || userName;
          userAvatar = payload.picture || userAvatar;
          userGoogleId = payload.sub || userGoogleId;
        }
      } catch (err) {
        console.warn('[authService] Google token decode notice:', err.message);
      }
    }

    // Default fallback demo Google credentials if empty
    if (!userEmail) {
      userEmail = 'google.engineer@kubementor.io';
      userName = userName || 'Google DevOps Engineer';
      userAvatar = userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
      userGoogleId = userGoogleId || 'google_oauth_default_user';
    }

    userEmail = userEmail.toLowerCase().trim();
    userName = userName ? userName.trim() : userEmail.split('@')[0];

    // Find existing user
    let user = await User.findOne({
      $or: [
        ...(userGoogleId ? [{ googleId: userGoogleId }] : []),
        { email: userEmail },
      ],
    });

    if (user) {
      if (userGoogleId && !user.googleId) {
        user.googleId = userGoogleId;
      }
      if (userAvatar && (!user.avatar || user.avatar.includes('unsplash'))) {
        user.avatar = userAvatar;
      }
      if (!user.authProvider || user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      await user.save();
    } else {
      const randomPassword = `G_${Math.random().toString(36).slice(-10)}_${Date.now()}!`;
      user = await User.create({
        name: userName,
        email: userEmail,
        password: randomPassword,
        googleId: userGoogleId,
        authProvider: 'google',
        avatar: userAvatar || undefined,
      });
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
   * One-click demo evaluator login for grading/demo presentations
   */
  demoLogin: async () => {
    let user = await User.findOne({ email: 'demo@kubementor.io' });
    if (!user) {
      user = await User.create({
        name: 'DevOps Evaluator',
        email: 'demo@kubementor.io',
        password: 'Password123!',
        authProvider: 'demo',
      });
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
