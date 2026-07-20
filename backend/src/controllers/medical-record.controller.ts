import { Request, Response } from 'express';
import { sendPrescriptionEmail } from '../utils/emailService';
import prisma from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// =====================================================================
// PATIENT-FACING: Get all my medical records
// GET /api/medical-records/my
// =====================================================================
export const getMyMedicalRecords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const records = await prisma.medicalRecord.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        appointment: {
          include: {
            doctor: {
              include: { specialty: true }
            }
          }
        },
        prescriptions: {
          include: { medicine: true }
        },
        LabOrder: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching my medical records:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// =====================================================================
// PATIENT-FACING: Get one medical record by appointmentId
// GET /api/medical-records/patient/appointment/:appointmentId
// =====================================================================
export const getMyRecordByAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { appointmentId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId as string },
      include: {
        user: true,
        doctor: {
          include: { specialty: true }
        }
      }
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    // Security: patient can only view their own records
    if (appointment.userId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { appointmentId: appointmentId as string },
      include: {
        prescriptions: {
          include: { medicine: true }
        },
        LabOrder: true,
      }
    });

    res.status(200).json({
      success: true,
      data: { appointment, record }
    });
  } catch (error: any) {
    console.error('Error fetching patient record:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};



export const getRecordByAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId as string },
      include: {
        user: true,
        doctor: true
      }
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { appointmentId: appointmentId as string },
      include: {
        LabOrder: true,
        prescriptions: {
          include: {
            medicine: true
          }
        }
      }
    });

    res.status(200).json({ 
      success: true, 
      data: {
        appointment,
        record
      }
    });
  } catch (error: any) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const saveRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { 
      height, weight, bloodPressure, heartRate, temperature, spo2, 
      symptoms, physicalExam, preliminaryDiagnosis, finalDiagnosis, 
      icd10Code, treatmentPlan, doctorNotes, followUpDate, severity, status,
      labOrders, prescriptions 
    } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId as string },
      include: { user: true }
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    // Upsert record
    const record = await prisma.medicalRecord.upsert({
      where: { appointmentId: appointmentId as string },
      update: {
        height, weight, bloodPressure, heartRate, temperature, spo2,
        symptoms, physicalExam, preliminaryDiagnosis, finalDiagnosis,
        icd10Code, treatmentPlan, doctorNotes, followUpDate, severity, status
      },
      create: {
        appointmentId: appointmentId as string,
        doctorId: appointment.doctorId!,
        userId: appointment.userId,
        height, weight, bloodPressure, heartRate, temperature, spo2,
        symptoms, physicalExam, preliminaryDiagnosis, finalDiagnosis,
        icd10Code, treatmentPlan, doctorNotes, followUpDate, severity, status
      }
    });

    // Handle lab orders
    if (labOrders && Array.isArray(labOrders)) {
      await prisma.labOrder.deleteMany({
        where: { medicalRecordId: record.id }
      });
      if (labOrders.length > 0) {
        await prisma.labOrder.createMany({
          data: labOrders.map((lo: any) => ({
            medicalRecordId: record.id,
            testName: lo.testName,
            testType: lo.testType,
            notes: lo.notes,
            status: lo.status || 'PENDING'
          }))
        });
      }
    }

    // Handle prescriptions
    if (prescriptions && Array.isArray(prescriptions)) {
      await prisma.prescription.deleteMany({
        where: { medicalRecordId: record.id }
      });
      if (prescriptions.length > 0) {
        await prisma.prescription.createMany({
          data: prescriptions.map((p: any) => ({
            medicalRecordId: record.id,
            medicineId: p.medicineId,
            dosage: p.dosage,
            frequency: p.frequency,
            durationDays: p.durationDays,
            instructions: p.instructions,
            quantity: p.quantity
          }))
        });
      }
    }

    // If status is COMPLETED, update appointment status
    if (status === 'COMPLETED') {
      await prisma.appointment.update({
        where: { id: appointmentId as string },
        data: { status: 'COMPLETED' }
      });
      
      // Send email
      if ((appointment as any).user && (appointment as any).user.email) {
        const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId! }});
        await sendPrescriptionEmail(
          (appointment as any).user.email,
          {
            patientName: (appointment.patientInfo as any)?.fullName || (appointment as any).user.fullName || (appointment as any).user.email,
            doctorName: doctor?.name || "Bác sĩ",
            appointmentDate: appointment.appointmentDate
          },
          req.body.pdfBase64 // Optional PDF from frontend
        );
      }
    }

    res.status(200).json({ success: true, message: 'Medical record saved successfully' });
  } catch (error: any) {
    console.error('Error saving medical record:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
