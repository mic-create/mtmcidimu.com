import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Create a new appointment
 * POST /api/appointments
 */
export const createAppointment = async (req, res, next) => {
  try {
    const {
      department,
      department_id,
      selected_doctor,
      doctor_id,
      appointment_date,
      appointment_time,
      appointment_type,
      patientDetails,
      patient_name,
      patient_email,
      patient_phone,
      first_name,
      last_name,
      reason
    } = req.body;

    // Extract names safely
    let fName = first_name || (patientDetails ? patientDetails.first_name || patientDetails.firstName : '');
    let lName = last_name || (patientDetails ? patientDetails.last_name || patientDetails.lastName : '');

    if (!fName && patient_name) {
      const parts = patient_name.trim().split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || parts[0] || '';
    }

    const email = patient_email || (patientDetails ? patientDetails.email : '');
    const phone = patient_phone || (patientDetails ? patientDetails.phone : '');

    const docId = String(doctor_id || selected_doctor || '').trim() || null;
    const deptId = String(department_id || department || '').trim() || null;

    // 1. Find or create the Patient record if an email is provided
    let patientId = null;
    if (email) {
      try {
        const existingPatient = await prisma.patient.findUnique({
          where: { email }
        });

        if (existingPatient) {
          patientId = existingPatient.id;
        } else {
          const newPatient = await prisma.patient.create({
            data: {
              firstName: fName,
              lastName: lName,
              email,
              phone
            }
          });
          patientId = newPatient.id;
        }
      } catch (pErr) {
        console.warn('Patient lookup/creation warning (proceeding without linking patientId):', pErr.message);
      }
    }

    // 2. Generate unique reference code
    const referenceNumber = `MTMC-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Assemble exact data payload for Appointment model
    const appointmentData = {
      referenceNumber,
      firstName: fName,
      lastName: lName,
      patientEmail: email,
      patientPhone: phone,
      appointmentDate: appointment_date ? String(appointment_date) : null,
      appointmentTime: appointment_time ? String(appointment_time) : null,
      appointmentType: appointment_type || 'In-Person',
      reason: reason || 'General Consultation',
      status: 'PENDING',
      ...(deptId && { departmentId: deptId }),
      ...(docId && { doctorId: docId }),
      ...(patientId && { patientId: patientId })
    };

    console.log('[Prisma] Creating appointment:', appointmentData);

    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        department: true,
        doctor: true,
        patient: true
      }
    });

    return successResponse(res, 'Appointment created successfully.', appointment, 201);
  } catch (error) {
    console.error('CRITICAL: Appointment Creation Error:', error);
    return errorResponse(
      res,
      `Failed to create appointment: ${error.message}`,
      500
    );
  }
};

/**
 * Get all appointments for Admin Dashboard
 * GET /api/appointments
 */
export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        department: true,
        doctor: true,
        patient: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 'Appointments retrieved successfully.', appointments);
  } catch (error) {
    console.error('CRITICAL: Error in getAppointments:', error);
    return errorResponse(res, `Failed to retrieve appointments: ${error.message}`, 500);
  }
};