import React, { useState, useMemo } from 'react';
import { CheckSquare, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { loadMarkdownQuizzes } from '../../utils/markdownParser';
import { useAppShell } from '../../core/AppShellContext';
import { saveQuizAttempt, getQuizAttemptHistory } from '../../utils/quizStorage';

export default function QuizModule({ selectedSubject = 'All', selectedTag = 'All', searchQuery = '' }) {
  const { eventMediator } = useAppShell();
  const [quizAnswers, setQuizAnswers] = useState(() => {
    const history = getQuizAttemptHistory();
    const initial = {};
    Object.keys(history).forEach((qId) => {
      const attempts = history[qId];
      if (attempts && attempts.length > 0 && attempts[0].userAnswers) {
        Object.assign(initial, attempts[0].userAnswers);
      }
    });
    return initial;
  });

  const markdownQuizzes = useMemo(() => loadMarkdownQuizzes(), []);
  const attemptHistory = useMemo(() => getQuizAttemptHistory(), [quizAnswers]);

  // Filter quizzes by subject, tag, and search query
  const filteredQuizzes = useMemo(() => {
    return markdownQuizzes.filter((qItem) => {
      const matchesSubject = selectedSubject === 'All' || qItem.subject === selectedSubject;
      const matchesTag = selectedTag === 'All' || (qItem.tags || []).includes(selectedTag);

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSubject && matchesTag;

      return matchesSubject && matchesTag && (
        qItem.question.toLowerCase().includes(q) ||
        (qItem.subject || '').toLowerCase().includes(q) ||
        (qItem.explanation || '').toLowerCase().includes(q)
      );
    });
  }, [markdownQuizzes, selectedSubject, selectedTag, searchQuery]);

  // Quiz Score Metrics
  const quizScoreMetrics = useMemo(() => {
    let answeredCount = 0;
    let correctCount = 0;

    markdownQuizzes.forEach((q) => {
      const userAns = quizAnswers[q.id];
      if (userAns !== undefined) {
        answeredCount += 1;
        if (userAns === q.correctIndex) {
          correctCount += 1;
        }
      }
    });

    return { answeredCount, correctCount, total: markdownQuizzes.length };
  }, [markdownQuizzes, quizAnswers]);

  const handleQuizSelect = (quizId, optionIndex, correctIndex) => {
    const isCorrect = optionIndex === correctIndex;
    const updatedAnswers = { ...quizAnswers, [quizId]: optionIndex };
    setQuizAnswers(updatedAnswers);

    // Save score attempt locally
    saveQuizAttempt(quizId, isCorrect ? 1 : 0, 1, updatedAnswers);

    if (isCorrect) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    }

    // Publish decoupled event through EventMediator
    if (eventMediator) {
      eventMediator.publish('QUIZ_ANSWERED', {
        quizId,
        optionIndex,
        isCorrect,
        scoreMetrics: quizScoreMetrics
      });
    }
  };


  const handleResetQuiz = () => {
    setQuizAnswers({});
    if (eventMediator) {
      eventMediator.publish('QUIZ_RESET', {});
    }
  };

  return (
    <div className="space-y-4">
      {/* Quiz Progress & Score Header */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
        <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-[var(--accent-coral)]" />
          Assessment Progress ({quizScoreMetrics.answeredCount} / {filteredQuizzes.length} Answered)
        </span>

        <div className="flex items-center space-x-2">
          <div className="text-xs font-mono text-[var(--accent-peach)] bg-[var(--bg-ground)] px-2.5 py-1 rounded-xl border border-[var(--border-color)] font-bold">
            Score: {quizScoreMetrics.correctCount} / {quizScoreMetrics.total}
          </div>

          <button
            onClick={handleResetQuiz}
            className="p-1.5 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            title="Reset Score"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="space-y-4">
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
            No quizzes found for the selected filter.
          </div>
        ) : (
          filteredQuizzes.map((quiz, qIdx) => {
            const selectedOpt = quizAnswers[quiz.id];
            const isAnswered = selectedOpt !== undefined;
            const isCorrect = selectedOpt === quiz.correctIndex;

            return (
              <div
                key={quiz.id}
                className="katalyst-card p-5 rounded-2xl border border-[var(--border-color)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
                    Q{qIdx + 1} • {quiz.subject}
                  </span>
                </div>

                <h4 className="text-xs font-bold font-heading text-[var(--text-primary)] leading-relaxed">
                  {quiz.question}
                </h4>

                <div className="space-y-1.5">
                  {quiz.options.map((opt, oIdx) => {
                    const isThisSelected = selectedOpt === oIdx;
                    let btnStyle = 'bg-[var(--bg-ground)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-coral)]';

                    if (isAnswered) {
                      if (oIdx === quiz.correctIndex) {
                        btnStyle = 'bg-emerald-950/40 dark:bg-emerald-950/60 border-emerald-500/50 text-emerald-700 dark:text-emerald-200 font-bold';
                      } else if (isThisSelected && !isCorrect) {
                        btnStyle = 'bg-rose-950/40 dark:bg-rose-950/60 border-rose-500/50 text-rose-700 dark:text-rose-300 font-bold';
                      }
                    }

                    return (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={oIdx}
                        onClick={() => handleQuizSelect(quiz.id, oIdx, quiz.correctIndex)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isAnswered && oIdx === quiz.correctIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl border text-xs ${
                      isCorrect 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' 
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    <span className="font-bold block mb-0.5 font-heading">Explanation:</span>
                    <p className="leading-relaxed">{quiz.explanation}</p>
                  </motion.div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
