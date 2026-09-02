/**
 * Quiz Score & Attempt Persistence Utility
 * Saves student quiz score attempts, timestamp, and selected answers to browser storage.
 */

const QUIZ_ATTEMPTS_STORAGE_KEY = 'katalyst_quiz_attempts';

/**
 * Save quiz attempt result locally
 */
export function saveQuizAttempt(quizId, score, totalQuestions, userAnswers = {}) {
  if (!quizId) return null;
  try {
    const history = getQuizAttemptHistory();
    const attemptRecord = {
      quizId,
      score,
      totalQuestions,
      percentage: Math.round((score / (totalQuestions || 1)) * 100),
      userAnswers,
      completedAt: new Date().toISOString()
    };

    history[quizId] = history[quizId] || [];
    history[quizId].unshift(attemptRecord);
    // Keep max 10 attempts per quiz
    history[quizId] = history[quizId].slice(0, 10);

    localStorage.setItem(QUIZ_ATTEMPTS_STORAGE_KEY, JSON.stringify(history));
    console.info(`[Quiz] Saved attempt for ${quizId}: ${score}/${totalQuestions} (${attemptRecord.percentage}%)`);
    return attemptRecord;
  } catch (error) {
    console.error('[Quiz] Failed to save quiz attempt:', error);
    return null;
  }
}

/**
 * Retrieve all quiz attempt history records
 */
export function getQuizAttemptHistory() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(QUIZ_ATTEMPTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('[Quiz] Error parsing quiz attempt history:', error);
    return {};
  }
}

/**
 * Get latest attempt for a specific quiz ID
 */
export function getLatestQuizAttempt(quizId) {
  const history = getQuizAttemptHistory();
  const attempts = history[quizId] || [];
  return attempts[0] || null;
}
