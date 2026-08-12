// routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Global middleware for ALL /api/admin routes
router.use(authenticateJWT);
router.use(authorizeRoles('ADMIN', 'STAFF'));

// --- PROTECTED ADMIN ENDPOINTS ---

// GET /api/admin/appointments (Fetch all patient appointments with filter/search)
router.get('/appointments', adminController.getAllAppointments);

// PATCH /api/admin/appointments/:id/status (Update appointment status: Approved, Cancelled, Completed)
router.patch('/appointments/:id/status', adminController.updateAppointmentStatus);

// GET /api/admin/stats (Dashboard KPI Metrics)
router.get('/stats', adminController.getDashboardStats);

module.exports = router;