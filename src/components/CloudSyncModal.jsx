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
  FolderArchive,
  LogOut,
  Settings,
  HelpCircle
} from 'lucide-react';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
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
  getStoredClientId,
  setStoredClientId,
  promptGoogleDriveSignIn,
  validateDriveToken, 
  uploadZipToDrive, 
  listDriveBackups, 
  downloadFromDrive 
} from '../utils/googleDriveSync';
import { exportSessionToZip, importSessionFromZip, exportMasterBundle } from '../utils/zipHelper';
import { saveVideoSession } from '../utils/storage';

export default function CloudSyncModal({ sessions = [], onRefreshSessions }) {
  const [activeTab, setActiveTab] = useState('gdrive'); // default to gdrive
  
  // GitHub State
  const [githubToken, setGithubToken] = useState(getStoredGitHubToken());
  const [githubUser, setGithubUser] = useState(null);
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);
  const [githubGists, setGithubGists] = useState([]);
  const [gistImportInput, setGistImportInput] = useState('');
  
  // Google Drive State
  const [driveToken, setDriveToken] = useState(getStoredDriveToken());
  const [clientIdInput, setClientIdInput] = useState(() => getStoredClientId());
  const [driveUser, setDriveUser] = useState(null);
  const [isVerifyingDrive, setIsVerifyingDrive] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'token'
  
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
        let importedCount = 0;
        for (const s of data.sessions) {
          await saveVideoSession(s);
          importedCount++;
        }
        setStatusMsg({ type: 'success', text: `Restored ${importedCount} session(s) from GitHub Gist into local storage!` });
      } else if (data.id && data.playlistText) {
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
  const handleGoogleSignIn = async () => {
    const cleanedClientId = clientIdInput.trim();
    if (!cleanedClientId) {
      setStatusMsg({ 
        type: 'error', 
        text: 'Please paste your Google OAuth Client ID below before signing in. Expand the 3-step setup guide if you need a free Client ID.' 
      });
      setShowSetupGuide(true);
      return;
    }

    setIsSigningInGoogle(true);
    setStatusMsg(null);
    try {
      setStoredClientId(cleanedClientId);
      const newToken = await promptGoogleDriveSignIn(cleanedClientId);
      setDriveToken(newToken);
      await handleTestDrive(newToken);
    } catch (err) {
      if (err.message.includes('Google Drive API is disabled') || err.message.includes('has not been used in project')) {
        setStatusMsg({ 
          type: 'error', 
          text: 'Google Drive API is disabled in your Google Cloud Console project. Click the link below to enable Google Drive API for your project in 1 click.',
          link: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
          linkText: 'Enable Google Drive API'
        });
      } else if (err.message.includes('403') || err.message.includes('access_denied')) {
        setStatusMsg({ 
          type: 'error', 
          text: 'Google OAuth Error 403 (access_denied): Your app is in Testing status. Add your email address to "Test users" in Google Cloud OAuth Consent Screen, or click "Publish App" to make it public.',
          link: 'https://console.cloud.google.com/apis/credentials/consent',
          linkText: 'Open OAuth Consent Screen'
        });
        setShowSetupGuide(true);
      } else if (err.message.includes('400') || err.message.includes('origin_mismatch') || err.message.includes('origin')) {
        setStatusMsg({ 
          type: 'error', 
          text: `Google OAuth Error 400 (origin_mismatch): Your browser is accessing "${window.location.origin}". Add "${window.location.origin}" to Authorized JavaScript origins in Google Cloud Console, or open "http://localhost:5173" in your browser.`,
          link: 'https://console.cloud.google.com/apis/credentials',
          linkText: 'Fix in Google Cloud Console'
        });
        setShowSetupGuide(true);
      } else if (err.message.includes('401') || err.message.includes('invalid_client') || err.message.includes('client')) {
        setStatusMsg({ 
          type: 'error', 
          text: 'Google OAuth Error 401: Invalid Client ID. Please verify your OAuth Client ID in Google Cloud Console.',
          link: 'https://console.cloud.google.com/apis/credentials',
          linkText: 'Open Google Cloud Console'
        });
        setShowSetupGuide(true);
      } else {
        setStatusMsg({ type: 'error', text: `Google Sign-In Error: ${err.message}` });
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleDisconnectDrive = () => {
    setStoredDriveToken('');
    setDriveToken('');
    setDriveUser(null);
    setDriveFiles([]);
    setStatusMsg({ type: 'info', text: 'Disconnected Google Account.' });
  };

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
      if (!silent) setStatusMsg({ type: 'success', text: `Connected to Google Drive (${user.email})` });
      
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
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const zipFilename = `EduKatalyst_Official_Master_Library_${new Date().toISOString().slice(0,10)}.zip`;
      setStatusMsg({ type: 'info', text: 'Packaging all videos, notes, quizzes, and subjects into master library...' });

      await exportMasterBundle(sessions, async (blob) => {
        setStatusMsg({ type: 'info', text: 'Publishing master library to Google Drive "EduKatalyst Storage" folder...' });
        const driveFile = await uploadZipToDrive(blob, zipFilename, driveToken);
        setStatusMsg({ 
          type: 'success', 
          text: `🚀 Successfully Published Official Master Library ("${driveFile.name}") to Google Drive!` 
        });

        const files = await listDriveBackups(driveToken);
        setDriveFiles(files);
      });

    } catch (err) {
      setStatusMsg({ type: 'error', text: `Official Drive Publish Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreFromDrive = async (fileId, fileName) => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      setStatusMsg({ type: 'info', text: `Downloading "${fileName}" from Google Drive...` });
      const blob = await downloadFromDrive(fileId, driveToken);

      setStatusMsg({ type: 'info', text: `Extracting Zip package into IndexedDB...` });
      await importSessionFromZip(blob);

      setStatusMsg({ type: 'success', text: `Restored session from "${fileName}" successfully!` });
      onRefreshSessions?.();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Drive Restore Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-[var(--text-primary)]">
      
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--accent-coral)]/15 via-[var(--accent-peach)]/10 to-transparent border border-[var(--border-color)] flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[var(--accent-coral)]" />
            <span>EduKatalyst Cloud Sync & Backup Engine</span>
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Sync lecture encryption keys, video stream bundles, and metadata across your devices using Google Drive or GitHub.
          </p>
        </div>
      </div>

      {/* Cloud Provider Tabs */}
      <div className="flex border-b border-[var(--border-color)] space-x-4">
        <button
          onClick={() => setActiveTab('gdrive')}
          className={`pb-2.5 font-bold transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'gdrive'
              ? 'border-[var(--accent-coral)] text-[var(--accent-coral)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <GoogleIcon className="w-4 h-4" />
          <span>Google Drive Sync</span>
          {driveUser && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`pb-2.5 font-bold transition flex items-center space-x-2 border-b-2 ${
            activeTab === 'github'
              ? 'border-[var(--accent-coral)] text-[var(--accent-coral)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <GithubIcon className="w-4 h-4" />
          <span>GitHub Gist Sync</span>
          {githubUser && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
        </button>
      </div>

      {/* Global Status Message Alert */}
      {statusMsg && (
        <div className={`p-3.5 rounded-xl border flex items-start space-x-2 font-mono ${
          statusMsg.type === 'error'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            : statusMsg.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          {statusMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          ) : statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          )}

          <div className="flex-1 min-w-0">
            <span>{statusMsg.text}</span>
            {statusMsg.link && (
              <a
                href={statusMsg.link}
                target="_blank"
                rel="noreferrer"
                className="ml-2 underline hover:text-white inline-flex items-center gap-1 font-bold"
              >
                <span>{statusMsg.linkText || 'View Link'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ================= GOOGLE DRIVE TAB ================= */}
      {activeTab === 'gdrive' && (
        <div className="space-y-5">
          
          {/* Google Account Authentication Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center space-x-2">
                <GoogleIcon className="w-5 h-5" />
                <h4 className="font-bold text-[var(--text-primary)] text-sm">Google Drive Integration</h4>
              </div>

              {driveUser ? (
                <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{driveUser.email || 'Authorized'}</span>
                </div>
              ) : (
                <span className="text-[var(--text-muted)] text-[11px]">Not Connected</span>
              )}
            </div>

            {driveUser ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)]">
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Signed in as {driveUser.email}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    EduKatalyst sync is active for your Google Drive "EduKatalyst Storage" folder.
                  </p>
                </div>

                <button
                  onClick={handleDisconnectDrive}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Method Switcher Tabs */}
                <div className="flex bg-[var(--bg-ground)] p-1 rounded-xl border border-[var(--border-color)]">
                  <button
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      authMode === 'signin' 
                        ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow' 
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Google Sign-In Page
                  </button>
                  <button
                    onClick={() => setAuthMode('token')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      authMode === 'token' 
                        ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow' 
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Direct Access Token
                  </button>
                </div>

                {authMode === 'signin' ? (
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[var(--text-primary)] font-bold text-xs flex items-center justify-between">
                        <span>Google OAuth Client ID</span>
                        <a 
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--accent-peach)] hover:underline text-[11px] font-mono flex items-center gap-0.5"
                        >
                          <span>Get Client ID</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </label>
                      
                      <div className="relative">
                        <Key className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                        <input
                          type="text"
                          placeholder="e.g. 1234567890-abc.apps.googleusercontent.com"
                          value={clientIdInput}
                          onChange={(e) => setClientIdInput(e.target.value)}
                          className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] font-mono placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] transition"
                        />
                      </div>
                    </div>

                    {/* Primary Google Sign-In Button */}
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSigningInGoogle}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs shadow-md border border-gray-300 flex items-center justify-center space-x-2.5 transition active:scale-[0.99] cursor-pointer"
                    >
                      {isSigningInGoogle ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-gray-700" />
                      ) : (
                        <GoogleIcon className="w-4 h-4" />
                      )}
                      <span>{isSigningInGoogle ? 'Opening Google Sign-In...' : 'Sign in with Google Account'}</span>
                    </button>

                    {/* 3-Step Setup Guide Trigger */}
                    <div className="pt-1">
                      <button
                        onClick={() => setShowSetupGuide(!showSetupGuide)}
                        className="text-[var(--accent-peach)] hover:underline text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showSetupGuide ? 'Hide 3-Step Setup Guide' : 'How to get a free Google OAuth Client ID (1 minute guide)'}</span>
                      </button>

                      {showSetupGuide && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] space-y-2 text-[11px] leading-relaxed">
                          <div className="font-bold text-[var(--accent-coral)] flex items-center gap-1 font-heading">
                            <span>Step-by-Step Google OAuth Setup:</span>
                          </div>
                          <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)]">
                            <li>
                              Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[var(--accent-peach)] underline">Google Cloud Credentials</a>.
                            </li>
                            <li>
                              Click <strong>Create Credentials</strong> → <strong>OAuth client ID</strong>. Select <strong>Web application</strong>.
                            </li>
                            <li>
                              Under <strong>Authorized JavaScript origins</strong>, add: <code className="bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--accent-coral)]">{window.location.origin}</code>
                            </li>
                            <li>
                              Copy the generated <strong>Client ID</strong> and paste it into the field above, then click <strong>Sign in with Google Account</strong>.
                            </li>
                          </ol>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[var(--text-muted)] text-[11px]">
                      Paste a Google OAuth access token directly (e.g. generated from <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-[var(--accent-peach)] underline">OAuth Playground</a> with Drive scope).
                    </p>

                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Key className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                        <input
                          type="password"
                          placeholder="ya29.a0x..."
                          value={driveToken}
                          onChange={(e) => setDriveToken(e.target.value)}
                          className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-coral)]"
                        />
                      </div>
                      <button
                        onClick={handleSaveDriveToken}
                        disabled={isVerifyingDrive}
                        className="px-4 py-2 rounded-xl bg-[var(--accent-coral)] text-[#1D1214] font-bold text-xs flex items-center space-x-1.5 transition shrink-0 cursor-pointer"
                      >
                        {isVerifyingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        <span>Verify Token</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Drive Master Content Publishing Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--accent-coral)]/10 via-[var(--bg-surface)] to-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[var(--accent-coral)]" />
                  <span>Publish Study Materials to Official Google Drive</span>
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Publish all videos, notes, quizzes, and subjects to the official Google Drive folder for instant visitor access.
                </p>
              </div>

              {sessions.length > 0 && (
                <button
                  onClick={handleUploadMasterZipToDrive}
                  disabled={!driveUser || isProcessing}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold text-xs flex items-center space-x-2 transition shadow-lg hover:opacity-90 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>🚀 Publish All Master Content to Official Drive</span>
                </button>
              )}
            </div>

            {/* Content Type Statistics Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-ground)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
                <span>📹 Videos:</span>
                <strong className="text-[var(--accent-coral)] font-bold">
                  {sessions.filter(s => !s.id.startsWith('note_') && !s.id.startsWith('quiz_')).length}
                </strong>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-ground)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
                <span>📝 Notes:</span>
                <strong className="text-[var(--accent-peach)] font-bold">
                  {sessions.filter(s => s.id.startsWith('note_')).length}
                </strong>
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-ground)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
                <span>❓ Quizzes:</span>
                <strong className="text-emerald-400 font-bold">
                  {sessions.filter(s => s.id.startsWith('quiz_')).length}
                </strong>
              </span>
            </div>

            {sessions.length === 0 ? (
              <p className="text-[var(--text-muted)] text-[11px] py-2">
                No study materials stored in local storage. Create a video lecture, note, or quiz in Creator Studio first.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {sessions.map((s) => {
                  const isNote = s.id.startsWith('note_');
                  const isQuiz = s.id.startsWith('quiz_');
                  const typeLabel = isNote ? '📝 Note' : isQuiz ? '❓ Quiz' : '📹 Video';

                  return (
                    <div key={s.id} className="p-3.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[var(--accent-coral)]">
                            {typeLabel}
                          </span>
                          <span className="font-bold text-[var(--text-primary)] truncate text-xs">{s.title}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">
                          Subject: {s.category || 'General'} • {( (s.totalSizeBytes || 0) / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>

                      <button
                        onClick={() => handleUploadZipToDrive(s)}
                        disabled={!driveUser || isProcessing}
                        className="px-3 py-1.5 rounded-lg bg-[var(--accent-coral)] text-white dark:text-[#261619] font-bold text-[11px] flex items-center space-x-1 transition shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    </div>
                  );
                })}
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

      {/* ================= GITHUB GIST TAB ================= */}
      {activeTab === 'github' && (
        <div className="space-y-5">
          
          {/* GitHub Token Config Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center space-x-2">
                <GithubIcon className="w-4 h-4 text-[var(--accent-coral)]" />
                <h4 className="font-bold text-[var(--text-primary)]">GitHub Personal Access Token</h4>
              </div>

              {githubUser ? (
                <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>@{githubUser.login}</span>
                </div>
              ) : (
                <span className="text-[var(--text-muted)] text-[11px]">Not Connected</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[var(--text-primary)] font-semibold">
                Personal Access Token (Scope: `gist`)
              </label>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    placeholder="ghp_..."
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
                  <span>Verify GitHub Token</span>
                </button>
              </div>
            </div>
          </div>

          {/* GitHub Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Push / Export to Gist */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[var(--text-primary)] font-bold">
                  <Upload className="w-4 h-4 text-[var(--accent-coral)]" />
                  <span>Export Full Library Metadata</span>
                </div>
                <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
                  Backup session manifest, encryption key hashes, and taxonomy structure as a private GitHub Gist.
                </p>
              </div>

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

    </div>
  );
}
