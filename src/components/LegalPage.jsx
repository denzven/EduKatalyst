import React from 'react';
import { ShieldCheck, FileText, ArrowLeft } from 'lucide-react';
import { useAppShell } from '../core/AppShellContext';

export default function LegalPage({ mode = 'privacy' }) {
  const { navigateToTab } = useAppShell();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 text-xs text-[var(--text-primary)]">
      
      <button
        onClick={() => navigateToTab('explorer')}
        className="flex items-center space-x-2 text-[var(--accent-coral)] hover:underline font-bold text-xs cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Explorer</span>
      </button>

      {mode === 'privacy' ? (
        <div className="katalyst-card p-6 md:p-8 rounded-2xl border border-[var(--border-color)] space-y-5 bg-[var(--bg-surface)]">
          <div className="flex items-center space-x-3 border-b border-[var(--border-color)] pb-4">
            <div className="p-2.5 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-[var(--text-primary)]">Privacy Policy</h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">Effective Date: August 31, 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed text-xs">
            <p>
              EduKatalyst is committed to protecting your privacy. This Privacy Policy explains how your information is handled when you use the EduKatalyst web application.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">1. Local-First Data Architecture</h3>
            <p>
              EduKatalyst is designed as a local-first single-page application. All course materials, AES-128 encrypted HLS video streams, Markdown notes, bookmarks, and quiz progress are stored locally inside your browser's IndexedDB and localStorage. We do <strong>not</strong> collect, store, track, sell, or transmit any user telemetry, personal data, or usage logs to external proprietary servers.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">2. Google Drive & GitHub Integrations</h3>
            <p>
              When you choose to use Cloud Sync features (Google Drive Sync or GitHub Gist Sync), your browser communicates directly with official APIs using OAuth 2.0 authorization tokens. We request access strictly to the minimal required scope (<code className="bg-[var(--bg-ground)] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--accent-coral)] font-mono">https://www.googleapis.com/auth/drive.file</code>) to manage backup packages in an "EduKatalyst Storage" folder on your Google Drive.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">3. Security & Storage</h3>
            <p>
              OAuth tokens are stored strictly in your browser's local storage and can be removed at any time by clicking "Sign Out" or clearing browser data.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">4. Contact</h3>
            <p>
              For inquiries regarding privacy, email us at <a href="mailto:edukatalyst.dzvn+queries@gmail.com" className="text-[var(--accent-peach)] underline font-mono">edukatalyst.dzvn+queries@gmail.com</a>.
            </p>
          </div>
        </div>
      ) : (
        <div className="katalyst-card p-6 md:p-8 rounded-2xl border border-[var(--border-color)] space-y-5 bg-[var(--bg-surface)]">
          <div className="flex items-center space-x-3 border-b border-[var(--border-color)] pb-4">
            <div className="p-2.5 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-[var(--text-primary)]">Terms of Service</h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">Effective Date: August 31, 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed text-xs">
            <p>
              Welcome to EduKatalyst! By accessing or using the EduKatalyst web application, you agree to comply with and be bound by the following Terms of Service.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">1. Acceptance of Terms</h3>
            <p>
              By accessing EduKatalyst, you agree to these Terms of Service. If you do not agree, please do not use the application.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">2. License & Ownership</h3>
            <p>
              EduKatalyst is an open-source educational platform provided under the MIT License. You retain full 100% ownership of all video lectures, notes, quizzes, and course materials created or stored using EduKatalyst.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">3. User Responsibilities</h3>
            <p>
              You are responsible for ensuring that you have appropriate rights to any course materials or video lectures you transcode, encrypt, or upload to your personal Google Drive or GitHub account using EduKatalyst.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">4. Disclaimer of Warranties</h3>
            <p>
              EduKatalyst is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied.
            </p>

            <h3 className="font-bold text-sm text-[var(--text-primary)] font-heading">5. Contact Information</h3>
            <p>
              For questions regarding these Terms, contact <a href="mailto:edukatalyst.dzvn+queries@gmail.com" className="text-[var(--accent-peach)] underline font-mono">edukatalyst.dzvn+queries@gmail.com</a>.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
