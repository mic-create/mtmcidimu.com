import { Router } from 'express';
import { 
  getAppointments, 
  updateAppointmentStatus 
} from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Retrieve all appointments (Admin authenticated)
router.get('/', authenticateToken, getAppointments);

// Update status routes - supporting standard REST endpoints
router.patch('/:id', authenticateToken, updateAppointmentStatus);
router.patch('/:id/status', authenticateToken, updateAppointmentStatus);
router.put('/:id', authenticateToken, updateAppointmentStatus);
router.put('/:id/status', authenticateToken, updateAppointmentStatus);

export default router;