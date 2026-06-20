import { Server } from 'socket.io';
import prisma from '../prisma/client';
import { AlertType } from '../types/enums';

let ioInstance: Server | null = null;

/**
 * Initializes the Socket.IO server and registers connection handlers.
 */
export function initSocket(server: any): Server {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for testing
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to Socket.IO:', socket.id);

    // Join room event (e.g. 'join' with room: 'student:xxxx' or 'mentor:yyyy')
    socket.on('join', (data: { room: string }) => {
      if (data && data.room) {
        socket.join(data.room);
        console.log(`Socket ${socket.id} joined room: ${data.room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from Socket.IO:', socket.id);
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Emits a Red Flag alert to the student and their assigned mentors.
 * Saves the alert to the database.
 */
export async function emitRedFlag(studentId: string, riskScore: number): Promise<void> {
  const message = `Cảnh báo: Điểm rủi ro học tập hiện tại của bạn đã vượt quá giới hạn an toàn (${riskScore}%). Vui lòng hoàn thành công việc hoặc trao đổi với Mentor.`;
  
  try {
    // 1. Create Alert record in DB
    const alert = await prisma.alert.create({
      data: {
        studentId,
        type: AlertType.RED_FLAG,
        message
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    });

    const studentName = alert.student.user.fullName;

    console.log(`[SOCKET SERVICE] Broadcasting RED_FLAG for ${studentName} (${riskScore}%)`);

    if (!ioInstance) {
      console.warn('[SOCKET SERVICE] Socket.IO instance is not initialized. Skipping real-time broadcast.');
      return;
    }

    // 2. Emit 'notification' to the student's room
    ioInstance.to(`student:${studentId}`).emit('notification', {
      type: AlertType.RED_FLAG,
      message: message,
      alertId: alert.id,
      timestamp: alert.timestamp
    });

    // 3. Find all mentors assigned to this student
    const assignments = await prisma.mentorStudent.findMany({
      where: { studentId },
      include: { mentor: { include: { user: true } } }
    });

    // 4. Emit 'red-flag-alert' to each mentor's room
    assignments.forEach((assign) => {
      if (ioInstance) {
        ioInstance.to(`mentor:${assign.mentorId}`).emit('red-flag-alert', {
          studentId,
          studentName,
          riskScore,
          message: `⚠️ [Cảnh báo đỏ] Sinh viên ${studentName} có nguy cơ học tập cao (${riskScore}%)`,
          timestamp: alert.timestamp.toISOString()
        });
      }
    });
    
    // Also emit to global admin room
    ioInstance.to('admin').emit('red-flag-alert', {
      studentId,
      studentName,
      riskScore,
      message: `⚠️ [Admin Alert] Sinh viên ${studentName} có nguy cơ học tập cao (${riskScore}%)`,
      timestamp: alert.timestamp.toISOString()
    });

  } catch (error) {
    console.error('[SOCKET SERVICE] Error processing red flag alert:', error);
  }
}
