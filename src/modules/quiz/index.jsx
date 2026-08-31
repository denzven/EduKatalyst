import React from 'react';
import QuizModule from './QuizModule';
import { CheckSquare } from 'lucide-react';

export const QuizModuleDefinition = {
  id: 'quiz',
  name: 'Quizzes',
  routes: ['quizzes'],
  navItem: {
    tab: 'quizzes',
    label: 'Quizzes',
    icon: CheckSquare,
  },
  init(orchestrator) {
    if (orchestrator && orchestrator.eventMediator) {
      orchestrator.eventMediator.subscribe('LESSON_COMPLETED', (payload) => {
        console.log('[QuizModule] Lesson completed event received:', payload);
      });
    }
  },
  render(props) {
    return <QuizModule {...props} />;
  },
};

export default QuizModuleDefinition;
