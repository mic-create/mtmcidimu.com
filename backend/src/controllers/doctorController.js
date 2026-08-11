import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get all active doctors
 * GET /api/doctors
 */
export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
        biography: true,
        experience: true,
        qualifications: true,
        profileImage: true,
        availability: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return successResponse(res, 'Doctors retrieved successfully.', doctors);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single active doctor by ID
 * GET /api/doctors/:id
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const doctorId = parseInt(req.params.id, 10);

    if (isNaN(doctorId)) {
      return errorResponse(res, 'Invalid doctor ID format.', 400);
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        specialty: true,
        biography: true,
        experience: true,
        qualifications: true,
        profileImage: true,
        availability: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!doctor) {
      return errorResponse(res, 'Doctor not found.', 404);
    }

    return successResponse(res, 'Doctor retrieved successfully.', doctor);
  } catch (error) {
    next(error);
  }
};