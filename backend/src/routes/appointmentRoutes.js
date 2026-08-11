import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointmentById
} from '../controllers/appointmentController.js';
import { validateAppointmentPayload, validateInput } from '../middleware/validationMiddleware.js';

const router = Router();

router.get('/', getAppointments);
router.post('/', validateAppointmentPayload, validateInput, createAppointment);
router.get('/:id', getAppointmentById);

export default router;