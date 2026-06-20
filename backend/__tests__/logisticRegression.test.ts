import { calculateRiskScore, sigmoid } from '../src/utils/logisticRegression';

describe('Logistic Regression Risk Predictor Tests', () => {
  test('Sigmoid function behaves correctly', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 4);
    expect(sigmoid(10)).toBeCloseTo(1.0, 4);
    expect(sigmoid(-10)).toBeCloseTo(0.0, 4);
  });

  test('Excellent student metrics yield low failure risk', () => {
    // 100% tasks completed, 100% quiz score, 100% study hours
    const risk = calculateRiskScore(1.0, 1.0, 1.0);
    // z = 2.1 - 3.2(1) - 2.8(1) - 1.5(1) = 2.1 - 7.5 = -5.4
    // sigmoid(-5.4) = 1 / (1 + exp(5.4)) ≈ 0.0045 ≈ 0%
    expect(risk).toBeLessThan(30);
  });

  test('Poor student metrics yield high failure risk', () => {
    // 0% tasks, 0% quiz score, 0% study hours
    const risk = calculateRiskScore(0.0, 0.0, 0.0);
    // z = 2.1 - 0 - 0 - 0 = 2.1
    // sigmoid(2.1) = 1 / (1 + exp(-2.1)) ≈ 0.89 ≈ 89%
    expect(risk).toBeGreaterThan(70);
  });

  test('Risk score is always bounded between 0 and 100', () => {
    expect(calculateRiskScore(1.0, 1.0, 1.0)).toBeGreaterThanOrEqual(0);
    expect(calculateRiskScore(1.0, 1.0, 1.0)).toBeLessThanOrEqual(100);

    expect(calculateRiskScore(0.0, 0.0, 0.0)).toBeGreaterThanOrEqual(0);
    expect(calculateRiskScore(0.0, 0.0, 0.0)).toBeLessThanOrEqual(100);
  });

  test('Increasing task completion rate decreases risk score', () => {
    const riskMedium = calculateRiskScore(0.3, 0.5, 0.5);
    const riskHighCompletion = calculateRiskScore(0.8, 0.5, 0.5);
    
    expect(riskHighCompletion).toBeLessThan(riskMedium);
  });
});
