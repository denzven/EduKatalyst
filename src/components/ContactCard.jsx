import React from 'react';
import { Mail, Code2, MessageSquare, Heart, Lock } from 'lucide-react';
import KatalystLogo from './KatalystLogo';

export default function ContactCard({ onOpenStudio }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto my-8 shadow-xl transition-colors duration-300">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div className="flex items-center space-x-3">
          <KatalystLogo className="w-10 h-10" />
          <div>
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
              EduKatalyst by DZVN
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Katalyze the Change • By students. For students.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-ground)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
          <Heart className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
          <span>Peer-Driven Academic Collective</span>
        </div>
      </div>

      {/* Main Content & Contact Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
        
        <div className="space-y-3">
          <h4 className="font-bold text-[var(--text-primary)] font-heading flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[var(--accent-coral)]" />
            Peer Feedback & Contributions
          </h4>
          <p className="text-[var(--text-muted)]">
            EduKatalyst is an open academic platform built to deliver structured notes, derivations, and assessment quizzes. Have feedback, found an error in a derivation, or want to contribute notes?
          </p>
        </div>

        <div className="space-y-3 bg-[var(--bg-ground)] p-4 rounded-2xl border border-[var(--border-color)]">
          <h4 className="font-bold text-[var(--text-primary)] font-heading flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[var(--accent-coral)]" />
            Contact & Repository
          </h4>
          
          <div className="space-y-2 font-mono text-[11px]">
            <a
              href="mailto:edukatalyst@dzvn.org"
              className="flex items-center space-x-2 text-[var(--text-primary)] hover:underline"
            >
              <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>edukatalyst@dzvn.org</span>
            </a>

            <a
              href="https://github.com/dzvn/edukatalyst"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 text-[var(--text-primary)] hover:underline"
            >
              <Code2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>github.com/dzvn/edukatalyst</span>
            </a>
          </div>
        </div>

      </div>

      {/* Discrete Admin Link at Bottom Footer */}
      <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
        <span>© {new Date().getFullYear()} DZVN Tech • Static AES-128 HLS</span>
        
        {onOpenStudio && (
          <button
            onClick={onOpenStudio}
            className="flex items-center space-x-1 text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition"
            title="Creator Studio Administration"
          >
            <Lock className="w-3 h-3 text-[var(--accent-coral)]" />
            <span>Studio</span>
          </button>
        )}
      </div>

    </div>
  );
}
