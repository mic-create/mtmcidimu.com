import { Router } from 'express';
import { createAppointment, getAppointments } from '../controllers/appointmentController.js';

const router = Router();

// Public endpoint for patient appointment creation
router.post('/', createAppointment);

// Admin dashboard endpoint
router.get('/', getAppointments);

export default router;