import { describe, it, expect, beforeEach } from 'vitest';
import { saveQuizAttempt, getQuizAttemptHistory, getLatestQuizAttempt } from '../quizStorage';

describe('quizStorage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and retrieve quiz attempt history', () => {
    saveQuizAttempt('quantum-quiz', 4, 5, { 0: 1, 1: 0 });
    const history = getQuizAttemptHistory();

    expect(history['quantum-quiz']).toBeDefined();
    expect(history['quantum-quiz'].length).toBe(1);
    expect(history['quantum-quiz'][0].score).toBe(4);
    expect(history['quantum-quiz'][0].percentage).toBe(80);
  });

  it('should return latest attempt for a quiz ID', () => {
    saveQuizAttempt('dsa-quiz', 3, 5);
    saveQuizAttempt('dsa-quiz', 5, 5);

    const latest = getLatestQuizAttempt('dsa-quiz');
    expect(latest).toBeDefined();
    expect(latest.score).toBe(5);
    expect(latest.percentage).toBe(100);
  });
});
