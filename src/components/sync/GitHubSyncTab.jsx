import React, { useState } from 'react';
import { Key, CheckCircle, AlertCircle, RefreshCw, UploadCloud, Download, ExternalLink } from 'lucide-react';
import { useGitHubSync } from '../../hooks/useGitHubSync';
import { getAllVideoSessions, saveVideoSession } from '../../utils/storage';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function GitHubSyncTab({ onClose }) {

  const {
    githubToken,
    userInfo,
    gists,
    isLoading,
    error,
    statusMessage,
    saveToken,
    loadGitHubState,
    exportGist,
    importGist,
  } = useGitHubSync();

  const [inputToken, setInputToken] = useState(githubToken);
  const [gistInputId, setGistInputId] = useState('');

  const handleSaveToken = async (e) => {
    e.preventDefault();
    saveToken(inputToken);
    await loadGitHubState(inputToken);
  };

  const handleExportFullDatabaseGist = async () => {
    try {
      const sessions = await getAllVideoSessions();
      await exportGist(
        { sessions, exportedAt: new Date().toISOString() },
        false,
        `EduKatalyst Database Backup (${sessions.length} sessions)`
      );
    } catch (err) {
      console.error('[GitHubSyncTab] Export error:', err);
    }
  };

  const handleImportGistById = async (e) => {
    e.preventDefault();
    if (!gistInputId.trim()) return;
    try {
      const data = await importGist(gistInputId);
      if (data && Array.isArray(data.sessions)) {
        for (const sess of data.sessions) {
          await saveVideoSession(sess);
        }
      } else if (data && data.id) {
        await saveVideoSession(data);
      }
      if (onClose) onClose();
    } catch (err) {
      console.error('[GitHubSyncTab] Import error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account / Token Configuration Card */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] border border-[var(--accent-sage)]/30">
              <GithubIcon className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold font-heading text-[var(--text-primary)]">GitHub Gist Integration</h4>
              <p className="text-xs text-[var(--text-muted)]">
                {userInfo ? `Authenticated as @${userInfo.login}` : 'Enter your GitHub Personal Access Token (PAT) with "gist" scope.'}
              </p>
            </div>
          </div>
          {userInfo && (
            <span className="px-2.5 py-1 rounded-full bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] border border-[var(--accent-sage)]/30 text-[10px] font-mono font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          )}
        </div>

        <form onSubmit={handleSaveToken} className="flex gap-2">
          <div className="relative flex-1">
            <Key className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              type="password"
              placeholder="Paste GitHub Personal Access Token (ghp_...)"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-sage)]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[var(--accent-sage)] text-[var(--bg-ground)] font-bold text-xs rounded-xl hover:opacity-90 transition flex items-center space-x-1 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Connect'}
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <p className="text-xs text-[var(--accent-sage)] font-mono">{statusMessage}</p>
        )}
      </div>

      {/* Manual Import Gist Form */}
      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
        <h5 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">Restore Gist by ID or URL</h5>
        <form onSubmit={handleImportGistById} className="flex gap-2">
          <input
            type="text"
            placeholder="Gist ID or URL (e.g. 5d89f...)"
            value={gistInputId}
            onChange={(e) => setGistInputId(e.target.value)}
            className="flex-1 px-3 py-2 bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-sage)]"
          />
          <button
            type="submit"
            disabled={isLoading || !gistInputId.trim()}
            className="px-4 py-2 bg-[var(--bg-ground)] text-[var(--text-primary)] font-bold text-xs rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition flex items-center space-x-1 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>
        </form>
      </div>


      {/* Gist Backup Actions */}
      {githubToken && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-[#A0AAB2] uppercase tracking-wider">Recent EduKatalyst Gists</h4>
            <button
              onClick={handleExportFullDatabaseGist}
              disabled={isLoading}
              className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-500 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Backup DB to Gist</span>
            </button>
          </div>

          {gists.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-[#343842] text-center text-xs text-[#A0AAB2]">
              No EduKatalyst Gist backups found.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {gists.map((g) => (
                <div
                  key={g.id}
                  className="p-3 rounded-xl bg-[#15171B] border border-[#343842] flex items-center justify-between hover:border-purple-500/40 transition"
                >
                  <div>
                    <h5 className="text-xs font-bold text-[#E4E6EB]">{g.description}</h5>
                    <p className="text-[10px] text-[#A0AAB2] font-mono">
                      Updated {new Date(g.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleImportGistById({ preventDefault: () => {}, target: {} }, g.id)}
                      disabled={isLoading}
                      className="p-1.5 bg-purple-500/10 text-purple-300 rounded-lg hover:bg-purple-500/20 transition"
                      title="Restore Gist Data"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <a
                      href={g.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-[#272B33] text-[#A0AAB2] rounded-lg hover:text-[#E4E6EB] transition"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
