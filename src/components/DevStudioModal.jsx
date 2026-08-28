import React, { useState } from 'react';
import { 
  Lock, 
  UploadCloud, 
  Layers, 
  HardDrive, 
  X, 
  LogOut, 
  Key, 
  AlertCircle,
  FileText,
  HelpCircle,
  Cloud
} from 'lucide-react';
import VideoUploader from './VideoUploader';
import TaxonomyManager from './TaxonomyManager';
import VideoLibrary from './VideoLibrary';
import StudioNotesManager from './StudioNotesManager';
import QuizStudioManager from './QuizStudioManager';
import CloudSyncModal from './CloudSyncModal';
import { setCreatorAuthenticated } from '../utils/auth';

export default function DevStudioModal({ 
  isOpen, 
  onClose, 
  isCreatorAuth, 
  setIsCreatorAuth,
  sessions,
  onRefreshSessions,
  onSelectSessionForPlayer
}) {
  const [activeSubTab, setActiveSubTab] = useState('upload');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'Test123') {
      setCreatorAuthenticated(true);
      setIsCreatorAuth(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Invalid password. Access denied.');
    }
  };

  const handleAutoFillPassword = () => {
    setPasswordInput('Test123');
    setErrorMsg(null);
  };

  const handleLogout = () => {
    setCreatorAuthenticated(false);
    setIsCreatorAuth(false);
    setPasswordInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden my-8 transition-colors duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                Creator Studio — Central Controller
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                AES-128 HLS Lecture Encryption & Dynamic Taxonomy Management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!isCreatorAuth ? (
            
            /* Password Screen */
            <div className="max-w-md mx-auto py-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-[var(--accent-coral)] mx-auto">
                  <Key className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold font-heading text-[var(--text-primary)]">Creator Authentication</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Enter admin password to access central creator controller tools.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFillPassword}
                      className="text-[11px] text-[var(--accent-peach)] hover:underline font-mono font-bold"
                    >
                      Fill "Test123"
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] font-mono transition"
                    autoFocus
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold text-xs transition shadow-lg hover:opacity-90"
                >
                  Unlock Creator Studio
                </button>
              </form>
            </div>

          ) : (

            /* Authenticated Studio Dashboard */
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center space-x-2 bg-[var(--bg-surface)] p-1.5 rounded-xl border border-[var(--border-color)] w-full sm:w-auto overflow-x-auto">
                  <button
                    onClick={() => setActiveSubTab('upload')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      activeSubTab === 'upload'
                        ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Encrypt Lecture</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('notes_manager')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      activeSubTab === 'notes_manager'
                        ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Notes Studio</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('quiz_studio')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      activeSubTab === 'quiz_studio'
                        ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Quiz Studio</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('taxonomy')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      activeSubTab === 'taxonomy'
                        ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Taxonomy Controller</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('library')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      activeSubTab === 'library'
                        ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Storage ({sessions.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveSubTab('cloud_sync')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      activeSubTab === 'cloud_sync'
                        ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Cloud Sync</span>
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-rose-400 text-xs font-semibold transition shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock Studio</span>
                </button>
              </div>

              {/* Sub Tab Views */}
              {activeSubTab === 'upload' && (
                <VideoUploader onUploadComplete={() => {
                  onRefreshSessions?.();
                  setActiveSubTab('library');
                }} />
              )}

              {activeSubTab === 'notes_manager' && (
                <StudioNotesManager />
              )}

              {activeSubTab === 'quiz_studio' && (
                <QuizStudioManager />
              )}

              {activeSubTab === 'taxonomy' && (
                <TaxonomyManager />
              )}

              {activeSubTab === 'library' && (
                <VideoLibrary
                  sessions={sessions}
                  onRefreshSessions={onRefreshSessions}
                  onSelectSessionForPlayer={(id) => {
                    onClose();
                    onSelectSessionForPlayer?.(id);
                  }}
                  onOpenCloudSync={() => setActiveSubTab('cloud_sync')}
                />
              )}

              {activeSubTab === 'cloud_sync' && (
                <CloudSyncModal
                  sessions={sessions}
                  onRefreshSessions={onRefreshSessions}
                />
              )}

            </div>

          )}
        </div>

      </div>
    </div>
  );
}
