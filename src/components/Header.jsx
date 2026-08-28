import React, { useState, useEffect } from 'react';
import { Lock, Download, Settings } from 'lucide-react';
import KatalystLogo from './KatalystLogo';
import { navigateTo } from '../utils/router';
import { subscribeToInstallPrompt, isAppInstalled, triggerPWAInstall } from '../utils/pwaHelper';

export default function Header({ onOpenDevStudio, onOpenSettings }) {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isAppInstalled());
    const unsubInstall = subscribeToInstallPrompt(setCanInstall);
    return () => unsubInstall();
  }, []);

  const handleInstallClick = async () => {
    try {
      await triggerPWAInstall();
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  return (
    <header className="border-b border-[var(--border-color)] bg-[var(--bg-ground)] sticky top-0 z-30 backdrop-blur-md bg-[var(--bg-ground)]/90 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div 
          onClick={() => navigateTo('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <KatalystLogo className="w-9 h-9 group-hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold font-serif text-[var(--text-primary)] tracking-wide group-hover:text-[var(--accent-coral)] transition">
                EduKatalyst
              </h1>
              <span className="text-[10px] font-mono text-[var(--accent-sage)] bg-[var(--bg-surface)] border border-[var(--border-color)] px-1.5 py-0.2 rounded font-semibold">
                by DZVN
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">
              Katalyze the Change • By students. For students.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2">
          
          {/* PWA Install Button */}
          {!installed && canInstall && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold text-xs shadow-md hover:opacity-90 transition"
              title="Install EduKatalyst App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Settings & Theme Selection Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition"
            title="Open Platform Settings & Theme Gallery"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Creator Studio Button */}
          <button
            onClick={onOpenDevStudio}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition"
          >
            <Lock className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
            <span>Studio</span>
          </button>
        </div>

      </div>
    </header>
  );
}
