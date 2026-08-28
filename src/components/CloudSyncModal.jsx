import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  RefreshCw, 
  Upload, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Info,
  Trash2,
  Lock,
  FileCode,
  FolderArchive
} from 'lucide-react';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
import { 
  getStoredGitHubToken, 
  setStoredGitHubToken, 
  validateGitHubToken, 
  exportToGitHubGist, 
  importFromGitHubGist, 
  listUserGists 
} from '../utils/githubSync';
import { 
  getStoredDriveToken, 
  setStoredDriveToken, 
  validateDriveToken, 
  uploadZipToDrive, 
  listDriveBackups, 
  downloadFromDrive 
} from '../utils/googleDriveSync';
import { exportSessionToZip, importSessionFromZip, exportMasterBundle } from '../utils/zipHelper';
import { saveVideoSession } from '../utils/storage';

export default function CloudSyncModal({ sessions = [], onRefreshSessions }) {
  const [activeTab, setActiveTab] = useState('github'); // 'github' | 'gdrive'
  
  // GitHub State
  const [githubToken, setGithubToken] = useState(getStoredGitHubToken());
  const [githubUser, setGithubUser] = useState(null);
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);
  const [githubGists, setGithubGists] = useState([]);
  const [gistImportInput, setGistImportInput] = useState('');
  
  // Google Drive State
  const [driveToken, setDriveToken] = useState(getStoredDriveToken());
  const [driveUser, setDriveUser] = useState(null);
  const [isVerifyingDrive, setIsVerifyingDrive] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  
  // Global Status & Action States
  const [statusMsg, setStatusMsg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (githubToken) {
      handleTestGitHub(githubToken, true);
    }
    if (driveToken) {
      handleTestDrive(driveToken, true);
    }
  }, []);

  // --- GitHub Handlers ---
  const handleSaveGithubToken = async () => {
    setStoredGitHubToken(githubToken);
    setStatusMsg({ type: 'info', text: 'GitHub token saved locally.' });
    if (githubToken) {
      await handleTestGitHub(githubToken);
    } else {
      setGithubUser(null);
      setGithubGists([]);
    }
  };

  const handleTestGitHub = async (tokenToUse = githubToken, silent = false) => {
    if (!tokenToUse) return;
    setIsVerifyingGithub(true);
    try {
      const user = await validateGitHubToken(tokenToUse);
      setGithubUser(user);
      if (!silent) setStatusMsg({ type: 'success', text: `Connected to GitHub as @${user.login}` });
      // Fetch user gists
      const gists = await listUserGists();
      setGithubGists(gists);
    } catch (err) {
      setGithubUser(null);
      if (!silent) setStatusMsg({ type: 'error', text: `GitHub Auth Error: ${err.message}` });
    } finally {
      setIsVerifyingGithub(false);
    }
  };

  const handlePushGistBackup = async (sessionToExport = null) => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const dataToExport = sessionToExport || {
        exportedAt: new Date().toISOString(),
        totalSessions: sessions.length,
        sessions: sessions.map(s => ({
          id: s.id,
          title: s.title,
          category: s.category,
          tags: s.tags,
          description: s.description,
          createdAt: s.createdAt,
          keyHex: s.keyHex,
          playlistText: s.playlistText,
          segmentCount: s.segmentCount,
          totalSizeBytes: s.totalSizeBytes
        }))
      };

      const title = sessionToExport ? `Lecture: ${sessionToExport.title}` : 'Full Library Metadata';
      const gist = await exportToGitHubGist(
        dataToExport, 
        false, 
        `EduKatalyst Backup [${title}] (${new Date().toLocaleDateString()})`
      );

      setStatusMsg({
        type: 'success',
        text: `Exported to GitHub Gist successfully!`,
        link: gist.htmlUrl,
        linkText: 'View Gist on GitHub'
      });

      // Refresh gists list
      const gists = await listUserGists();
      setGithubGists(gists);
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Gist Export Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePullGistBackup = async (gistIdInput) => {
    const id = gistIdInput || gistImportInput;
    if (!id) {
      setStatusMsg({ type: 'error', text: 'Please enter a Gist ID or select a Gist from your account.' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const data = await importFromGitHubGist(id);
      
      if (Array.isArray(data.sessions)) {
        // Bulk import metadata
        let importedCount = 0;
        for (const s of data.sessions) {
          await saveVideoSession(s);
          importedCount++;
        }
        setStatusMsg({ type: 'success', text: `Restored ${importedCount} session(s) from GitHub Gist into local storage!` });
      } else if (data.id && data.playlistText) {
        // Single session import
        await saveVideoSession(data);
        setStatusMsg({ type: 'success', text: `Restored session "${data.title || 'Video'}" from GitHub Gist!` });
      } else {
        throw new Error('Unrecognized Gist structure.');
      }

      onRefreshSessions?.();
      setGistImportInput('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Gist Import Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Google Drive Handlers ---
  const handleSaveDriveToken = async () => {
    setStoredDriveToken(driveToken);
    setStatusMsg({ type: 'info', text: 'Google Drive access token saved.' });
    if (driveToken) {
      await handleTestDrive(driveToken);
    } else {
      setDriveUser(null);
      setDriveFiles([]);
    }
  };

  const handleTestDrive = async (tokenToUse = driveToken, silent = false) => {
    if (!tokenToUse) return;
    setIsVerifyingDrive(true);
    try {
      const user = await validateDriveToken(tokenToUse);
      setDriveUser(user);
      if (!silent) setStatusMsg({ type: 'success', text: `Connected to Google Drive (${user.email || 'Valid OAuth Token'})` });
      
      const files = await listDriveBackups(tokenToUse);
      setDriveFiles(files);
    } catch (err) {
      setDriveUser(null);
      if (!silent) setStatusMsg({ type: 'error', text: `Drive Auth Error: ${err.message}` });
    } finally {
      setIsVerifyingDrive(false);
    }
  };

  const handleUploadZipToDrive = async (session) => {
    if (!session) {
      setStatusMsg({ type: 'error', text: 'Select a video session to upload to Google Drive.' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const zipFilename = `${session.title.replace(/[^a-z0-9]/gi, '_')}_hls_bundle.zip`;
      
      setStatusMsg({ type: 'info', text: `Compressing "${session.title}" HLS stream into Zip package...` });
      
      await exportSessionToZip(session, async (blob) => {
        setStatusMsg({ type: 'info', text: `Uploading package to Google Drive "EduKatalyst Storage" folder...` });
        const driveFile = await uploadZipToDrive(blob, zipFilename, driveToken);
        setStatusMsg({ 
          type: 'success', 
          text: `Uploaded "${driveFile.name}" to Google Drive successfully!` 
        });
        
        const files = await listDriveBackups(driveToken);
        setDriveFiles(files);
      });

    } catch (err) {
      setStatusMsg({ type: 'error', text: `Drive Upload Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadMasterZipToDrive = async () => {
    if (sessions.length === 0) {
      setStatusMsg({ type: 'error', text: 'No video sessions stored in IndexedDB to upload.' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: `Building Master Storage Archive (${sessions.length} sessions)...` });
    try {
      const zipFilename = `edukatalyst_master_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      await exportMasterBundle(sessions, async (blob) => {
        setStatusMsg({ type: 'info', text: `Uploading Master Archive package to Google Drive "EduKatalyst Storage" folder...` });
        const driveFile = await uploadZipToDrive(blob, zipFilename, driveToken);
        setStatusMsg({ 
          type: 'success', 
          text: `Uploaded Master Archive "${driveFile.name}" to Google Drive successfully!` 
        });

        const files = await listDriveBackups(driveToken);
        setDriveFiles(files);
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Master Drive Upload Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreFromDrive = async (fileId, fileName) => {
    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: `Downloading "${fileName}" from Google Drive...` });
    try {
      const blob = await downloadFromDrive(fileId, driveToken);
      const file = new File([blob], fileName, { type: 'application/zip' });
      
      setStatusMsg({ type: 'info', text: `Importing encrypted HLS video bundle into IndexedDB...` });
      const session = await importSessionFromZip(file);
      await saveVideoSession(session);

      setStatusMsg({ type: 'success', text: `Successfully restored "${session.title}" from Google Drive!` });
      onRefreshSessions?.();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Drive Restore Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-xs transition-colors duration-300">
      
      {/* Top Banner / Explanation */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[var(--accent-coral)]/15 border border-[var(--accent-coral)]/30 text-[var(--accent-coral)] rounded-xl">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-serif">
              Cloud Backup & Temporary Storage Hub
            </h3>
            <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
              Connect your GitHub or Google Drive account to sync encrypted lectures, manifests, and notes directly from the browser.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 bg-[var(--bg-ground)] p-1 rounded-xl border border-[var(--border-color)] shrink-0">
          <button
            onClick={() => { setActiveTab('github'); setStatusMsg(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'github'
                ? 'bg-[var(--accent-coral)] text-[#1D1214] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <GithubIcon className="w-4 h-4" />
            <span>GitHub Gist / Repos</span>
          </button>

          <button
            onClick={() => { setActiveTab('gdrive'); setStatusMsg(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'gdrive'
                ? 'bg-[var(--accent-coral)] text-[#1D1214] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive</span>
          </button>
        </div>
      </div>

      {/* Global Status Notification */}
      {statusMsg && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
          statusMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' :
          statusMsg.type === 'error' ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' :
          'bg-sky-950/40 border-sky-500/30 text-sky-200'
        }`}>
          <div className="flex items-center space-x-2 min-w-0">
            {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusMsg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {statusMsg.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span className="truncate">{statusMsg.text}</span>
          </div>

          {statusMsg.link && (
            <a
              href={statusMsg.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-[var(--accent-peach)] hover:underline font-mono text-[11px] shrink-0"
            >
              <span>{statusMsg.linkText || 'Open Link'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* ================= GITHUB TAB ================= */}
      {activeTab === 'github' && (
        <div className="space-y-5">
          
          {/* GitHub Token Config Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center space-x-2">
                <GithubIcon className="w-4 h-4 text-[var(--accent-coral)]" />
                <h4 className="font-bold text-[var(--text-primary)]">GitHub Personal Access Token (PAT)</h4>
              </div>

              {githubUser ? (
                <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Connected as @{githubUser.login}</span>
                </div>
              ) : (
                <span className="text-[var(--text-muted)] text-[11px]">Not Connected</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[var(--text-primary)] font-semibold flex items-center justify-between">
                <span>Personal Access Token (with `gist` scope)</span>
                <a 
                  href="https://github.com/settings/tokens/new?scopes=gist&description=EduKatalyst+Storage"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent-peach)] hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>Generate Token on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2.5 text-[var(--text-primary)] font-mono placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)]"
                  />
                </div>
                <button
                  onClick={handleSaveGithubToken}
                  disabled={isVerifyingGithub}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] font-bold flex items-center space-x-1.5 transition shrink-0"
                >
                  {isVerifyingGithub ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Verify & Save</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Your token is stored safely in your browser local storage and is only transmitted directly to GitHub's HTTPS endpoint.
              </p>
            </div>
          </div>

          {/* GitHub Actions Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Push / Sync Gists */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center space-x-2 text-[var(--text-primary)] font-bold">
                <Upload className="w-4 h-4 text-[var(--accent-coral)]" />
                <span>Export Sessions to GitHub Gist</span>
              </div>
              <p className="text-[var(--text-muted)] text-[11px]">
                Create a private GitHub Gist containing full metadata and encryption key references for all {sessions.length} sessions.
              </p>
              
              <button
                onClick={() => handlePushGistBackup()}
                disabled={!githubUser || isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] font-bold disabled:opacity-50 flex items-center justify-center space-x-2 transition"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
                <span>Export Library Metadata to Gist</span>
              </button>
            </div>

            {/* Pull / Import Gist by ID */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center space-x-2 text-[var(--text-primary)] font-bold">
                <Download className="w-4 h-4 text-[var(--accent-coral)]" />
                <span>Import Session from Gist ID</span>
              </div>
              <p className="text-[var(--text-muted)] text-[11px]">
                Enter a Gist ID or Gist URL to restore lecture metadata into IndexedDB.
              </p>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Gist ID or URL..."
                  value={gistImportInput}
                  onChange={(e) => setGistImportInput(e.target.value)}
                  className="flex-1 bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-coral)]"
                />
                <button
                  onClick={() => handlePullGistBackup()}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
                  <span>Restore</span>
                </button>
              </div>
            </div>

          </div>

          {/* User Gists List */}
          {githubUser && (
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-[var(--accent-coral)]" />
                  Your EduKatalyst GitHub Gists ({githubGists.length})
                </h4>
                <button 
                  onClick={() => handleTestGitHub(githubToken)} 
                  className="text-[var(--accent-peach)] hover:underline text-[11px] font-mono flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Gists</span>
                </button>
              </div>

              {githubGists.length === 0 ? (
                <p className="text-[var(--text-muted)] text-[11px] py-2">
                  No EduKatalyst Gists found on your GitHub account. Click "Export Library Metadata to Gist" above to create one.
                </p>
              ) : (
                <div className="space-y-2">
                  {githubGists.map((gist) => (
                    <div key={gist.id} className="p-3 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-[var(--text-primary)] truncate">{gist.description}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                          ID: {gist.id} • Updated: {new Date(gist.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handlePullGistBackup(gist.id)}
                          disabled={isProcessing}
                          className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-coral)] text-[#1D1214] font-bold text-[11px] transition"
                        >
                          Restore
                        </button>
                        <a
                          href={gist.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ================= GOOGLE DRIVE TAB ================= */}
      {activeTab === 'gdrive' && (
        <div className="space-y-5">
          
          {/* Drive Token Config Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-[var(--accent-coral)]" />
                <h4 className="font-bold text-[var(--text-primary)]">Google Drive OAuth Access Token</h4>
              </div>

              {driveUser ? (
                <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{driveUser.email || 'Drive Authorized'}</span>
                </div>
              ) : (
                <span className="text-[var(--text-muted)] text-[11px]">Not Connected</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[var(--text-primary)] font-semibold">
                OAuth Access Token (Drive Scope: `https://www.googleapis.com/auth/drive.file`)
              </label>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    placeholder="ya29.a0x..."
                    value={driveToken}
                    onChange={(e) => setDriveToken(e.target.value)}
                    className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2.5 text-[var(--text-primary)] font-mono placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)]"
                  />
                </div>
                <button
                  onClick={handleSaveDriveToken}
                  disabled={isVerifyingDrive}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] font-bold flex items-center space-x-1.5 transition shrink-0"
                >
                  {isVerifyingDrive ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Verify Drive Token</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Backups are stored automatically in a dedicated <strong className="text-[var(--text-primary)]">"EduKatalyst Storage"</strong> folder inside your Google Drive.
              </p>
            </div>
          </div>

          {/* Drive Sessions Upload List */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2">
              <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[var(--accent-coral)]" />
                Upload Sessions to Google Drive ({sessions.length})
              </h4>

              {sessions.length > 0 && (
                <button
                  onClick={handleUploadMasterZipToDrive}
                  disabled={!driveUser || isProcessing}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[var(--accent-coral)] to-[var(--accent-peach)] text-[#1D1214] font-bold text-[11px] flex items-center space-x-1.5 transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Upload Master Archive Zip</span>
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <p className="text-[var(--text-muted)] text-[11px] py-2">
                No encrypted sessions stored in local IndexedDB. Encrypt a lecture first.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sessions.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--text-primary)] truncate">{s.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                        {s.segmentCount} segments • {(s.totalSizeBytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    <button
                      onClick={() => handleUploadZipToDrive(s)}
                      disabled={!driveUser || isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent-coral)] text-[#1D1214] font-bold text-[11px] flex items-center space-x-1 transition shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Zip</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Google Drive Stored Files */}
          {driveUser && (
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[var(--accent-coral)]" />
                  Google Drive "EduKatalyst Storage" Folder Files ({driveFiles.length})
                </h4>
                <button 
                  onClick={() => handleTestDrive(driveToken)}
                  className="text-[var(--accent-peach)] hover:underline text-[11px] font-mono flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Drive</span>
                </button>
              </div>

              {driveFiles.length === 0 ? (
                <p className="text-[var(--text-muted)] text-[11px] py-2">
                  No files uploaded to your Google Drive "EduKatalyst Storage" folder yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {driveFiles.map((file) => (
                    <div key={file.id} className="p-3 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-[var(--text-primary)] truncate">{file.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                          Uploaded: {new Date(file.createdTime).toLocaleDateString()} • {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Archive'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRestoreFromDrive(file.id, file.name)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-lg bg-[var(--accent-coral)] text-[#1D1214] font-bold text-[11px] flex items-center space-x-1 transition shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Restore Zip</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
