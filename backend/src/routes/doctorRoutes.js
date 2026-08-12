import { Router } from 'express';
import { getDoctors, getDoctorById } from '../controllers/doctorController.js';

const router = Router();

// Public endpoints for patient booking flow
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

export default router;