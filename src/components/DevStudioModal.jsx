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
    <div className="w-full space-y-6 max-w-7xl mx-auto py-2 transition-colors duration-300">
      
      {/* Studio Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
              <span>Creator Studio Workspace</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Full-featured course authoring, multi-section note creation, quiz builder, and cloud backups
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold transition"
          >
            <span>← View Student Portal</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="w-full">
        {!isCreatorAuth ? (
          
          /* Passcode Screen */
          <div className="max-w-md mx-auto py-12 p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-6 shadow-sm">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-[var(--accent-coral)] mx-auto">
                <Key className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold font-heading text-[var(--text-primary)]">Creator Studio Authentication</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Enter creator passcode to access studio authoring tools and course management.
              </p>
            </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Passcode
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
                    placeholder="Enter passcode..."
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
                  Unlock Studio
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
                    <span>Upload Video</span>
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
                    <span>Notes</span>
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
                    <span>Quizzes</span>
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
                    <span>Categories & Tags</span>
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
                    <span>Library ({sessions.length})</span>
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
                  <span>Exit Studio</span>
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
                  onSelectSession={(id) => {
                    onClose();
                    onSelectSessionForPlayer?.(id);
                  }}
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
  );
}
