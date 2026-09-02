import React, { useState } from 'react';
import { Cloud, X, HardDrive, Package } from 'lucide-react';
import { DriveSyncTab } from './sync/DriveSyncTab';
import { GitHubSyncTab } from './sync/GitHubSyncTab';
import { LocalBackupTab } from './sync/LocalBackupTab';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function CloudSyncModal({ isOpen, onClose, isInline = false }) {
  const [activeTab, setActiveTab] = useState('drive'); // 'drive' | 'github' | 'local'

  // Only hide if explicitly passed isOpen={false}
  if (isOpen === false) return null;

  const content = (
    <div className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-3xl overflow-hidden flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-5 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold font-heading text-[var(--text-primary)]">Cloud Sync & Backup Center</h3>
            <p className="text-xs text-[var(--text-muted)]">Manage Google Drive, GitHub Gist, and Local Zip backups</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[var(--bg-ground)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-6 gap-2">
        <button
          onClick={() => setActiveTab('drive')}
          className={`py-3 px-4 text-xs font-bold font-heading border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'drive'
              ? 'border-[var(--accent-coral)] text-[var(--accent-coral)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive</span>
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`py-3 px-4 text-xs font-bold font-heading border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'github'
              ? 'border-[var(--accent-sage)] text-[var(--accent-sage)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <GithubIcon className="w-4 h-4" />
          <span>GitHub Gist</span>
        </button>
        <button
          onClick={() => setActiveTab('local')}
          className={`py-3 px-4 text-xs font-bold font-heading border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'local'
              ? 'border-[var(--accent-peach)] text-[var(--accent-peach)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Local Archive</span>
        </button>
      </div>

      {/* Tab Body Container */}
      <div className="p-6 overflow-y-auto flex-1">
        {activeTab === 'drive' && <DriveSyncTab onClose={onClose} />}
        {activeTab === 'github' && <GitHubSyncTab onClose={onClose} />}
        {activeTab === 'local' && <LocalBackupTab onClose={onClose} />}
      </div>
    </div>
  );


  // If rendered as standalone modal overlay (isOpen === true)
  if (isOpen === true && !isInline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export default CloudSyncModal;
