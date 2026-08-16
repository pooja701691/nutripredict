import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'Registration conflict',
        errors: [
          {
            field: 'email',
            message: 'Email address is already registered.'
          }
        ]
      });
    }

    // Create user. Mongoose pre-save hooks will handle password hashing
    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    // Convert to JSON (will strip password due to schema toJSON settings)
    const userJSON = user.toJSON();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: userJSON._id,
          name: userJSON.name,
          email: userJSON.email
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user and explicitly select password since schema excludes it by default
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    // Check password matches hashed database version
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    const token = generateToken(user._id);

    // Format user JSON to omit password
    const userJSON = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userJSON,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user has already been set by authMiddleware protect
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  registerUser,
  loginUser,
  getMe
};
