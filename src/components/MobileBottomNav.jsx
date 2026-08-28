import React from 'react';
import { BookOpen, FileText, CheckSquare, Lock, HardDrive } from 'lucide-react';

export default function MobileBottomNav({
  activePortalTab,
  setActivePortalTab,
  onOpenDevStudio
}) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-ground)]/95 backdrop-blur-lg border-t border-[var(--border-color)] px-4 py-2 flex items-center justify-around shadow-2xl transition-colors duration-300">
      
      <button
        onClick={() => setActivePortalTab('explorer')}
        className={`flex flex-col items-center space-y-1 transition ${
          activePortalTab === 'explorer' ? 'text-[var(--accent-coral)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <HardDrive className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Explorer</span>
      </button>

      <button
        onClick={() => setActivePortalTab('lessons')}
        className={`flex flex-col items-center space-y-1 transition ${
          activePortalTab === 'lessons' ? 'text-[var(--accent-coral)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Lectures</span>
      </button>

      <button
        onClick={() => setActivePortalTab('notes')}
        className={`flex flex-col items-center space-y-1 transition ${
          activePortalTab === 'notes' ? 'text-[var(--accent-coral)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Notes</span>
      </button>

      <button
        onClick={() => setActivePortalTab('quizzes')}
        className={`flex flex-col items-center space-y-1 transition ${
          activePortalTab === 'quizzes' ? 'text-[var(--accent-coral)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <CheckSquare className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Quizzes</span>
      </button>

      <button
        onClick={onOpenDevStudio}
        className="flex flex-col items-center space-y-1 text-[var(--text-muted)] hover:text-[var(--accent-peach)] transition"
      >
        <Lock className="w-5 h-5 text-[var(--accent-coral)]" />
        <span className="text-[10px] font-semibold">Studio</span>
      </button>

    </div>
  );
}
