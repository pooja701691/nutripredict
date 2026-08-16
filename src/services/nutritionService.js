import env from '../config/env.js';

// Comprehensive local food nutrition database (per default quantity and unit)
// Used when Edamam API is not configured or is offline/unavailable.
const LOCAL_FOOD_DB = {
  pizza: { calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2, defaultUnit: 'slice', defaultQty: 1 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, defaultUnit: 'g', defaultQty: 100 },
  dal: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 5, defaultUnit: 'g', defaultQty: 100 },
  paneer: { calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, defaultUnit: 'g', defaultQty: 100 },
  'green salad': { calories: 15, protein: 1, carbs: 3, fat: 0.2, fiber: 1.5, defaultUnit: 'g', defaultQty: 100 },
  salad: { calories: 15, protein: 1, carbs: 3, fat: 0.2, fiber: 1.5, defaultUnit: 'g', defaultQty: 100 },
  'boiled egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, defaultUnit: 'piece', defaultQty: 1 },
  egg: { calories: 70, protein: 6, carbs: 0.6, fat: 5, fiber: 0, defaultUnit: 'piece', defaultQty: 1 },
  'whole wheat bread': { calories: 80, protein: 4, carbs: 15, fat: 1, fiber: 2, defaultUnit: 'slice', defaultQty: 1 },
  bread: { calories: 75, protein: 3, carbs: 14, fat: 1, fiber: 1, defaultUnit: 'slice', defaultQty: 1 },
  'chicken burger': { calories: 350, protein: 22, carbs: 40, fat: 12, fiber: 2, defaultUnit: 'piece', defaultQty: 1 },
  burger: { calories: 320, protein: 18, carbs: 38, fat: 11, fiber: 1.8, defaultUnit: 'piece', defaultQty: 1 },
  'avocado toast': { calories: 250, protein: 6, carbs: 24, fat: 15, fiber: 6, defaultUnit: 'piece', defaultQty: 1 },
  apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, defaultUnit: 'g', defaultQty: 100 },
  banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, defaultUnit: 'g', defaultQty: 100 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, defaultUnit: 'g', defaultQty: 100 },
  chicken: { calories: 165, protein: 30, carbs: 0, fat: 4, fiber: 0, defaultUnit: 'g', defaultQty: 100 },
  oatmeal: { calories: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7, defaultUnit: 'g', defaultQty: 100 },
  salmon: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, defaultUnit: 'g', defaultQty: 100 },
  milk: { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, defaultUnit: 'ml', defaultQty: 100 },
  'greek yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, defaultUnit: 'g', defaultQty: 100 },
  almonds: { calories: 579, protein: 21, carbs: 22, fat: 49, fiber: 12, defaultUnit: 'g', defaultQty: 100 },
  broccoli: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, defaultUnit: 'g', defaultQty: 100 }
};

/**
 * Fetch nutrition estimates using local dictionary.
 */
const getLocalNutrition = (foodName, quantity, unit) => {
  const normalizedFood = String(foodName || '').toLowerCase().trim();
  const qty = typeof quantity === 'number' ? quantity : 1;
  const targetUnit = String(unit || 'serving').toLowerCase().trim();

  // Find exact match or key partial match
  let baseFood = LOCAL_FOOD_DB[normalizedFood];
  if (!baseFood) {
    // Look for partial key matching (e.g. "red apple" matching "apple")
    const matchKey = Object.keys(LOCAL_FOOD_DB).find(
      (key) => normalizedFood.includes(key) || key.includes(normalizedFood)
    );
    baseFood = matchKey ? LOCAL_FOOD_DB[matchKey] : null;
  }

  // Fallback to average generic values if not found in database
  if (!baseFood) {
    console.log(`ℹ️ [Static DB] No exact database entry for: "${foodName}". Using generic estimate.`);
    // A sensible default average food item
    const baseCalories = 120;
    const baseProtein = 3;
    const baseCarbs = 15;
    const baseFat = 4;
    const baseFiber = 1.2;

    return {
      calories: Math.round(qty * baseCalories * 10) / 10,
      protein: Math.round(qty * baseProtein * 10) / 10,
      carbs: Math.round(qty * baseCarbs * 10) / 10,
      fat: Math.round(qty * baseFat * 10) / 10,
      fiber: Math.round(qty * baseFiber * 10) / 10
    };
  }

  // Scale based on quantity comparison
  // If the units match or we are scaling by general factor
  let scaleFactor = 1;
  if (baseFood.defaultUnit === targetUnit || (baseFood.defaultUnit === 'g' && targetUnit === 'g')) {
    scaleFactor = qty / baseFood.defaultQty;
  } else {
    // If unit is mismatching (e.g. piece vs g), we approximate
    // Assume 1 piece / slice is equal to the base DB representation.
    scaleFactor = qty;
  }

  return {
    calories: Math.round(baseFood.calories * scaleFactor * 10) / 10,
    protein: Math.round(baseFood.protein * scaleFactor * 10) / 10,
    carbs: Math.round(baseFood.carbs * scaleFactor * 10) / 10,
    fat: Math.round(baseFood.fat * scaleFactor * 10) / 10,
    fiber: Math.round(baseFood.fiber * scaleFactor * 10) / 10
  };
};

/**
 * Retrieve nutrition information for a food item.
 * Connects to Edamam API, or falls back gracefully to a local dictionary.
 * 
 * @param {string} foodName - Name of the food
 * @param {number} quantity - Portion size
 * @param {string} unit - Measurement unit (g, slice, piece, cup, etc.)
 * @returns {Promise<Object>} Object containing calories, protein, carbs, fat, fiber
 */
export const getNutrition = async (foodName, quantity, unit) => {
  const qty = typeof quantity === 'number' ? quantity : 1;
  const measurement = unit || 'serving';

  console.log(`🍏 Nutrition Lookup: Querying "${qty} ${measurement} ${foodName}"`);

  // Parse Edamam App ID and Key from NUTRITION_API_KEY
  // Expected format in env: app_id:app_key
  const hasCreds = env.NUTRITION_API_KEY && env.NUTRITION_API_KEY.includes(':');
  
  if (!hasCreds) {
    console.log('ℹ️ Edamam credentials not configured. Querying local database.');
    return getLocalNutrition(foodName, quantity, unit);
  }

  try {
    const [appId, appKey] = env.NUTRITION_API_KEY.split(':');
    const query = `${qty} ${measurement} ${foodName}`;
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Edamam API returned status ${response.status}`);
    }

    const data = await response.json();

    // If API returned matching items
    if (data && data.parsed && data.parsed[0] && data.parsed[0].food) {
      const nutrients = data.parsed[0].food.nutrients;
      console.log('✅ Nutrition lookup successful via Edamam');
      return {
        calories: Math.round((nutrients.ENERC_KCAL || 0) * 10) / 10,
        protein: Math.round((nutrients.PROCNT || 0) * 10) / 10,
        carbs: Math.round((nutrients.CHOCDF || 0) * 10) / 10,
        fat: Math.round((nutrients.FAT || 0) * 10) / 10,
        fiber: Math.round((nutrients.FIBTG || 0) * 10) / 10
      };
    } else if (data && data.hints && data.hints[0] && data.hints[0].food) {
      const nutrients = data.hints[0].food.nutrients;
      console.log('✅ Nutrition lookup successful via Edamam (hints)');
      // Edamam hints returns nutrients per 100g. Scale according to estimated quantity.
      // Assume default generic scaling if unit is not grams
      const isGrams = measurement.toLowerCase() === 'g';
      const scaleFactor = isGrams ? qty / 100 : qty;

      return {
        calories: Math.round((nutrients.ENERC_KCAL || 0) * scaleFactor * 10) / 10,
        protein: Math.round((nutrients.PROCNT || 0) * scaleFactor * 10) / 10,
        carbs: Math.round((nutrients.CHOCDF || 0) * scaleFactor * 10) / 10,
        fat: Math.round((nutrients.FAT || 0) * scaleFactor * 10) / 10,
        fiber: Math.round((nutrients.FIBTG || 0) * scaleFactor * 10) / 10
      };
    }

    console.log('ℹ️ Edamam parser returned no direct matches. Falling back to local database.');
    return getLocalNutrition(foodName, quantity, unit);

  } catch (error) {
    console.error(`⚠️ Edamam API Lookup failed: ${error.message}. Falling back to local database.`);
    return getLocalNutrition(foodName, quantity, unit);
  }
};

export default {
  getNutrition
};
