import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    default: 'serving'
  },
  calories: {
    type: Number,
    default: 0
  },
  protein: {
    type: Number,
    default: 0 // in grams
  },
  carbs: {
    type: Number,
    default: 0 // in grams
  },
  fat: {
    type: Number,
    default: 0 // in grams
  },
  fiber: {
    type: Number,
    default: 0 // in grams
  },
  confidence: {
    type: Number,
    default: 1.0 // confidence score from AI (0.0 to 1.0)
  }
});

const foodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    imageUrl: {
      type: String,
      required: [true, 'Food image URL is required']
    },
    foodItems: {
      type: [foodItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A food entry must contain at least one food item.'
      }
    },
    totalNutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 }
    },
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      enum: {
        values: ['breakfast', 'lunch', 'dinner', 'snack'],
        message: '{VALUE} is not a valid meal type (breakfast, lunch, dinner, snack)'
      }
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast querying of user food logs (paginated, sorted by date)
foodEntrySchema.index({ userId: 1 });
foodEntrySchema.index({ createdAt: -1 });
foodEntrySchema.index({ userId: 1, createdAt: -1 }); // Compound index for query: find({userId}).sort({createdAt: -1})

const FoodEntry = mongoose.model('FoodEntry', foodEntrySchema);

export default FoodEntry;
