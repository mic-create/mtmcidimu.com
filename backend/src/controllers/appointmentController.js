import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createAppointment = async (req, res, next) => {
  try {
    const {
      department,
      department_id,
      selected_doctor,
      doctor_id,
      appointment_date,
      appointment_time,
      patientDetails,
      patient_name,
      patient_email,
      patient_phone,
      first_name,
      last_name,
      reason
    } = req.body;

    // Extract patient details safely
    const fullName = patient_name || (patientDetails ? patientDetails.fullName : '') || `${first_name || ''} ${last_name || ''}`.trim();
    const email = patient_email || (patientDetails ? patientDetails.email : '');
    const phone = patient_phone || (patientDetails ? patientDetails.phone : '');

    const docId = doctor_id || selected_doctor;
    const deptId = department_id || department;

    // Generate reference code
    const referenceNumber = `MTMC-${Math.floor(100000 + Math.random() * 900000)}`;

    const appointment = await prisma.appointment.create({
      data: {
        referenceNumber,
        patientName: fullName,
        patientEmail: email,
        patientPhone: phone,
        appointmentDate: new Date(appointment_date),
        appointmentTime: appointment_time,
        reason: reason || 'General Consultation',
        status: 'PENDING',
        ...(docId && { doctorId: String(docId) }),
        ...(deptId && { departmentId: String(deptId) })
      }
    });

    return successResponse(res, 'Appointment created successfully.', appointment, 201);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return errorResponse(
      res,
      `Failed to create appointment: ${error.message}`,
      500
    );
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 'Appointments retrieved successfully.', appointments);
  } catch (error) {
    next(error);
  }
};