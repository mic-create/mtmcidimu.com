import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { getDashboardStats, getAllAppointments } from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN', 'STAFF'));

router.get('/stats', getDashboardStats);
router.get('/appointments', getAllAppointments);

export default router;