import React from 'react';
import NotesModule from './NotesModule';
import { BookOpen } from 'lucide-react';

export const NotesModuleDefinition = {
  id: 'notes',
  name: 'Notes',
  routes: ['notes'],
  navItem: {
    tab: 'notes',
    label: 'Notes',
    icon: BookOpen,
  },
  init(orchestrator) {
    if (orchestrator && orchestrator.eventMediator) {
      orchestrator.eventMediator.subscribe('NOTE_BOOKMARKED', (payload) => {
        console.log('[NotesModule] Note bookmarked:', payload);
      });
    }
  },
  render(props) {
    return <NotesModule {...props} />;
  },
};

export default NotesModuleDefinition;
