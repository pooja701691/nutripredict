import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

/**
 * Authentication check middleware
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);

      // Find user and bind to request (exclude password)
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user account no longer exists.'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error(`🔒 Auth middleware error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or expired.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token was provided in headers.'
    });
  }
};

export default protect;
