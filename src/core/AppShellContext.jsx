import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventMediator } from './EventMediator';
import { moduleRegistry } from './ModuleRegistry';
import { parseHash, navigateTo, subscribeToHash } from '../utils/router';
import { getAllVideoSessions, initStorageQuota, enforceVideoCacheLimit, subscribeToStorageChannel } from '../utils/storage';
import { isCreatorAuthenticated } from '../utils/auth';
import { initTheme, setStoredPreset } from '../utils/theme';
import { initPWA } from '../utils/pwaHelper';

import backupService from '../services/BackupService';
import contentService from '../services/contentService';

const AppShellContext = createContext(null);

export function AppShellProvider({ children }) {
  const [currentPreset, setCurrentPresetState] = useState(() => initTheme());
  const [sessions, setSessions] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [isCreatorAuth, setIsCreatorAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [routeState, setRouteState] = useState(() => parseHash());

  const refreshSessions = useCallback(async () => {
    try {
      let list = await getAllVideoSessions();
      if ((!list || list.length === 0) && typeof window !== 'undefined') {
        list = await backupService.autoRestoreLatestBackup();
      }
      setSessions(list || []);

      // Load course catalog manifest using cache-first contentService
      const manifestData = await contentService.getManifest();
      setManifest(manifestData);
    } catch (err) {
      console.error('[AppShellContext] Error fetching sessions/manifest:', err);
    }
  }, []);

  const setCurrentPreset = useCallback((presetId) => {
    setCurrentPresetState(presetId);
    setStoredPreset(presetId);
  }, []);

  const handleNavigate = useCallback((tab, params = {}) => {
    window.scrollTo(0, 0);
    navigateTo(tab, params);
  }, []);

  useEffect(() => {
    initTheme();
    initPWA();
    initStorageQuota();
    enforceVideoCacheLimit();
    refreshSessions();

    setIsCreatorAuth(isCreatorAuthenticated());

    // Initialize all registered modules with orchestrator API
    moduleRegistry.initAll({
      eventMediator,
      navigateTo: handleNavigate,
      refreshSessions,
    });

    const unsubscribeHash = subscribeToHash((newRoute) => {
      setRouteState(newRoute);
      window.scrollTo(0, 0);
    });

    const unsubscribeStorage = subscribeToStorageChannel(() => {
      console.info('[AppShellContext] Cross-tab storage update triggered refresh');
      refreshSessions();
    });

    return () => {
      unsubscribeHash();
      unsubscribeStorage();
    };
  }, [refreshSessions, handleNavigate]);

  const value = {
    eventMediator,
    moduleRegistry,
    activeTab: routeState.tab,
    routeParams: routeState.params,
    navigateToTab: handleNavigate,
    sessions,
    manifest,
    refreshSessions,
    isCreatorAuth,
    setIsCreatorAuth,
    currentPreset,
    setCurrentPreset,
    isLoading,
    setIsLoading,
    publishEvent: (eventName, payload) => eventMediator.publish(eventName, payload),
    subscribeEvent: (eventName, callback) => eventMediator.subscribe(eventName, callback),
  };

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within an AppShellProvider');
  }
  return context;
}
