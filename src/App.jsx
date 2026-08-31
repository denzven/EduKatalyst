import React, { useState } from 'react';
import Header from './components/Header';
import StudentPortal from './components/StudentPortal';
import LandingPage from './components/LandingPage';
import Preloader from './components/Preloader';
import DevStudioModal from './components/DevStudioModal';
import SettingsModal from './components/SettingsModal';
import MobileBottomNav from './components/MobileBottomNav';
import LegalPage from './components/LegalPage';
import { AppShellProvider, useAppShell } from './core/AppShellContext';

function AppContent() {
  const { 
    activeTab, 
    routeParams, 
    navigateToTab, 
    sessions, 
    refreshSessions, 
    isCreatorAuth, 
    setIsCreatorAuth, 
    currentPreset, 
    setCurrentPreset,
    isLoading,
    setIsLoading 
  } = useAppShell();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activePortalTab = activeTab === 'studio' || activeTab === 'landing' || activeTab === 'privacy' || activeTab === 'terms'
    ? 'explorer' 
    : activeTab;

  const isLandingPage = activeTab === 'landing';
  const isStudioPage = activeTab === 'studio';
  const isPrivacyPage = activeTab === 'privacy';
  const isTermsPage = activeTab === 'terms';

  const handleOpenStudio = () => navigateToTab('studio');
  const handleCloseStudio = () => navigateToTab('explorer');

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

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLandingPage ? (
          <LandingPage
            onProceed={() => navigateToTab('explorer')}
            onOpenStudio={handleOpenStudio}
          />
        ) : isStudioPage ? (
          <DevStudioModal
            isOpen={true}
            onClose={handleCloseStudio}
            isCreatorAuth={isCreatorAuth}
            setIsCreatorAuth={setIsCreatorAuth}
            sessions={sessions}
            onRefreshSessions={refreshSessions}
            onSelectSessionForPlayer={(id) => {
              navigateToTab('lessons', { id });
            }}
          />
        ) : isPrivacyPage ? (
          <LegalPage mode="privacy" />
        ) : isTermsPage ? (
          <LegalPage mode="terms" />
        ) : (
          <StudentPortal
            sessions={sessions}
            onOpenDevStudio={handleOpenStudio}
            activePortalTab={activePortalTab}
            setActivePortalTab={navigateToTab}
            routeParams={routeParams}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {!isLandingPage && !isStudioPage && !isPrivacyPage && !isTermsPage && (
        <MobileBottomNav
          activePortalTab={activePortalTab}
          setActivePortalTab={navigateToTab}
          onOpenDevStudio={handleOpenStudio}
        />
      )}

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
      <footer className="hidden md:block border-t border-[var(--border-color)] bg-[var(--bg-ground)] py-4 text-center text-xs text-[var(--text-muted)] transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <span className="font-serif text-[var(--text-primary)] font-bold">EduKatalyst</span>
            <span>•</span>
            <span>Learning Platform</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => navigateToTab('privacy')}
              className="text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => navigateToTab('terms')}
              className="text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AppShellProvider>
      <AppContent />
    </AppShellProvider>
  );
}
