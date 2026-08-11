import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

/**
 * Handles 404 - Not Found for unhandled API routes
 */
export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Route not found - ${req.originalUrl}`, 404);
};

/**
 * Centralized Application Error Handler
 */
export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  // Do not expose internal technical details, passwords, stack traces, or DB URLs in production
  if (env.NODE_ENV === 'production') {
    return errorResponse(
      res,
      statusCode === 500 ? 'An unexpected error occurred on the server.' : message,
      statusCode
    );
  }

  // Development output
  return res.status(statusCode).json({
    success: false,
    message,
    stack: err.stack
  });
};