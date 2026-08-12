import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Extract token from "Bearer <TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 'Access token required. Please log in.', 401);
  }

  const jwtSecret = env.JWT_SECRET || process.env.JWT_SECRET;

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return errorResponse(res, 'Invalid or expired session token.', 403);
    }

    // Attach decoded token payload (e.g., user id, email, role) to request object
    req.user = user;
    next();
  });
};