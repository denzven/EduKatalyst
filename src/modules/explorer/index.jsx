import React from 'react';
import ExplorerModule from './ExplorerModule';
import { ListTree } from 'lucide-react';

export const ExplorerModuleDefinition = {
  id: 'explorer',
  name: 'Explorer',
  routes: ['explorer', 'landing'],
  navItem: {
    tab: 'explorer',
    label: 'Explorer',
    icon: ListTree,
  },
  init(orchestrator) {
    if (orchestrator && orchestrator.eventMediator) {
      orchestrator.eventMediator.subscribe('TAXONOMY_FILTERED', (payload) => {
        console.log('[ExplorerModule] Taxonomy filter changed:', payload);
      });
    }
  },
  render(props) {
    return <ExplorerModule {...props} />;
  },
};

export default ExplorerModuleDefinition;
