import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get all active doctors (optionally filtered by departmentId query param)
 * GET /api/doctors?departmentId=ID
 */
export const getDoctors = async (req, res, next) => {
  try {
    const { departmentId } = req.query;

    const whereClause = {
      isActive: true,
    };

    if (departmentId) {
      const parsedDeptId = parseInt(departmentId, 10);
      if (!isNaN(parsedDeptId)) {
        whereClause.departmentId = parsedDeptId;
      }
    }

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
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
        departmentId: true,
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
        departmentId: true,
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