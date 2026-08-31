import React, { useState, useEffect } from 'react';
import VideoPlayer from '../../components/VideoPlayer';
import VideoLibrary from '../../components/VideoLibrary';
import { useAppShell } from '../../core/AppShellContext';
import { navigateTo } from '../../utils/router';

export default function VideoModule({ 
  selectedSubject = 'All', 
  selectedTag = 'All', 
  searchQuery = '', 
  routeParams = {} 
}) {
  const { sessions, refreshSessions, eventMediator } = useAppShell();
  const [selectedSessionId, setSelectedSessionId] = useState(routeParams.id || null);

  // Sync selected session with route params or select first available video
  useEffect(() => {
    if (routeParams.id) {
      setSelectedSessionId(routeParams.id);
    } else if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [routeParams.id, sessions, selectedSessionId]);

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    navigateTo('lessons', { id: sessionId, subject: selectedSubject, tag: selectedTag });

    if (eventMediator) {
      eventMediator.publish('LESSON_SELECTED', { sessionId });
    }
  };

  const handleLessonCompleted = (session) => {
    if (eventMediator) {
      eventMediator.publish('LESSON_COMPLETED', { session });
    }
  };

  return (
    <div className="space-y-6">
      {activeSession ? (
        <div className="space-y-4">
          <VideoPlayer 
            session={activeSession} 
            onCompleted={() => handleLessonCompleted(activeSession)}
          />
        </div>
      ) : null}

      <div className="pt-4 border-t border-[var(--border-color)]">
        <h3 className="text-sm font-bold font-heading mb-4 text-[var(--text-primary)]">
          Available Video Lessons ({sessions.length})
        </h3>
        <VideoLibrary 
          sessions={sessions}
          onRefreshSessions={refreshSessions}
          onSelectSession={handleSelectSession}
        />
      </div>
    </div>
  );
}
