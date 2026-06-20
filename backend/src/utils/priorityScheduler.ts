interface SchedulerTask {
  id: string;
  deadline?: Date | null;
  masteryLevel: number; // 0.0 to 1.0 (SkillMastery.masteryLevel)
  difficulty: number;   // 1=EASY, 2=MEDIUM, 3=HARD, 4=EXPERT
}

/**
 * Calculates priority score for a task.
 * Formula: priority = urgency * 0.5 + (1 - masteryLevel) * 0.3 + (difficulty / 4) * 0.2
 *
 * @param task The task object
 * @param now Current date reference
 * @returns Priority score (higher value means higher priority)
 */
export function calculatePriority(task: SchedulerTask, now: Date): number {
  let urgency = 0.1; // Default urgency if no deadline is set
  if (task.deadline) {
    const diffMs = task.deadline.getTime() - now.getTime();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    
    if (diffMs < 0) {
      urgency = 1.0; // Overdue tasks get max urgency
    } else {
      // Normalized urgency: 1.0 if due immediately, scaling down to 0.1 if due in a week or more
      urgency = Math.max(0.1, 1 - (diffMs / oneWeekMs) * 0.9);
    }
  }

  const masteryGap = 1 - Math.min(Math.max(task.masteryLevel, 0), 1);
  const difficultyScore = Math.min(Math.max(task.difficulty, 1), 4) / 4;

  const priority = urgency * 0.5 + masteryGap * 0.3 + difficultyScore * 0.2;
  return parseFloat(priority.toFixed(4));
}

/**
 * Sorts tasks in descending order of their priority score.
 * Does not mutate the original array.
 *
 * @param tasks Array of tasks
 * @param now Current date reference (defaults to new Date())
 * @returns Sorted copy of the tasks array
 */
export function sortByPriority(tasks: SchedulerTask[], now = new Date()): SchedulerTask[] {
  return [...tasks].sort((a, b) => calculatePriority(b, now) - calculatePriority(a, now));
}
