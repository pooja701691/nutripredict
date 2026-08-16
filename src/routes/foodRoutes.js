import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  analyzeFood,
  getFoodHistory,
  getDashboardSummary,
  getFoodEntryById,
  deleteFoodEntry
} from '../controllers/foodController.js';
import protect from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import handleValidationErrors from '../middleware/validationMiddleware.js';

const router = express.Router();

// Specific rate limiter for food analysis (expensive operation: max 10 requests per 15 minutes per IP)
const analyzeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many analysis requests. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Protect all routes
router.use(protect);

/**
 * @route   POST /api/food/analyze
 * @desc    Upload food image and analyze nutrition metrics
 * @access  Private
 */
router.post(
  '/analyze',
  analyzeRateLimiter,
  upload.single('image'),
  [
    body('mealType')
      .optional()
      .trim()
      .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
      .withMessage('Meal type must be breakfast, lunch, dinner, or snack'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    body('quantity')
      .optional()
      .isFloat({ min: 0.1 })
      .withMessage('Quantity must be a positive number'),
    body('unit')
      .optional()
      .trim()
      .isString()
      .withMessage('Unit must be a valid string'),
    handleValidationErrors
  ],
  analyzeFood
);

/**
 * @route   GET /api/food/dashboard
 * @desc    Get user's nutritional aggregated totals for today
 * @access  Private
 */
router.get('/dashboard', getDashboardSummary);

/**
 * @route   GET /api/food/history
 * @desc    Get user's food log entries history
 * @access  Private
 */
router.get('/history', getFoodHistory);

/**
 * @route   GET /api/food/:id
 * @desc    Retrieve a single food entry details
 * @access  Private
 */
router.get('/:id', getFoodEntryById);

/**
 * @route   DELETE /api/food/:id
 * @desc    Delete a food entry
 * @access  Private
 */
router.delete('/:id', deleteFoodEntry);

export default router;
