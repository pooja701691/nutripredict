import { GoogleGenAI } from "@google/genai";
import env from "../config/env.js";

/**
 * Fetch image from Cloudinary URL
 * and convert it to base64 format for Gemini.
 */
const fetchImageAsBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image from URL: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType =
      response.headers.get("content-type") || "image/jpeg";

    return {
      data: buffer.toString("base64"),
      mimeType: contentType,
    };
  } catch (error) {
    throw new Error(
      `Failed to process image: ${error.message}`
    );
  }
};

/**
 * Remove markdown code fences if Gemini returns JSON
 * inside ```json ... ```
 */
const cleanJsonResponse = (text) => {
  let cleaned = text.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }

  return cleaned.trim();
};

/**
 * Analyze food image using Gemini.
 *
 * @param {string} imageUrl - Cloudinary image URL
 * @param {string} notes - Optional user notes
 * @returns {Promise<Object>}
 */
export const analyzeFoodImage = async (
  imageUrl,
  notes = ""
) => {
  console.log("🤖 AI Service: Starting image analysis...");

  // -----------------------------------------
  // Simulation mode
  // -----------------------------------------
  if (!env.AI_API_KEY) {
    console.log(
      "ℹ️ AI Service: API key not found. Using simulation mode."
    );

    return simulateFoodAnalysis(notes);
  }

  try {
    // -----------------------------------------
    // Create Gemini client
    // -----------------------------------------
    const ai = new GoogleGenAI({
      apiKey: env.AI_API_KEY,
    });

    // -----------------------------------------
    // Download Cloudinary image
    // -----------------------------------------
    console.log("📥 Downloading image from Cloudinary...");

    const image = await fetchImageAsBase64(imageUrl);

    console.log("✅ Image converted to base64");

    // -----------------------------------------
    // Prompt
    // -----------------------------------------
    const prompt = `
You are a precise food vision analyzer.

Analyze the provided food image carefully.

Identify every visible food item.

For each food item provide:
- name
- estimated quantity
- unit
- confidence score

User optional notes:
"${notes || "None"}"

Return ONLY valid JSON.

Do NOT return:
- Markdown
- Code fences
- Explanations
- Extra text

The JSON must follow exactly this structure:

{
  "foodItems": [
    {
      "name": "Rice",
      "quantity": 150,
      "unit": "g",
      "confidence": 0.95
    }
  ]
}

Rules:

1. If the image does not contain food, return:
{
  "foodItems": []
}

2. Keep food names simple and descriptive.

3. Prefer grams for measurable food quantities.

4. You may use:
- g
- kg
- piece
- slice
- cup
- bowl
- serving

5. Confidence must be between 0 and 1.

6. Identify multiple food items if visible.

7. Do not invent food items that are not visible.

8. Estimate realistic portion sizes.

9. If the exact quantity cannot be determined, provide a reasonable estimate.

10. Return ONLY the JSON object.
`;

    // -----------------------------------------
    // Gemini request
    // -----------------------------------------
    console.log("🚀 Sending image to Gemini...");

    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",

      input: [
        {
          type: "image",
          data: image.data,
          mime_type: image.mimeType,
        },
        {
          type: "text",
          text: prompt,
        },
      ],
    });

    // -----------------------------------------
    // Get Gemini output
    // -----------------------------------------
    const responseText = interaction.output_text;

    if (!responseText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    console.log("🧠 Gemini Response:", responseText);

    // -----------------------------------------
    // Clean JSON
    // -----------------------------------------
    const cleanText = cleanJsonResponse(responseText);

    // -----------------------------------------
    // Parse JSON
    // -----------------------------------------
    let parsedResult;

    try {
      parsedResult = JSON.parse(cleanText);
    } catch (error) {
      console.error(
        "❌ Failed to parse Gemini JSON."
      );

      console.error(
        "Raw Gemini response:",
        responseText
      );

      throw new Error(
        "AI returned an invalid analysis result."
      );
    }

    // -----------------------------------------
    // Validate response
    // -----------------------------------------
    if (
      !parsedResult ||
      !Array.isArray(parsedResult.foodItems)
    ) {
      throw new Error(
        "AI returned an invalid analysis result."
      );
    }

    // -----------------------------------------
    // Validate food items
    // -----------------------------------------
    parsedResult.foodItems =
      parsedResult.foodItems.map((item) => {
        if (!item.name) {
          throw new Error(
            "AI returned an invalid food item."
          );
        }

        return {
          name: String(item.name).trim(),

          quantity:
            typeof item.quantity === "number"
              ? Math.max(0.1, item.quantity)
              : 1,

          unit:
            typeof item.unit === "string"
              ? item.unit.trim()
              : "serving",

          confidence:
            typeof item.confidence === "number"
              ? Math.min(
                  1,
                  Math.max(0, item.confidence)
                )
              : 0.85,
        };
      });

    console.log(
      `✅ AI Service completed: Found ${parsedResult.foodItems.length} items`
    );

    return parsedResult;
  } catch (error) {
    console.error(
      "❌ AI Service Error:",
      error.message
    );

    if (
      error.message ===
      "AI returned an invalid analysis result."
    ) {
      throw error;
    }

    throw new Error(
      `AI Vision Service failed: ${error.message}`
    );
  }
};

/**
 * Simulation mode
 */
const simulateFoodAnalysis = (notes = "") => {
  const normalizedNotes =
    notes.toLowerCase();

  let foodItems = [];

  if (normalizedNotes.includes("pizza")) {
    foodItems = [
      {
        name: "Pizza",
        quantity: 2,
        unit: "slice",
        confidence: 0.98,
      },
    ];
  } else if (
    normalizedNotes.includes("rice") ||
    normalizedNotes.includes("dal") ||
    normalizedNotes.includes("paneer")
  ) {
    foodItems = [
      {
        name: "Rice",
        quantity: 150,
        unit: "g",
        confidence: 0.95,
      },
      {
        name: "Dal",
        quantity: 120,
        unit: "g",
        confidence: 0.91,
      },
      {
        name: "Paneer",
        quantity: 100,
        unit: "g",
        confidence: 0.89,
      },
    ];
  } else if (
    normalizedNotes.includes("salad")
  ) {
    foodItems = [
      {
        name: "Green Salad",
        quantity: 150,
        unit: "g",
        confidence: 0.96,
      },
    ];
  } else if (
    normalizedNotes.includes("egg") ||
    normalizedNotes.includes("breakfast")
  ) {
    foodItems = [
      {
        name: "Boiled Egg",
        quantity: 2,
        unit: "piece",
        confidence: 0.99,
      },
      {
        name: "Whole Wheat Bread",
        quantity: 2,
        unit: "slice",
        confidence: 0.92,
      },
    ];
  } else if (
    normalizedNotes.includes("burger")
  ) {
    foodItems = [
      {
        name: "Chicken Burger",
        quantity: 1,
        unit: "piece",
        confidence: 0.97,
      },
    ];
  } else {
    foodItems = [
      {
        name: "Avocado Toast",
        quantity: 1,
        unit: "piece",
        confidence: 0.94,
      },
    ];
  }

  return {
    foodItems,
  };
};

export default {
  analyzeFoodImage,
};