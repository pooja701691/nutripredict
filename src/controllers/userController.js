import User from '../models/User.js';

/**
 * @desc    Get user profile details
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware protect
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile details (name, profileImage, calorieGoal)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const { name, profileImage, dailyCalorieGoal } = req.body;

    // Apply updates selectively
    if (name !== undefined) user.name = name;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (dailyCalorieGoal !== undefined) user.dailyCalorieGoal = dailyCalorieGoal;

    const updatedUser = await user.save();

    console.log(`👤 User Profile Updated: ${updatedUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getUserProfile,
  updateUserProfile
};
