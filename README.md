# Food Nutrition Analyzer - Backend API

A complete, production-ready, modular Node.js/Express.js backend for the Food Nutrition Analyzer and AI Food Scanner application. This API allows users to upload/capture a photo of their meals, which is analyzed by Gemini Vision AI to identify individual ingredients. The backend then fetches exact nutritional estimations from Edamam (or a local database fallback), aggregates nutritional metrics, and stores the food entry in MongoDB.

---

## 🚀 Features

- **JWT Authentication**: Secure registration, login, and user profile management.
- **AI Food Recognition**: Integrated with Google Gemini API (`gemini-1.5-flash` model) to detect multiple food items, estimate quantity, and calculate recognition confidence.
- **Nutrition API Integration**: Integrated with Edamam Food Database API to retrieve precise nutrient breakdowns.
- **Seamless Local Fallback**: Dynamic fallback system to local mock/static models for Cloudinary, Gemini AI, and Edamam Nutrition so the backend works **out-of-the-box** without configuration keys.
- **Image Processing**: Handles multipart image uploads (jpg, png, webp) in-memory using Multer and pipes them directly to Cloudinary.
- **Aggregated Dashboard**: Daily user summaries mapping cumulative progress against their customized daily calorie goals.
- **Production Security**: Equipped with Helmet security headers, CORS protection, request validations (via `express-validator`), and API rate limiting (general rate limiter + specific rate limiter for AI analysis).
- **Centralized Error Handling**: Standardized error response objects and status codes with clean user-facing error descriptions.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules, `"type": "module"`)
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose
- **Authorization**: JSON Web Tokens (JWT) & bcryptjs
- **File Management**: Multer (In-memory storage) & Cloudinary SDK
- **Integrations**: Google Generative AI (`@google/generative-ai`), Edamam API (via Fetch)
- **Security**: CORS, Helmet, Express Rate Limit, Express Validator

---

## 📂 Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                # Database connection setup
│   │   ├── cloudinary.js        # Cloudinary SDK client configuration
│   │   └── env.js               # Safe environment variable configuration and checker
│   │
│   ├── controllers/
│   │   ├── authController.js    # Register, login, and session checks
│   │   ├── foodController.js    # Analyze food, logs history, dashboard aggregates, delete logs
│   │   └── userController.js    # Profile retrieval and updates
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT authorization validator
│   │   ├── uploadMiddleware.js  # Multer size & file extension limits
│   │   ├── errorMiddleware.js   # Centralized error formatter (404 and global catch-alls)
│   │   └── validationMiddleware.js # Intercepts express-validator errors
│   │
│   ├── models/
│   │   ├── User.js              # User details, password hashes comparison helpers
│   │   └── FoodEntry.js         # Food logs schemas, compound indexes
│   │
│   ├── routes/
│   │   ├── authRoutes.js        # Mapping auth controllers
│   │   ├── foodRoutes.js        # Mapping food log and analyzer controllers
│   │   └── userRoutes.js        # Mapping profile modification controllers
│   │
│   ├── services/
│   │   ├── aiService.js         # Gemini Vision AI interface with JSON validators
│   │   ├── nutritionService.js  # Edamam API parser and static dictionary fallback database
│   │   └── cloudinaryService.js # Cloudinary file stream uploaders and deletion helpers
│   │
│   ├── utils/
│   │   ├── generateToken.js     # JWT token signing helper
│   │   └── calculateNutrition.js# Nutritional properties calculator and rounding tool
│   │
│   └── app.js                   # Application middlewares pipeline bootstrap
│
├── server.js                    # Server startup entry point
├── .env                         # Custom configuration keys (git-ignored)
├── .env.example                 # Configuration variables template
├── .gitignore                   # Ignored files list
└── package.json                 # Project dependencies & scripts
```

---

## ⚙️ Environment Variables Config

Create a `.env` file at the root of the `backend/` folder based on `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/food_nutrition_analyzer
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
AI_API_KEY=your_google_gemini_api_key
NUTRITION_API_KEY=your_edamam_app_id:your_edamam_app_key
CLIENT_URL=http://localhost:5173
```

> [!NOTE]
> **Edamam Key Format**: For the `NUTRITION_API_KEY`, merge your Edamam App ID and App Key using a colon separator (`app_id:app_key`).
> **Simulation Mode**: If `AI_API_KEY`, `NUTRITION_API_KEY`, or `CLOUDINARY` values are left blank, the system automatically falls back to simulated database matching (using keywords in the notes field to mimic food results).

---

## 📥 Installation & Local Run

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [MongoDB](https://www.mongodb.com/) installed and running locally, or an Atlas Mongo URI.

### Setup Instructions

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in Development Mode (runs nodemon):
   ```bash
   npm run dev
   ```

4. Run in Production Mode:
   ```bash
   npm start
   ```

---

## 🔌 API Endpoints Summary

### Authentication APIs (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register user and receive session JWT token. |
| **POST** | `/api/auth/login` | Public | Login credentials validation. |
| **GET** | `/api/auth/me` | Protected | Fetch currently logged-in user profile session. |

### User Profile APIs (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/users/profile` | Protected | Fetch current user details. |
| **PUT** | `/api/users/profile` | Protected | Update profile (name, daily calorie goal, profile image). |

### Food Analyzer & Logs APIs (`/api/food`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/food/analyze` | Protected | Analyze food image, fetch nutrition, and log entry. |
| **GET** | `/api/food/dashboard` | Protected | Today's cumulative nutrition totals and daily targets. |
| **GET** | `/api/food/history` | Protected | Paginated food logs (newest first). Supports `?page=1&limit=10`. |
| **GET** | `/api/food/:id` | Protected | Get detailed nutrition data for a single log. |
| **DELETE** | `/api/food/:id` | Protected | Delete log entry and clear corresponding image in Cloudinary. |

---

## 📡 Testing the API (Postman / cURL Guide)

For all **Protected** endpoints, you must include the JWT token returned in the register or login response in your request headers:
- Header Key: `Authorization`
- Header Value: `Bearer <YOUR_JWT_TOKEN>`

### 1. Register a User
- **Endpoint**: `POST http://localhost:5000/api/auth/register`
- **Body** (JSON):
  ```json
  {
    "name": "Pooja",
    "email": "pooja@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "64db73e512fd5e3532e0123a",
        "name": "Pooja",
        "email": "pooja@example.com"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 2. Food Image Analysis
- **Endpoint**: `POST http://localhost:5000/api/food/analyze`
- **Request Type**: `multipart/form-data`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Form Data Fields**:
  - `image`: Select a picture of food (e.g. `salad.jpg` or `pizza.png`).
  - `mealType`: `lunch` (Optional, must be `breakfast`, `lunch`, `dinner`, or `snack`)
  - `notes`: `Homemade salad` (Optional)
  - `quantity`: `150` (Optional portion override)
  - `unit`: `g` (Optional portion unit override)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Food analyzed successfully",
    "data": {
      "foodEntry": {
        "id": "64db75e812fd5e3532e0125c",
        "imageUrl": "https://res.cloudinary.com/...",
        "foodItems": [
          {
            "name": "Green Salad",
            "quantity": 150,
            "unit": "g",
            "calories": 22.5,
            "protein": 1.5,
            "carbs": 4.5,
            "fat": 0.3,
            "fiber": 2.3,
            "confidence": 0.96
          }
        ],
        "totalNutrition": {
          "calories": 22.5,
          "protein": 1.5,
          "carbs": 4.5,
          "fat": 0.3,
          "fiber": 2.3
        },
        "mealType": "lunch",
        "notes": "Homemade salad",
        "createdAt": "2026-08-15T21:02:11.000Z"
      }
    },
    "disclaimer": "Nutrition values are estimates and may vary based on ingredients, preparation method, and portion size."
  }
  ```

### 3. Dashboard Cumulative Summary
- **Endpoint**: `GET http://localhost:5000/api/food/dashboard`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-08-15",
      "calories": 1450,
      "protein": 68.4,
      "carbs": 182,
      "fat": 42.1,
      "fiber": 21.6,
      "mealCount": 3,
      "calorieGoal": 2000
    }
  }
  ```

### 4. Fetch Paginated History
- **Endpoint**: `GET http://localhost:5000/api/food/history?page=1&limit=5`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "foods": [ ... ],
      "pagination": {
        "page": 1,
        "limit": 5,
        "total": 12,
        "pages": 3
      }
    }
  }
  ```

---

## 🛡️ Security Implementations

1. **Helmet**: Protects the HTTP response headers from well-known security exploits.
2. **CORS (Cross-Origin Resource Sharing)**: Restricts request routing exclusively to your frontend URL.
3. **Password Hashing**: Pre-save model hooks hash plain-text user passwords using bcryptjs with 10 salt rounds.
4. **Rate Limiters**: 
   - General API Route: Limit of 100 requests per 15 minutes.
   - Food Image Analyzer Route: Limit of 10 requests per 15 minutes to prevent visual server processing abuse.
5. **Request Validations**: Strict query and parameter validation using `express-validator` to guarantee sanitization before DB insertions.
6. **Information Isolation**: Centralized exception handler strips system stacks and database schemas prior to returning outputs to the clients.
