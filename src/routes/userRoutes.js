import express from 'express';
import { body } from 'express-validator';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Apply auth protection middleware to all profile routes
router.use(protect);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile details
 * @access  Private (Protected)
 */
router.get('/profile', getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile details
 * @access  Private (Protected)
 */
router.put(
  '/profile',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('dailyCalorieGoal')
      .optional()
      .isInt({ min: 500, max: 10000 })
      .withMessage('Daily calorie goal must be an integer between 500 and 10000 kcal'),
    body('profileImage')
      .optional()
      .trim()
      .isString()
      .withMessage('Profile image must be a string URL'),
    handleValidationErrors
  ],
  updateUserProfile
);

export default router;
