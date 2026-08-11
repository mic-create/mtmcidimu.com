import {
  createAppointmentService,
  getAppointmentByIdService,
  getAppointmentsService
} from '../services/appointmentService.js';

/**
 * Get all appointments (or default base list)
 * GET /api/appointments
 */
export const getAppointments = async (req, res, next) => {
  try {
    const result = await getAppointmentsService();
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new appointment
 * POST /api/appointments
 */
export const createAppointment = async (req, res, next) => {
  try {
    const result = await createAppointmentService(req.body);
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment details by ID
 * GET /api/appointments/:id
 */
export const getAppointmentById = async (req, res, next) => {
  try {
    const result = await getAppointmentByIdService(req.params.id);
    return res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};