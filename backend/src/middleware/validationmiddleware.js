import { body, validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware to catch and format express-validator input errors.
 */
export const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return first validation error message to match frontend specifications
    const firstError = errors.array()[0].msg;
    return errorResponse(res, firstError, 422);
  }
  next();
};

/**
 * Validation rules for Appointment Creation
 */
export const validateAppointmentPayload = [
  body().custom((value, { req }) => {
    const department = req.body.department;
    if (!department && department !== 0) {
      throw new Error('Department selection is required.');
    }

    const doctor = req.body.selected_doctor ?? req.body.doctor;
    if (!doctor && doctor !== 0) {
      throw new Error('Doctor selection is required.');
    }

    const date = req.body.appointment_date || req.body.date;
    if (!date) {
      throw new Error('Appointment date is required.');
    }

    const time = req.body.appointment_time || req.body.time;
    if (!time) {
      throw new Error('Appointment time is required.');
    }

    const patientData = req.body.patientDetails || req.body.patient || {};
    const firstName = patientData.firstName || patientData.first_name || req.body.firstName || req.body.first_name;
    if (!firstName || !firstName.toString().trim()) {
      throw new Error('Patient first name is required.');
    }

    const lastName = patientData.lastName || patientData.last_name || req.body.lastName || req.body.last_name;
    if (!lastName || !lastName.toString().trim()) {
      throw new Error('Patient last name is required.');
    }

    const email = patientData.email || req.body.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.toString().trim())) {
      throw new Error('A valid patient email address is required.');
    }

    const phone = patientData.phone || req.body.phone;
    const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
    if (!phone || !phoneRegex.test(phone.toString().trim())) {
      throw new Error('A valid patient phone number is required.');
    }

    return true;
  })
];