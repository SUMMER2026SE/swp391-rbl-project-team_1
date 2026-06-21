import prisma from '../prisma/client';
import { ActivityActionType } from '@prisma/client';

/**
 * Helper to get Vietnam timezone date string 'YYYY-MM-DD'
 */
export function getVietnamDateString(date: Date): string {
  const dateInVietnam = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return dateInVietnam.toISOString().split('T')[0];
}

/**
 * Log an activity. Checks for duplicate TASK_COMPLETED within the same day to avoid spamming.
 */
export async function logActivity(
  studentId: string,
  actionType: ActivityActionType,
  referenceId: string,
  description?: string,
  createdAt: Date = new Date()
) {
  try {
    const activityDate = getVietnamDateString(createdAt);

    // Dùng upsert với unique constraint [studentId, actionType, referenceId, activityDate]
    // Đảm bảo tuyệt đối không có race condition khi gửi request đồng thời
    await prisma.activityLog.upsert({
      where: {
        studentId_actionType_referenceId_activityDate: {
          studentId,
          actionType,
          referenceId,
          activityDate
        }
      },
      update: {}, // Nếu trùng thì không làm gì cả
      create: {
        studentId,
        actionType,
        referenceId,
        activityDate,
        description,
        createdAt
      }
    });
  } catch (error) {
    console.error(`[ActivityService] Failed to log activity ${actionType}:`, error);
  }
}
