import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get all doctors (optionally filtered by departmentId)
 * GET /api/doctors?departmentId=ID
 */
export const getDoctors = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const whereClause = {};

    if (departmentId) {
      const parsedDeptId = parseInt(departmentId, 10);
      if (!isNaN(parsedDeptId)) {
        whereClause.departmentId = parsedDeptId;
      }
    }

    // Basic findMany without restrictive includes
    const doctors = await prisma.doctor.findMany({
      where: whereClause
    });

    return successResponse(res, 'Doctors retrieved successfully.', doctors);
  } catch (error) {
    console.error('CRITICAL: Error in getDoctors controller:', error);
    return errorResponse(
      res, 
      `Database query error: ${error.message || 'Failed to fetch doctors'}`, 
      500
    );
  }
};

/**
 * Get a single doctor by ID
 * GET /api/doctors/:id
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const doctorId = parseInt(req.params.id, 10);

    if (isNaN(doctorId)) {
      return errorResponse(res, 'Invalid doctor ID format.', 400);
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return errorResponse(res, 'Doctor not found.', 404);
    }

    return successResponse(res, 'Doctor retrieved successfully.', doctor);
  } catch (error) {
    console.error('CRITICAL: Error in getDoctorById controller:', error);
    return errorResponse(
      res, 
      `Database query error: ${error.message || 'Failed to fetch doctor'}`, 
      500
    );
  }
};