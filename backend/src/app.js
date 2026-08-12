import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { successResponse } from './utils/response.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorMiddleware.js';

import departmentRoutes from './routes/departmentRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import appointmentRoutes from './routes/appointmentRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default allowed origins array
const defaultOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://mtmcidimu.vercel.app'
];

// Parse FRONTEND_ORIGIN from environment variables (comma-separated string)
const envOrigins = env.FRONTEND_ORIGIN 
  ? env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim().replace(/\/$/, ''))
  : [];

// Combine and deduplicate allowed origins
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, cURL, or server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalizedOrigin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Auth & Admin Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health & Status Routes
app.get('/', (req, res) => {
  return successResponse(res, 'Mother Teresa Medical Centre API is running.');
});

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Mother Teresa Medical Centre API is operational.',
    status: 'healthy'
  });
});

// Resource Routes
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;