import prisma from '../prisma/client';
import { calculateRiskScore } from '../utils/logisticRegression';

/**
 * Recalculates the student failure risk score based on task, quiz, and study time metrics.
 * Updates the Student.currentRiskScore and creates a RiskHistory snapshot.
 *
 * @param studentId The unique ID of the student
 * @returns The updated risk score (0 to 100)
 */
export async function recalculate(studentId: string): Promise<number> {
  // 1. Calculate taskCompletionRate
  const tasks = await prisma.task.findMany({
    where: { studentId }
  });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0.0;

  // 2. Calculate avgQuizScore (based on the last 30 attempts)
  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: 30
  });
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(a => a.isCorrect).length;
  const avgQuizScore = totalAttempts > 0 ? correctAttempts / totalAttempts : 0.0;

  // 3. Calculate timeSpentNormalized (weekly target of 40h = 2400 minutes)
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });
  
  if (!student) {
    throw new Error('Student not found');
  }

  const weeklyTargetMin = 2400; // 40 hours
  const timeSpentNormalized = Math.min(student.totalFocusTime / weeklyTargetMin, 1.0);

  // 4. Calculate Risk Score using the Logistic Regression coefficients
  const riskScore = calculateRiskScore(taskCompletionRate, avgQuizScore, timeSpentNormalized);

  // 5. Update Student's current risk score
  await prisma.student.update({
    where: { id: studentId },
    data: { currentRiskScore: riskScore }
  });

  // 6. Create a RiskHistory record
  await prisma.riskHistory.create({
    data: {
      studentId,
      riskScore,
      taskCompletionRate,
      avgQuizScore,
      totalTimeSpent: student.totalFocusTime
    }
  });

  }, Quiz average: ${avgQuizScore.toFixed(2)}, Study time normalized: ${timeSpentNormalized.toFixed(2)})`);

  return riskScore;
}
