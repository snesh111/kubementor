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

    if (!userEmail) {
      throw new ApiError('Google authentication failed: Verified email was not provided', 400);
    }

    userEmail = userEmail.toLowerCase().trim();
    userName = userName ? userName.trim() : userEmail.split('@')[0];

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
   * Authenticate / Register via GitHub OAuth
   * @param {Object} githubPayload - { code, email, name, avatar, githubId }
   * @returns {Object} { user, token }
   */
  githubAuth: async ({ code, email, name, avatar, githubId }) => {
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGithubId = githubId;

    // 1. Real GitHub OAuth Code-for-Token Exchange if code provided
    if (code) {
      if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        throw new ApiError(
          'GitHub OAuth is not fully configured on the server. Please add GITHUB_CLIENT_SECRET to backend/.env',
          400
        );
      }

      try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          throw new ApiError(
            `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`,
            400
          );
        }

        if (tokenData.access_token) {
          // Fetch authenticated GitHub user
          const userRes = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              'User-Agent': 'KubeMentor-App',
            },
          });
          const ghUser = await userRes.json();
          userName = ghUser.name || ghUser.login || userName;
          userAvatar = ghUser.avatar_url || userAvatar;
          userGithubId = String(ghUser.id || userGithubId);
          userEmail = ghUser.email;

          // Fetch verified email if user email is private
          if (!userEmail) {
            try {
              const emailsRes = await fetch('https://api.github.com/user/emails', {
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                  'User-Agent': 'KubeMentor-App',
                },
              });
              const emails = await emailsRes.json();
              if (Array.isArray(emails)) {
                const primaryEmail = emails.find((e) => e.primary && e.verified) || emails[0];
                if (primaryEmail?.email) {
                  userEmail = primaryEmail.email;
                }
              }
            } catch (emailErr) {
              console.warn('[authService] GitHub email fetch warning:', emailErr.message);
            }
          }

          // If still private, use GitHub's standard noreply alias for the user
          if (!userEmail && ghUser.login) {
            userEmail = `${ghUser.login}@users.noreply.github.com`;
          }
        }
      } catch (err) {
        if (err instanceof ApiError) throw err;
        console.warn('[authService] GitHub code exchange error:', err.message);
        throw new ApiError(`GitHub authentication exchange failed: ${err.message}`, 400);
      }
    }

    if (!userEmail) {
      throw new ApiError('GitHub authentication failed: Verified email was not provided by GitHub', 400);
    }

    userEmail = userEmail.toLowerCase().trim();
    userName = userName ? userName.trim() : userEmail.split('@')[0];

    let user = await User.findOne({ email: userEmail });

    if (user) {
      if (userAvatar && (!user.avatar || user.avatar.includes('unsplash'))) {
        user.avatar = userAvatar;
      }
      if (!user.authProvider || user.authProvider === 'local') {
        user.authProvider = 'github';
      }
      await user.save();
    } else {
      const randomPassword = `GH_${Math.random().toString(36).slice(-10)}_${Date.now()}!`;
      user = await User.create({
        name: userName,
        email: userEmail,
        password: randomPassword,
        authProvider: 'github',
        avatar: userAvatar,
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
      throw new ApiError('User profile not found', 404);
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
    if (password) user.password = password;

    await user.save();
    return user.toResponseObject();
  },
};

export default authService;
