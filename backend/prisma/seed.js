import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Seed Execution ---');

  // 1. Seed Departments
  const departmentData = [
    {
      name: 'General Medicine',
      description: 'Primary healthcare and diagnostic consultations for common conditions.'
    },
    {
      name: 'Cardiology',
      description: 'Comprehensive cardiovascular assessment, diagnosis, and heart health management.'
    },
    {
      name: 'Pediatrics',
      description: 'Specialized healthcare and developmental tracking for infants, children, and adolescents.'
    },
    {
      name: 'Obstetrics & Gynaecology',
      description: 'Maternal health, prenatal care, childbirth, and women health services.'
    },
    {
      name: 'Surgery',
      description: 'General surgical evaluations and procedures with comprehensive pre/post-operative care.'
    }
  ];

  const departmentMap = {};

  for (const dept of departmentData) {
    const upsertedDept = await prisma.department.upsert({
      where: { name: dept.name },
      update: { description: dept.description },
      create: dept
    });
    departmentMap[dept.name] = upsertedDept.id;
    console.log(`[Department] ${upsertedDept.name} (ID: ${upsertedDept.id}) ready.`);
  }

  // 2. Seed Doctors
  const doctorsData = [
    {
      name: 'Dr. Michael Adeyemi',
      specialty: 'General Physician',
      departmentName: 'General Medicine',
      biography: 'Dr. Adeyemi brings over 12 years of clinical experience in family and internal medicine.',
      experience: '12 years',
      qualifications: 'MBBS, FWACP',
      availability: 'Mon-Fri: 8am-4pm'
    },
    {
      name: 'Dr. Sarah Okafor',
      specialty: 'Cardiologist',
      departmentName: 'Cardiology',
      biography: 'Specializes in clinical cardiology, preventive heart care, and non-invasive cardiovascular imaging.',
      experience: '10 years',
      qualifications: 'MBBS, FMCP (Cardiology)',
      availability: 'Mon-Thu: 9am-3pm'
    },
    {
      name: 'Dr. David Williams',
      specialty: 'Pediatrician',
      departmentName: 'Pediatrics',
      biography: 'Dedicated pediatric care provider focusing on child growth, developmental milestones, and immunization.',
      experience: '8 years',
      qualifications: 'MBBS, MWACP (Paediatrics)',
      availability: 'Mon-Fri: 9am-4pm'
    },
    {
      name: 'Dr. Grace Eze',
      specialty: 'Obstetrician & Gynaecologist',
      departmentName: 'Obstetrics & Gynaecology',
      biography: 'Expert in high-risk obstetric monitoring, prenatal guidance, and reproductive health wellness.',
      experience: '14 years',
      qualifications: 'MBBS, FWACS (OBGYN)',
      availability: 'Tue-Sat: 8am-2pm'
    },
    {
      name: 'Dr. Daniel Ibrahim',
      specialty: 'General Surgeon',
      departmentName: 'Surgery',
      biography: 'Experienced surgeon practicing minimally invasive procedures and emergency surgical care.',
      experience: '15 years',
      qualifications: 'MBBS, FWACS (Surgery)',
      availability: 'Mon-Fri: 10am-5pm'
    }
  ];

  for (const doc of doctorsData) {
    const deptId = departmentMap[doc.departmentName];

    // Check if doctor exists to ensure idempotency
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        name: doc.name,
        departmentId: deptId
      }
    });

    if (existingDoctor) {
      await prisma.doctor.update({
        where: { id: existingDoctor.id },
        data: {
          specialty: doc.specialty,
          biography: doc.biography,
          experience: doc.experience,
          qualifications: doc.qualifications,
          availability: doc.availability
        }
      });
      console.log(`[Doctor] ${doc.name} updated.`);
    } else {
      const newDoctor = await prisma.doctor.create({
        data: {
          name: doc.name,
          specialty: doc.specialty,
          departmentId: deptId,
          biography: doc.biography,
          experience: doc.experience,
          qualifications: doc.qualifications,
          availability: doc.availability
        }
      });
      console.log(`[Doctor] ${newDoctor.name} created (ID: ${newDoctor.id}).`);
    }
  }

  console.log('--- Seed Completed Successfully ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seeding Failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });