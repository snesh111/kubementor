import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Generate JWT token for an authenticated user
 * @param {Object} payload - Data to embed in token (id, email, role)
 * @returns {string} Signed JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export default { generateToken, verifyToken };
