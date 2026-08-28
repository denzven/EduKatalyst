import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StudentPortal from './components/StudentPortal';
import LandingPage from './components/LandingPage';
import Preloader from './components/Preloader';
import DevStudioModal from './components/DevStudioModal';
import SettingsModal from './components/SettingsModal';
import MobileBottomNav from './components/MobileBottomNav';
import { getAllVideoSessions } from './utils/storage';
import { isCreatorAuthenticated } from './utils/auth';
import { parseHash, navigateTo, subscribeToHash } from './utils/router';
import { initPWA } from './utils/pwaHelper';
import { initTheme } from './utils/theme';

export default function App() {
  const [currentPreset, setCurrentPreset] = useState(() => initTheme());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isCreatorAuth, setIsCreatorAuth] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Router State
  const [routeState, setRouteState] = useState(() => parseHash());

  const activePortalTab = routeState.tab === 'studio' || routeState.tab === 'landing' 
    ? 'explorer' 
    : routeState.tab;

  const isLandingPage = routeState.tab === 'landing';

  const refreshSessions = async () => {
    try {
      const list = await getAllVideoSessions();
      setSessions(list || []);
    } catch (err) {
      console.error('Error fetching video sessions:', err);
    }
  };

  useEffect(() => {
    initTheme();
    initPWA();
    refreshSessions();
    setIsCreatorAuth(isCreatorAuthenticated());

    // Subscribe to browser URL hash changes
    const unsubscribe = subscribeToHash((newRoute) => {
      setRouteState(newRoute);
      window.scrollTo(0, 0);
      if (newRoute.tab === 'studio') {
        setIsDevModalOpen(true);
      }
    });

    if (routeState.tab === 'studio') {
      setIsDevModalOpen(true);
    }

    return unsubscribe;
  }, []);

  const handleTabChange = (tab, params = {}) => {
    window.scrollTo(0, 0);
    navigateTo(tab, params);
  };

  const handleOpenStudio = () => {
    setIsDevModalOpen(true);
    navigateTo('studio');
  };

  const handleCloseStudio = () => {
    setIsDevModalOpen(false);
    navigateTo(isLandingPage ? 'landing' : activePortalTab);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-ground)] text-[var(--text-primary)] flex flex-col font-sans relative transition-colors duration-300">
      
      {/* Initial App Boot Preloader */}
      {isLoading && (
        <Preloader onComplete={() => setIsLoading(false)} />
      )}

      {/* Header Navigation Bar */}
      <Header
        onOpenDevStudio={handleOpenStudio}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View: Landing Page OR Content Portal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLandingPage ? (
          <LandingPage
            onProceed={() => handleTabChange('explorer')}
            onOpenStudio={handleOpenStudio}
          />
        ) : (
          <StudentPortal
            sessions={sessions}
            onOpenDevStudio={handleOpenStudio}
            activePortalTab={activePortalTab}
            setActivePortalTab={handleTabChange}
            routeParams={routeState.params}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on landing page) */}
      {!isLandingPage && (
        <MobileBottomNav
          activePortalTab={activePortalTab}
          setActivePortalTab={handleTabChange}
          onOpenDevStudio={handleOpenStudio}
        />
      )}

      {/* Creator Studio Password Protected Modal */}
      <DevStudioModal
        isOpen={isDevModalOpen}
        onClose={handleCloseStudio}
        isCreatorAuth={isCreatorAuth}
        setIsCreatorAuth={setIsCreatorAuth}
        sessions={sessions}
        onRefreshSessions={refreshSessions}
        onSelectSessionForPlayer={(id) => {
          handleTabChange('lessons');
        }}
      />

      {/* Platform Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentPreset={currentPreset}
        onSelectPreset={(presetId) => {
          setCurrentPreset(presetId);
        }}
        videoCount={sessions.length}
      />

      {/* Footer */}
      <footer className="hidden md:block border-t border-[var(--border-color)] bg-[var(--bg-ground)] py-5 text-center text-xs text-[var(--text-muted)] font-mono transition-colors duration-300">
        <div className="flex items-center justify-center space-x-4">
          <span className="font-serif text-[var(--text-primary)] font-bold">EduKatalyst by DZVN</span>
          <span>•</span>
          <span>Katalyze the Change</span>
          <span>•</span>
          <span>By students. For students.</span>
        </div>
      </footer>

    </div>
  );
}
