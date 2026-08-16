import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory of src
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/food_nutrition_analyzer',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_token_123456',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  NUTRITION_API_KEY: process.env.NUTRITION_API_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Log warning/error messages for ease of development
if (!process.env.MONGO_URI) {
  console.log('💡 INFO: MONGO_URI is not set. Defaulting to local: mongodb://localhost:27017/food_nutrition_analyzer');
}

if (env.JWT_SECRET === 'dev_jwt_secret_token_123456') {
  console.log('⚠️ WARNING: Using default JWT secret. Change JWT_SECRET in production.');
}

if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  console.log('ℹ️ NOTICE: Cloudinary credentials are not configured. Uploads will fall back to local/simulation mode.');
}

if (!env.AI_API_KEY) {
  console.log('ℹ️ NOTICE: AI_API_KEY is not configured. Food analysis will use local AI simulation.');
}

if (!env.NUTRITION_API_KEY) {
  console.log('ℹ️ NOTICE: NUTRITION_API_KEY is not configured. Nutrition lookups will use local static database.');
}

export default env;
