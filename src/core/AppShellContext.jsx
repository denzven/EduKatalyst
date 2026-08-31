import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventMediator } from './EventMediator';
import { moduleRegistry } from './ModuleRegistry';
import { parseHash, navigateTo, subscribeToHash } from '../utils/router';
import { getAllVideoSessions } from '../utils/storage';
import { isCreatorAuthenticated } from '../utils/auth';
import { initTheme, setStoredPreset } from '../utils/theme';
import { initPWA } from '../utils/pwaHelper';

const AppShellContext = createContext(null);

export function AppShellProvider({ children }) {
  const [currentPreset, setCurrentPresetState] = useState(() => initTheme());
  const [sessions, setSessions] = useState([]);
  const [isCreatorAuth, setIsCreatorAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [routeState, setRouteState] = useState(() => parseHash());

  const refreshSessions = useCallback(async () => {
    try {
      const list = await getAllVideoSessions();
      setSessions(list || []);
    } catch (err) {
      console.error('[AppShellContext] Error fetching video sessions:', err);
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

    return () => {
      unsubscribeHash();
    };
  }, [refreshSessions, handleNavigate]);

  const value = {
    eventMediator,
    moduleRegistry,
    activeTab: routeState.tab,
    routeParams: routeState.params,
    navigateToTab: handleNavigate,
    sessions,
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
