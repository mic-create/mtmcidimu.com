import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get all active departments
 * GET /api/departments
 */
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    return successResponse(res, 'Departments retrieved successfully.', departments);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single active department by ID
 * GET /api/departments/:id
 */
export const getDepartmentById = async (req, res, next) => {
  try {
    const departmentId = parseInt(req.params.id, 10);

    if (isNaN(departmentId)) {
      return errorResponse(res, 'Invalid department ID format.', 400);
    }

    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true
      }
    });

    if (!department) {
      return errorResponse(res, 'Department not found.', 404);
    }

    return successResponse(res, 'Department retrieved successfully.', department);
  } catch (error) {
    next(error);
  }
};

/**
 * Get active doctors for a specific department
 * GET /api/departments/:departmentId/doctors
 */
export const getDoctorsByDepartment = async (req, res, next) => {
  try {
    const departmentId = parseInt(req.params.departmentId, 10);

    if (isNaN(departmentId)) {
      return errorResponse(res, 'Invalid department ID format.', 400);
    }

    // Verify department exists and is active
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isActive: true
      }
    });

    if (!department) {
      return errorResponse(res, 'Department not found.', 404);
    }

    // Fetch active doctors in this department
    const doctors = await prisma.doctor.findMany({
      where: {
        departmentId: departmentId,
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
      },
      orderBy: { name: 'asc' }
    });

    if (doctors.length === 0) {
      return successResponse(res, 'No doctors are currently available in this department.', []);
    }

    return successResponse(res, 'Doctors retrieved successfully.', doctors);
  } catch (error) {
    next(error);
  }
};