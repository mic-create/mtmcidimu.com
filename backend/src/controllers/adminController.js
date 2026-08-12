import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get Dashboard Overview Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [totalAppointments, pendingAppointments, totalPatients, totalDoctors] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.patient.count(),
      prisma.doctor.count({ where: { isActive: true } })
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalAppointments,
        pendingAppointments,
        totalPatients,
        totalDoctors
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get All Appointments
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        department: { select: { name: true } },
        doctor: { select: { name: true } },
        patient: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};