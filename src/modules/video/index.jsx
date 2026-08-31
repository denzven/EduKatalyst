import React from 'react';
import VideoModule from './VideoModule';
import { Play } from 'lucide-react';

export const VideoModuleDefinition = {
  id: 'video',
  name: 'Lessons',
  routes: ['lessons', 'video'],
  navItem: {
    tab: 'lessons',
    label: 'Lessons',
    icon: Play,
  },
  init(orchestrator) {
    if (orchestrator && orchestrator.eventMediator) {
      orchestrator.eventMediator.subscribe('LESSON_SELECTED', (payload) => {
        console.log('[VideoModule] Lesson selected:', payload);
      });
    }
  },
  render(props) {
    return <VideoModule {...props} />;
  },
};

export default VideoModuleDefinition;
