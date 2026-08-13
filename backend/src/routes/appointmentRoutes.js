import { Router } from 'express';
import { 
  createAppointment, 
  getAppointments, 
  updateAppointmentStatus 
} from '../controllers/appointmentController.js';

const router = Router();

// Public endpoint for patient booking creation
router.post('/', createAppointment);

// Admin dashboard endpoints
router.get('/', getAppointments);

// Status update routes (supporting both standard REST path and /status sub-path)
router.patch('/:id', updateAppointmentStatus);
router.put('/:id', updateAppointmentStatus);
router.patch('/:id/status', updateAppointmentStatus);
router.put('/:id/status', updateAppointmentStatus);

export default router;