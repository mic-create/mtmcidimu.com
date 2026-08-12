import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { successResponse } from './utils/response.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorMiddleware.js';

import departmentRoutes from './routes/departmentRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
// 1. Import route handlers (include .js extensions!)
import authRoutes from './routes/auth.js';   // Make sure this file exists in src/routes/
import adminRoutes from './routes/admin.js'; // Make sure this file exists in src/routes/
import appointmentRoutes from './routes/appointmentRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

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

app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
