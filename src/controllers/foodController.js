import FoodEntry from '../models/FoodEntry.js';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';
import { analyzeFoodImage } from '../services/aiService.js';
import { getNutrition } from '../services/nutritionService.js';
import { calculateTotalNutrition } from '../utils/calculateNutrition.js';

const NUTRITION_DISCLAIMER =
  'Nutrition values are estimates and may vary based on ingredients, preparation method, and portion size.';

/**
 * @desc    Analyze food image, calculate nutrition, and save entry
 * @route   POST /api/food/analyze
 * @access  Private
 */
export const analyzeFood = async (req, res, next) => {
  try {
    // Validate image presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please upload an image under the "image" field.'
      });
    }

    const mealType = req.body.mealType || 'snack';
    const notes = req.body.notes || '';
    
    // Optional manual portion override parameters
    const quantityOverride = req.body.quantity ? parseFloat(req.body.quantity) : null;
    const unitOverride = req.body.unit || null;

    console.log(`📸 Food Analysis: Started. Meal Type: ${mealType}, Notes: ${notes}`);

    // 1. Upload to Cloudinary
    console.log('🔄 Uploading image to Cloudinary...');
    const imageUrl = await uploadImage(req.file);
    console.log(`✅ Image uploaded: ${imageUrl}`);

    // 2. Identify food items via Gemini AI
    console.log('🔄 Contacting AI Vision Service...');
    let aiResponse;
    try {
      aiResponse = await analyzeFoodImage(imageUrl, notes);
    } catch (error) {
      // Clean up Cloudinary upload on AI crash to avoid orphan files
      await deleteImage(imageUrl);
      throw error;
    }
    console.log('✅ AI analysis completed');

    const foodItemsDetected = aiResponse.foodItems || [];

    // 3. Check if food is detected
    if (foodItemsDetected.length === 0) {
      console.log('⚠️ AI Service: No food detected in the image.');
      // Clean up uploaded image
      await deleteImage(imageUrl);
      return res.status(422).json({
        success: false,
        message: 'No food could be detected in the image. Please upload a clear food image.'
      });
    }

    // Apply manual portion override if specified (affects the primary/first detected item)
    if (foodItemsDetected.length > 0) {
      if (quantityOverride !== null && !isNaN(quantityOverride)) {
        console.log(`⚖️ Overriding portion quantity of "${foodItemsDetected[0].name}" with: ${quantityOverride}`);
        foodItemsDetected[0].quantity = quantityOverride;
      }
      if (unitOverride) {
        console.log(`⚖️ Overriding portion unit of "${foodItemsDetected[0].name}" with: ${unitOverride}`);
        foodItemsDetected[0].unit = unitOverride;
      }
    }

    // 4. Fetch nutrition details for each identified food item
    console.log('🔄 Fetching nutritional estimations from Nutrition Service...');
    const foodItemsWithNutrition = [];
    for (const item of foodItemsDetected) {
      try {
        const nutrition = await getNutrition(item.name, item.quantity, item.unit);
        foodItemsWithNutrition.push({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          confidence: item.confidence,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber
        });
      } catch (nutritionError) {
        console.error(`⚠️ Failed to fetch nutrition for "${item.name}":`, nutritionError.message);
        // Fall back to zeros so lookup does not crash the main analyzer flow
        foodItemsWithNutrition.push({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          confidence: item.confidence,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        });
      }
    }
    console.log('✅ Nutrition lookup completed');

    // 5. Calculate cumulative nutrition totals
    const totalNutrition = calculateTotalNutrition(foodItemsWithNutrition);

    // 6. Save food entry to database
    const foodEntry = new FoodEntry({
      userId: req.user._id,
      imageUrl,
      foodItems: foodItemsWithNutrition,
      totalNutrition,
      mealType,
      notes
    });

    await foodEntry.save();
    console.log('✅ Food entry saved to MongoDB');

    // 7. Format final response
    return res.status(201).json({
      success: true,
      message: 'Food analyzed successfully',
      data: {
        foodEntry: {
          id: foodEntry._id,
          imageUrl: foodEntry.imageUrl,
          foodItems: foodEntry.foodItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
            confidence: item.confidence
          })),
          totalNutrition: foodEntry.totalNutrition,
          mealType: foodEntry.mealType,
          notes: foodEntry.notes,
          createdAt: foodEntry.createdAt
        }
      },
      disclaimer: NUTRITION_DISCLAIMER
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated food log history for current user
 * @route   GET /api/food/history
 * @access  Private
 */
export const getFoodHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    // Retrieve count of user records
    const total = await FoodEntry.countDocuments({ userId: req.user._id });
    
    // Fetch logs sorted newest first
    const foods = await FoodEntry.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        foods,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single food entry details
 * @route   GET /api/food/:id
 * @access  Private
 */
export const getFoodEntryById = async (req, res, next) => {
  try {
    const foodEntry = await FoodEntry.findById(req.params.id);

    if (!foodEntry) {
      return res.status(404).json({
        success: false,
        message: 'Food entry not found.'
      });
    }

    // Verify ownership of the resource
    if (foodEntry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this food entry.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        foodEntry
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete food entry log and remove image from Cloudinary
 * @route   DELETE /api/food/:id
 * @access  Private
 */
export const deleteFoodEntry = async (req, res, next) => {
  try {
    const foodEntry = await FoodEntry.findById(req.params.id);

    if (!foodEntry) {
      return res.status(404).json({
        success: false,
        message: 'Food entry not found.'
      });
    }

    // Verify ownership of the resource
    if (foodEntry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this food entry.'
      });
    }

    // 1. Delete image asset on Cloudinary (runs in background/safely caught)
    await deleteImage(foodEntry.imageUrl);

    // 2. Remove document from DB
    await FoodEntry.findByIdAndDelete(req.params.id);
    console.log(`🧹 Food entry deleted: ${req.params.id}`);

    return res.status(200).json({
      success: true,
      message: 'Food entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get cumulative nutritional statistics for today
 * @route   GET /api/food/dashboard
 * @access  Private
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    // Calculate start and end of "today" in local server date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Find entries for this user logged today
    const todaysEntries = await FoodEntry.find({
      userId: req.user._id,
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday
      }
    });

    // Sum all nutrition properties
    const totals = todaysEntries.reduce(
      (acc, entry) => {
        acc.calories += entry.totalNutrition.calories;
        acc.protein += entry.totalNutrition.protein;
        acc.carbs += entry.totalNutrition.carbs;
        acc.fat += entry.totalNutrition.fat;
        acc.fiber += entry.totalNutrition.fiber;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    // Format current date
    const todayStr = new Date().toISOString().split('T')[0];

    return res.status(200).json({
      success: true,
      data: {
        date: todayStr,
        calories: Math.round(totals.calories * 10) / 10,
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        fiber: Math.round(totals.fiber * 10) / 10,
        mealCount: todaysEntries.length,
        calorieGoal: req.user.dailyCalorieGoal
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  analyzeFood,
  getFoodHistory,
  getFoodEntryById,
  deleteFoodEntry,
  getDashboardSummary
};
