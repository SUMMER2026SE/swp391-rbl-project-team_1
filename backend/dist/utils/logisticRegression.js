"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sigmoid = sigmoid;
exports.calculateRiskScore = calculateRiskScore;
const WEIGHTS = {
    taskCompletionRate: -3.2,
    avgQuizScore: -2.8,
    timeSpent: -1.5,
    bias: 2.1
};
/**
 * Standard Sigmoid activation function.
 * Maps any real value to the range [0.0, 1.0].
 */
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}
/**
 * Calculates academic failure risk score (0 to 100).
 * High scores (> 70) indicate critical risk ("RED FLAG").
 *
 * @param taskCompletionRate Completed tasks / total tasks (0.0 to 1.0)
 * @param avgQuizScore Correct answers / total attempts (0.0 to 1.0)
 * @param timeSpentNormalized Total focus minutes normalized to weekly target (0.0 to 1.0)
 * @returns Risk score as an integer percentage (0 to 100)
 */
function calculateRiskScore(taskCompletionRate, avgQuizScore, timeSpentNormalized) {
    // Bound input rates to [0, 1]
    const taskRate = Math.min(Math.max(taskCompletionRate, 0), 1);
    const quizScore = Math.min(Math.max(avgQuizScore, 0), 1);
    const timeSpent = Math.min(Math.max(timeSpentNormalized, 0), 1);
    // Compute z: intercept + w1*x1 + w2*x2 + w3*x3
    const z = WEIGHTS.bias
        + WEIGHTS.taskCompletionRate * taskRate
        + WEIGHTS.avgQuizScore * quizScore
        + WEIGHTS.timeSpent * timeSpent;
    // Compute sigmoid(z) and map to 0-100% scale
    return Math.round(sigmoid(z) * 100);
}
