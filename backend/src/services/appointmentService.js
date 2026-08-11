import prisma from '../config/database.js';

/**
 * Safely parses "YYYY-MM-DD" string into a UTC Date object centered at noon
 * to prevent timezone offsets from shifting calendar days.
 */
const parseCalendarDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Create UTC date at 12:00:00 (Noon UTC)
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
};

/**
 * Formats a Date object or DB date string to strictly "YYYY-MM-DD"
 */
const formatCalendarDate = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.split('T')[0];
  }
  const d = new Date(dateVal);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retrieves a list of appointments.
 */
export const getAppointmentsService = async () => {
  const appointments = await prisma.appointment.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      appointmentDate: true,
      appointmentTime: true,
      reason: true,
      appointmentType: true,
      status: true,
      createdAt: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true
        }
      },
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  const formattedAppointments = appointments.map((app) => ({
    ...app,
    status: app.status.toLowerCase(),
    appointmentDate: formatCalendarDate(app.appointmentDate)
  }));

  return {
    status: 200,
    data: {
      success: true,
      message: 'Appointments retrieved successfully.',
      data: formattedAppointments
    }
  };
};

/**
 * Creates an appointment preserving strict calendar dates.
 */
export const createAppointmentService = async (payload) => {
  const departmentInput = payload.department;
  const doctorInput = payload.selected_doctor ?? payload.doctor;
  const appointmentDateStr = payload.appointment_date || payload.date;
  const appointmentTime = payload.appointment_time || payload.time;

  const patientDetails = payload.patientDetails || payload.patient || {};
  const firstName = (patientDetails.firstName || patientDetails.first_name || payload.firstName || payload.first_name || '').trim();
  const lastName = (patientDetails.lastName || patientDetails.last_name || payload.lastName || payload.last_name || '').trim();
  const email = (patientDetails.email || payload.email || '').trim().toLowerCase();
  const phone = (patientDetails.phone || payload.phone || '').trim();
  const dobStr = patientDetails.dob || payload.dob || null;
  const gender = patientDetails.gender || payload.gender || null;
  const address = patientDetails.address || payload.address || null;

  const reason = payload.reason || patientDetails.reason || 'General Consultation';
  const appointmentType = payload.appointment_type || 'General Checkup';

  // Parse Calendar Date reliably
  const bookingDate = parseCalendarDate(appointmentDateStr);
  if (!bookingDate) {
    return {
      status: 422,
      data: { success: false, message: 'Invalid appointment date format. Use YYYY-MM-DD.' }
    };
  }

  // Check past date boundary using UTC midnight
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const bookingDateMidnightUTC = new Date(Date.UTC(bookingDate.getUTCFullYear(), bookingDate.getUTCMonth(), bookingDate.getUTCDate(), 0, 0, 0));

  if (bookingDateMidnightUTC < todayUTC) {
    return {
      status: 422,
      data: { success: false, message: 'Appointment date cannot be in the past.' }
    };
  }

  // Department Verification
  let department = null;
  const isDeptId = !isNaN(parseInt(departmentInput, 10)) && Number.isInteger(Number(departmentInput));

  if (isDeptId) {
    department = await prisma.department.findFirst({
      where: { id: parseInt(departmentInput, 10), isActive: true }
    });
  } else {
    department = await prisma.department.findFirst({
      where: { name: { equals: String(departmentInput), mode: 'insensitive' }, isActive: true }
    });
  }

  if (!department) {
    return {
      status: 404,
      data: { success: false, message: 'Selected medical department was not found or is inactive.' }
    };
  }

  // Doctor Verification
  let doctor = null;
  const isDocId = !isNaN(parseInt(doctorInput, 10)) && Number.isInteger(Number(doctorInput));

  if (isDocId) {
    doctor = await prisma.doctor.findFirst({
      where: { id: parseInt(doctorInput, 10), isActive: true }
    });
  } else {
    doctor = await prisma.doctor.findFirst({
      where: { name: { equals: String(doctorInput), mode: 'insensitive' }, isActive: true }
    });
  }

  if (!doctor) {
    return {
      status: 404,
      data: { success: false, message: 'Selected doctor was not found or is inactive.' }
    };
  }

  if (doctor.departmentId !== department.id) {
    return {
      status: 400,
      data: { success: false, message: 'Selected doctor does not belong to the selected department.' }
    };
  }

  // Double Booking Conflict Check
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: doctor.id,
      appointmentDate: bookingDate,
      appointmentTime: appointmentTime,
      status: { in: ['PENDING', 'CONFIRMED'] }
    }
  });

  if (conflict) {
    return {
      status: 409,
      data: {
        success: false,
        message: 'Doctor is not available at the selected time. Please select another time slot.'
      }
    };
  }

  // Execute Transaction
  const result = await prisma.$transaction(async (tx) => {
    let patient = await tx.patient.findFirst({
      where: { email }
    });

    if (patient) {
      patient = await tx.patient.update({
        where: { id: patient.id },
        data: {
          firstName,
          lastName,
          phone,
          ...(dobStr && { dob: parseCalendarDate(dobStr) }),
          ...(gender && { gender }),
          ...(address && { address })
        }
      });
    } else {
      patient = await tx.patient.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          dob: dobStr ? parseCalendarDate(dobStr) : null,
          gender,
          address
        }
      });
    }

    const newAppointment = await tx.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: department.id,
        appointmentDate: bookingDate,
        appointmentTime,
        reason,
        appointmentType,
        status: 'PENDING'
      }
    });

    return {
      id: newAppointment.id,
      status: 'pending',
      date: formatCalendarDate(newAppointment.appointmentDate),
      time: newAppointment.appointmentTime,
      doctor_name: doctor.name,
      department_name: department.name
    };
  });

  return {
    status: 201,
    data: {
      success: true,
      message: 'Appointment request created successfully.',
      appointment: result
    }
  };
};

/**
 * Retrieves appointment details by ID.
 */
export const getAppointmentByIdService = async (appointmentId) => {
  const id = parseInt(appointmentId, 10);
  if (isNaN(id)) {
    return {
      status: 400,
      data: { success: false, message: 'Invalid appointment ID format.' }
    };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dob: true,
          gender: true,
          address: true
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true
        }
      },
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!appointment) {
    return {
      status: 404,
      data: { success: false, message: 'Appointment not found.' }
    };
  }

  const formattedAppointment = {
    ...appointment,
    status: appointment.status.toLowerCase(),
    appointmentDate: formatCalendarDate(appointment.appointmentDate),
    patient: {
      ...appointment.patient,
      ...(appointment.patient.dob && { dob: formatCalendarDate(appointment.patient.dob) })
    }
  };

  return {
    status: 200,
    data: {
      success: true,
      message: 'Appointment retrieved successfully.',
      data: formattedAppointment
    }
  };
};