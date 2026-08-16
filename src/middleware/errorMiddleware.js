import env from '../config/env.js';

/**
 * Centralized global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected server error occurred';
  let errors = err.errors || [];

  // Log error details for development troubleshooting
  console.error(`🚨 Error caught in [${req.method} ${req.url}]:`, err.message);
  if (env.NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  // Handle Mongoose validation errors (e.g. schema requirement fails)
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message
    }));
  }

  // Handle Mongoose duplicate keys (e.g. registering duplicate email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = 'Conflict detected';
    errors = [
      {
        field,
        message: `This ${field} is already in use. Please use another one.`
      }
    ];
  }

  // Handle Mongoose CastError (e.g. invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found: Invalid ID format for ${err.path}`;
  }

  // Handle Multer upload size limit error
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Upload failed: Image size exceeds the maximum limit of 5 MB.';
  }

  // Handle standard JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Bad Request: Invalid JSON body syntax.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Route not found (404) fallback middleware
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
