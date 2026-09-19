import { verifyToken } from '../utils/token.js';
import ApiResponse from '../utils/apiResponse.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Access denied. Authorization token missing.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    
    // Optional check if user still exists in DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return ApiResponse.error(res, 'User belonging to this token no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token has expired. Please log in again.', 401);
    }
    return ApiResponse.error(res, 'Invalid or corrupted authorization token.', 401);
  }
};

export const protect = authenticate;

export default { authenticate, protect };
