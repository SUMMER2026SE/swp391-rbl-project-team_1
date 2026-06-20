import { calculatePriority, sortByPriority } from '../src/utils/priorityScheduler';

describe('Priority Scheduler Tests', () => {
  const now = new Date('2026-06-11T12:00:00Z');

  test('Tasks with closer deadlines get higher priority', () => {
    const taskUrgent = {
      id: '1',
      deadline: new Date('2026-06-11T18:00:00Z'), // Due in 6 hours
      masteryLevel: 0.5,
      difficulty: 2
    };
    const taskLater = {
      id: '2',
      deadline: new Date('2026-06-15T12:00:00Z'), // Due in 4 days
      masteryLevel: 0.5,
      difficulty: 2
    };

    const pUrgent = calculatePriority(taskUrgent, now);
    const pLater = calculatePriority(taskLater, now);
    expect(pUrgent).toBeGreaterThan(pLater);
  });

  test('Tasks with lower mastery level get higher priority if deadlines are same', () => {
    const deadline = new Date('2026-06-12T12:00:00Z');
    const taskWeak = {
      id: '1',
      deadline,
      masteryLevel: 0.2, // Weak skill mastery
      difficulty: 2
    };
    const taskStrong = {
      id: '2',
      deadline,
      masteryLevel: 0.8, // Strong skill mastery
      difficulty: 2
    };

    const pWeak = calculatePriority(taskWeak, now);
    const pStrong = calculatePriority(taskStrong, now);
    expect(pWeak).toBeGreaterThan(pStrong);
  });

  test('EXPERT tasks get higher priority than EASY tasks if deadlines and mastery are same', () => {
    const deadline = new Date('2026-06-12T12:00:00Z');
    const taskExpert = {
      id: '1',
      deadline,
      masteryLevel: 0.5,
      difficulty: 4 // EXPERT
    };
    const taskEasy = {
      id: '2',
      deadline,
      masteryLevel: 0.5,
      difficulty: 1 // EASY
    };

    const pExpert = calculatePriority(taskExpert, now);
    const pEasy = calculatePriority(taskEasy, now);
    expect(pExpert).toBeGreaterThan(pEasy);
  });

  test('Default urgency is applied when task has no deadline', () => {
    const taskNoDeadline = {
      id: '1',
      deadline: null,
      masteryLevel: 0.5,
      difficulty: 2
    };
    const priority = calculatePriority(taskNoDeadline, now);
    // urgency (0.1) * 0.5 + masteryGap (0.5) * 0.3 + diffScore (2/4) * 0.2 = 0.05 + 0.15 + 0.1 = 0.3
    expect(priority).toBe(0.3);
  });

  test('sortByPriority returns a new sorted array and does not mutate input', () => {
    const t1 = { id: '1', deadline: new Date('2026-06-15T12:00:00Z'), masteryLevel: 0.8, difficulty: 1 };
    const t2 = { id: '2', deadline: new Date('2026-06-11T13:00:00Z'), masteryLevel: 0.2, difficulty: 4 }; // Highly urgent
    
    const tasks = [t1, t2];
    const sorted = sortByPriority(tasks, now);

    expect(sorted[0].id).toBe('2'); // t2 should be sorted first
    expect(sorted[1].id).toBe('1');
    expect(tasks[0].id).toBe('1');  // Original array remains intact
  });
});
