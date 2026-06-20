"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMastery = updateMastery;
/**
 * Bayesian Knowledge Tracing (BKT) update algorithm.
 * Updates the probability that a student knows/mastered a skill based on their response.
 *
 * @param pKnown Previous probability of mastering the skill (0.0 to 1.0)
 * @param pLearn Probability of transition from unmastered to mastered state after an opportunity (default: 0.4)
 * @param pForget Probability of forgetting a mastered skill (default: 0.1)
 * @param pGuess Probability of guessing correctly when not knowing the skill (default: 0.2)
 * @param pSlip Probability of making a mistake when knowing the skill (default: 0.1)
 * @param wasCorrect Whether the student's answer was correct
 * @returns Updated probability of mastering the skill (0.0 to 1.0)
 */
function updateMastery(pKnown, pLearn, pForget, pGuess, pSlip, wasCorrect) {
    // Bound input probability to [0, 1]
    const pK = Math.min(Math.max(pKnown, 0), 1);
    // Step 1: Bayes Update (Conditioning on response)
    const pCorrectIfKnown = 1 - pSlip;
    const pCorrectIfNotKnown = pGuess;
    // Total probability of answering correctly: P(Correct) = P(Known)*P(Correct|Known) + P(~Known)*P(Correct|~Known)
    const pCorrect = pK * pCorrectIfKnown + (1 - pK) * pCorrectIfNotKnown;
    let pKnownGivenResponse;
    if (wasCorrect) {
        pKnownGivenResponse = pCorrect > 0 ? (pK * pCorrectIfKnown) / pCorrect : 1.0;
    }
    else {
        pKnownGivenResponse = (1 - pCorrect) > 0 ? (pK * pSlip) / (1 - pCorrect) : 0.0;
    }
    // Step 2: Learning/Transition Update
    // P(Known_next) = P(Known_updated)*(1 - P(Forget)) + P(~Known_updated)*P(Learn)
    const pKnownNext = pKnownGivenResponse * (1 - pForget) + (1 - pKnownGivenResponse) * pLearn;
    // Bound output to [0, 1]
    return Math.min(Math.max(pKnownNext, 0), 1);
}
