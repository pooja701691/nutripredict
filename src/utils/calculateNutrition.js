/**
 * Calculate total nutrition values by summing all items and rounding them.
 * @param {Array} foodItems - Array of food items with nutrition properties
 * @returns {Object} Total nutrition object
 */
export const calculateTotalNutrition = (foodItems) => {
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };
  }

  const totals = foodItems.reduce(
    (acc, item) => {
      acc.calories += Number(item.calories || 0);
      acc.protein += Number(item.protein || 0);
      acc.carbs += Number(item.carbs || 0);
      acc.fat += Number(item.fat || 0);
      acc.fiber += Number(item.fiber || 0);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  // Round numbers to 1 decimal precision
  return {
    calories: Math.round(totals.calories * 10) / 10,
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    fiber: Math.round(totals.fiber * 10) / 10
  };
};

export default calculateTotalNutrition;
