import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response.js';

const prisma = new PrismaClient();

// Allowed Prisma AppointmentStatus Enum values
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: true,
        doctor: true,
        department: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    next(error);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 'Status field is required.', 400);
    }

    const normalizedStatus = status.toUpperCase();

    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return errorResponse(
        res,
        `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    const appointmentId = isNaN(id) ? id : parseInt(id, 10);

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existingAppointment) {
      return errorResponse(res, 'Appointment record not found.', 404);
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: normalizedStatus },
    });

    return res.status(200).json({
      success: true,
      message: `Appointment status successfully updated to ${normalizedStatus}`,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    next(error);
  }
};