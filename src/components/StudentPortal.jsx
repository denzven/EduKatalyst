import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initAntiCheatProtection } from '../utils/antiCheat';
import { useAppShell } from '../core/AppShellContext';

export default function StudentPortal({ 
  sessions, 
  onOpenDevStudio, 
  activePortalTab, 
  setActivePortalTab,
  routeParams = {}
}) {
  const { moduleRegistry } = useAppShell();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(routeParams.subject || 'All');
  const [selectedTag, setSelectedTag] = useState(routeParams.tag || 'All');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(false);

  // Sync state with incoming URL route parameters
  useEffect(() => {
    if (routeParams.subject) setSelectedSubject(routeParams.subject);
    if (routeParams.tag) setSelectedTag(routeParams.tag);
  }, [routeParams.subject, routeParams.tag]);

  // Anti-Cheat Protection
  useEffect(() => {
    const cleanup = initAntiCheatProtection((detected) => {
      setIsDevToolsDetected(detected);
    });
    return cleanup;
  }, []);

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setActivePortalTab(activePortalTab, { subject, tag: selectedTag });
  };

  const handleSelectTag = (tag) => {
    setSelectedTag(tag);
    setActivePortalTab(activePortalTab, { subject: selectedSubject, tag });
  };

  const handleCopyDirectLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Resolve active feature module from central registry
  const activeModule = moduleRegistry.getModuleForRoute(activePortalTab) || moduleRegistry.getModule('explorer');
  const navItems = moduleRegistry.getNavItems();

  return (
    <div className="space-y-5 max-w-6xl mx-auto relative select-none transition-colors duration-300">
      
      {/* DevTools Open Security Shield Overlay */}
      {isDevToolsDetected && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-ground)]/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="p-3.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold font-heading text-[var(--text-primary)]">
            Anti-Cheat Speed Breaker Active
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md leading-relaxed">
            Developer tools inspection active. Close devtools to resume reading notes & taking assessment quizzes.
          </p>
          <button
            onClick={() => setIsDevToolsDetected(false)}
            className="px-4 py-2 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] text-xs font-bold hover:opacity-90 transition"
          >
            Resume Study
          </button>
        </div>
      )}

      {/* Primary Navigation & Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] shadow-sm">
        
        {/* Dynamic Navigation Tabs from Module Registry */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePortalTab === item.tab;

            return (
              <button
                key={item.tab}
                onClick={() => setActivePortalTab(item.tab, { subject: selectedSubject, tag: selectedTag })}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-md font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Search Input & Share Link */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lessons, notes, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] transition"
            />
          </div>

          <button
            onClick={() => handleCopyDirectLink()}
            className="p-2 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition shrink-0"
            title="Copy Direct URL Link to clipboard"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-[var(--accent-peach)]" />}
          </button>
        </div>

      </div>

      {/* Dynamic Module Outlet View Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePortalTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeModule ? (
            activeModule.render({
              selectedSubject,
              onSelectSubject: handleSelectSubject,
              selectedTag,
              onSelectTag: handleSelectTag,
              searchQuery,
              routeParams,
            })
          ) : (
            <div className="text-center py-12 text-xs text-[var(--text-muted)]">
              Module not found.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
