import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generate a JWT token signed with user ID
 * @param {string} id - The MongoDB User ID
 * @returns {string} Signed JWT Token
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

export default generateToken;
