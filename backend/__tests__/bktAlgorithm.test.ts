import { updateMastery } from '../src/utils/bktAlgorithm';

describe('BKT Algorithm Tests', () => {
  const pLearn = 0.4;
  const pForget = 0.1;
  const pGuess = 0.2;
  const pSlip = 0.1;

  test('Correct answer increases mastery probability', () => {
    const pKnown = 0.3;
    const nextMastery = updateMastery(pKnown, pLearn, pForget, pGuess, pSlip, true);
    expect(nextMastery).toBeGreaterThan(pKnown);
  });

  test('Incorrect answer decreases mastery probability', () => {
    const pKnown = 0.7;
    const nextMastery = updateMastery(pKnown, pLearn, pForget, pGuess, pSlip, false);
    expect(nextMastery).toBeLessThan(pKnown);
  });

  test('Result is always bounded between 0 and 1', () => {
    // Edge case 1: Previous probability is 1.0 (fully mastered)
    const next1 = updateMastery(1.0, pLearn, pForget, pGuess, pSlip, true);
    expect(next1).toBeLessThanOrEqual(1.0);
    expect(next1).toBeGreaterThanOrEqual(0.0);

    // Edge case 2: Previous probability is 0.0 (completely unmastered)
    const next2 = updateMastery(0.0, pLearn, pForget, pGuess, pSlip, false);
    expect(next2).toBeLessThanOrEqual(1.0);
    expect(next2).toBeGreaterThanOrEqual(0.0);
  });

  test('Handles extreme probabilities correctly', () => {
    const pKnown = 0.5;
    // Guess is extremely high
    const next = updateMastery(pKnown, pLearn, pForget, 0.9, pSlip, true);
    expect(next).toBeGreaterThanOrEqual(0.0);
    expect(next).toBeLessThanOrEqual(1.0);
  });
});
