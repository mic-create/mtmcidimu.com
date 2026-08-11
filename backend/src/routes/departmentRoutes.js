import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  getDoctorsByDepartment
} from '../controllers/departmentController.js';

const router = Router();

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.get('/:departmentId/doctors', getDoctorsByDepartment);

export default router;