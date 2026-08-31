import React, { useState, useEffect, useRef } from 'react';
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
  Unlock,
  X,
  Eye,
  EyeOff,
  FileCode,
  FolderArchive,
  LogOut,
  Settings,
  HelpCircle,
  Sparkles
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
  checkAndExtractOAuthHashToken,
  getStoredClientId,
  setStoredClientId,
  validateDriveToken, 
  uploadZipToDrive, 
  listDriveBackups, 
  downloadFromDrive,
  fetchMasterLedger,
  updateMasterLedger
} from '../utils/googleDriveSync';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { exportSessionToZip, importSessionFromZip, exportMasterBundle } from '../utils/zipHelper';
import { saveVideoSession } from '../utils/storage';

function decodeGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode Google JWT:', err);
    return null;
  }
}

function CleanGoogleSignInComponent({ onSuccessCredential, onError }) {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        console.log('[Google Credential Response]:', credentialResponse);
        if (credentialResponse.credential) {
          const decoded = decodeGoogleJwt(credentialResponse.credential);
          if (decoded && decoded.email) {
            onSuccessCredential(decoded);
          }
        }
      }}
      onError={() => {
        console.warn('[Google Login Failed]');
        onError(new Error('Google Sign-In failed or popup was closed.'));
      }}
      shape="pill"
      theme={isDark ? "filled_black" : "outline"}
      size="large"
      width="280"
    />
  );
}

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
  // Token Visibility Protection State
  const [showDriveTokenPass, setShowDriveTokenPass] = useState(false);
  const [showGithubTokenPass, setShowGithubTokenPass] = useState(false);
  
  // Global Status & Action States
  const [statusMsg, setStatusMsg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Master Security Passcode Protection State
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeVerified, setPasscodeVerified] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('katalyst_creator_passcode_verified') === 'true';
  });
  const [passcodeError, setPasscodeError] = useState('');
  const pendingMasterActionRef = useRef(null);

  const checkPasscodeProtection = (actionToRun) => {
    if (passcodeVerified) {
      actionToRun();
    } else {
      pendingMasterActionRef.current = actionToRun;
      setPasscodeError('');
      setPasscodeInput('');
      setPasscodeModalOpen(true);
    }
  };

  const handleVerifyPasscode = (e) => {
    e?.preventDefault();
    const targetPasscode = import.meta.env.VITE_MASTER_PUBLISH_PASSCODE || 'edukatalyst2026';
    if (passcodeInput.trim() === targetPasscode) {
      localStorage.setItem('katalyst_creator_passcode_verified', 'true');
      setPasscodeVerified(true);
      setPasscodeModalOpen(false);
      setPasscodeError('');
      setStatusMsg({ type: 'success', text: '🔐 Master Creator Passcode Verified! Upload access granted.' });
      if (pendingMasterActionRef.current) {
        const fn = pendingMasterActionRef.current;
        pendingMasterActionRef.current = null;
        fn();
      }
    } else {
      setPasscodeError('Incorrect passcode! Contact system administrator for access.');
    }
  };

  const handleLockMasterPool = () => {
    localStorage.removeItem('katalyst_creator_passcode_verified');
    setPasscodeVerified(false);
    setStatusMsg({ type: 'info', text: '🔒 Master Drive Storage Pool Locked.' });
  };

  const requestDriveAccess = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('[Google Drive Access Scope Granted]:', tokenResponse);
      if (tokenResponse.access_token) {
        const token = tokenResponse.access_token;
        setDriveToken(token);
        setStoredDriveToken(token);
        
        try {
          const user = await validateDriveToken(token);
          setDriveUser(user);
        } catch (e) {
          console.warn('Drive token validate warning:', e);
        }

        if (pendingActionRef.current === 'test') {
          pendingActionRef.current = null;
          runDriveTestWithToken(token);
        } else if (pendingActionRef.current === 'master') {
          pendingActionRef.current = null;
          uploadMasterWithToken(token);
        } else if (pendingActionRef.current === 'session' && pendingSessionRef.current) {
          const sess = pendingSessionRef.current;
          pendingActionRef.current = null;
          pendingSessionRef.current = null;
          uploadZipWithToken(sess, token);
        }
      }
    },
    onError: (errorResponse) => {
      console.warn('[Google OAuth Access Request Cancelled]:', errorResponse);
      setStatusMsg({ 
        type: 'error', 
        text: 'Google Drive access token missing. Enter your token below or use the 1-click Google OAuth Playground link.',
        link: 'https://developers.google.com/oauthplayground/#step1&scopes=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email',
        linkText: 'OAuth Playground Link'
      });
      setShowTokenInput(true);
    },
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email profile',
  });

  useEffect(() => {
    const refreshSessions = async () => {
      try {
        const data = await getAllVideoSessions();
        setSessions(data);
      } catch (e) {
        console.warn('Failed to load local sessions:', e);
      }
    };

    refreshSessions();

    if (typeof window !== 'undefined') {
      window.addEventListener('katalyst_storage_updated', refreshSessions);
    }

    const extractedToken = checkAndExtractOAuthHashToken();
    const activeDriveToken = extractedToken || driveToken;

    if (extractedToken) {
      setDriveToken(extractedToken);
      setStatusMsg({
        type: 'success',
        text: 'Google Drive OAuth access token acquired! Verifying cloud connection...'
      });
    }
    if (githubToken) {
      handleTestGitHub(githubToken, true);
    }
    if (activeDriveToken) {
      handleTestDrive(activeDriveToken, false);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('katalyst_storage_updated', refreshSessions);
      }
    };
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
    if (cleanedClientId) {
      setStoredClientId(cleanedClientId);
      setStatusMsg({ type: 'info', text: 'Client ID updated. Use the Google Sign-In button below.' });
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

  const uploadZipWithToken = async (session, tokenToUse) => {
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
        const driveFile = await uploadZipToDrive(blob, zipFilename, tokenToUse);
        setStatusMsg({ 
          type: 'success', 
          text: `Uploaded "${driveFile.name}" to Google Drive successfully!` 
        });
        
        const files = await listDriveBackups(tokenToUse);
        setDriveFiles(files);
      });

    } catch (err) {
      setStatusMsg({ type: 'error', text: `Drive Upload Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadZipToDrive = async (session) => {
    checkPasscodeProtection(async () => {
      let tokenToUse = driveToken || getStoredDriveToken();
      if (!tokenToUse) {
        setShowTokenInput(true);
        return;
      }
      await uploadZipWithToken(session, tokenToUse);
    });
  };

  const uploadMasterWithToken = async (tokenToUse) => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const zipFilename = `EduKatalyst_Official_Master_Library_${new Date().toISOString().slice(0,10)}.zip`;
      setStatusMsg({ type: 'info', text: 'Packaging all videos, notes, quizzes, and subjects into master library...' });

      await exportMasterBundle(sessions, async (blob) => {
        setStatusMsg({ type: 'info', text: 'Publishing master library & updating Master Sync Ledgerbook on Google Drive...' });
        const driveFile = await uploadZipToDrive(blob, zipFilename, tokenToUse);
        
        // Update Master Sync Ledgerbook on Google Drive
        await updateMasterLedger({
          activeMasterZip: zipFilename,
          activeMasterZipId: driveFile.id,
          sessionCount: sessions.length,
          stats: {
            videos: sessions.filter(s => !s.id.startsWith('note_') && !s.id.startsWith('quiz_')).length,
            notes: sessions.filter(s => s.id.startsWith('note_')).length,
            quizzes: sessions.filter(s => s.id.startsWith('quiz_')).length
          }
        }, tokenToUse);

        setStatusMsg({ 
          type: 'success', 
          text: `🚀 Successfully Published Master Library ("${driveFile.name}") & Updated Master Sync Ledgerbook!` 
        });

        const files = await listDriveBackups(tokenToUse);
        setDriveFiles(files);
      });

    } catch (err) {
      setStatusMsg({ type: 'error', text: `Official Drive Publish Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadMasterZipToDrive = async () => {
    checkPasscodeProtection(async () => {
      let tokenToUse = driveToken || getStoredDriveToken();
      if (!tokenToUse) {
        setShowTokenInput(true);
        return;
      }
      await uploadMasterWithToken(tokenToUse);
    });
  };

  const runDriveTestWithToken = async (tokenToUse) => {
    setIsProcessing(true);
    setStatusMsg({ type: 'info', text: '🧪 STEP 1/4: Generating sample diagnostic test file...' });

    try {
      const sampleText = `EduKatalyst Google Drive Integration Test File\nCreated At: ${new Date().toISOString()}\nStatus: PASS\nSystem: Client-Side Cloud Sync Verification`;
      const sampleBlob = new Blob([sampleText], { type: 'text/plain' });
      const testFileName = `edukatalyst_integration_test_${Date.now()}.txt`;

      setStatusMsg({ type: 'info', text: `🧪 STEP 2/4: Uploading "${testFileName}" to "EduKatalyst Storage" folder on Google Drive...` });
      const uploadedFile = await uploadZipToDrive(sampleBlob, testFileName, tokenToUse);

      setStatusMsg({ type: 'info', text: `🧪 STEP 3/4: Refreshing file list from Google Drive...` });
      const files = await listDriveBackups(tokenToUse);
      setDriveFiles(files);

      setStatusMsg({ type: 'info', text: `🧪 STEP 4/4: Downloading uploaded sample file back from Google Drive for integrity check...` });
      const downloadedBlob = await downloadFromDrive(uploadedFile.id, tokenToUse);
      const downloadedText = await downloadedBlob.text();

      if (downloadedText === sampleText) {
        setStatusMsg({
          type: 'success',
          text: `🎉 GOOGLE DRIVE INTEGRATION TEST PASSED! Uploaded sample file (${testFileName}), retrieved File ID (${uploadedFile.id}), and verified content integrity 100%!`
        });
      } else {
        setStatusMsg({
          type: 'info',
          text: `Uploaded and downloaded sample file (${uploadedFile.id}), but content length differed slightly.`
        });
      }
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.includes('Google Drive API is disabled') || errMsg.includes('has not been used in project')) {
        setStatusMsg({ 
          type: 'error', 
          text: 'Google Drive API is disabled in your Google Cloud Console project. Enable it at the link below in 1 click.',
          link: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
          linkText: 'Enable Google Drive API'
        });
      } else if (errMsg.includes('403') || errMsg.includes('access_denied')) {
        setStatusMsg({ 
          type: 'error', 
          text: 'Google OAuth Error 403 (access_denied): Your app is in Testing status. Add your email to "Test users" in Google Cloud OAuth Consent Screen.',
          link: 'https://console.cloud.google.com/apis/credentials/consent',
          linkText: 'Open OAuth Consent Screen'
        });
        setShowSetupGuide(true);
      } else if (errMsg.includes('400') || errMsg.includes('origin_mismatch')) {
        setStatusMsg({ 
          type: 'error', 
          text: `Google OAuth Error 400 (origin_mismatch): Add "${window.location.origin}" to Authorized JavaScript origins in Google Cloud Console.`,
          link: 'https://console.cloud.google.com/apis/credentials',
          linkText: 'Fix in Google Cloud Console'
        });
        setShowSetupGuide(true);
      } else {
        setStatusMsg({ type: 'error', text: `🧪 Integration Test Error: ${errMsg}` });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunDriveIntegrationTest = async () => {
    checkPasscodeProtection(async () => {
      let tokenToUse = driveToken || getStoredDriveToken();

      if (tokenToUse) {
        try {
          await validateDriveToken(tokenToUse);
        } catch {
          tokenToUse = null;
        }
      }

      if (!tokenToUse) {
        setShowTokenInput(true);
        return;
      }

      await runDriveTestWithToken(tokenToUse);
    });
  };

  const handleRestoreFromDrive = async (fileId, fileName) => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      let tokenToUse = driveToken || getStoredDriveToken();
      setStatusMsg({ type: 'info', text: `Downloading "${fileName}" from Google Drive...` });
      const blob = await downloadFromDrive(fileId, tokenToUse);

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

  const handleSyncDriveToWebsite = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      let tokenToUse = driveToken || getStoredDriveToken();
      setStatusMsg({ type: 'info', text: '🌐 STEP 1/2: Fetching latest master library from Google Drive...' });
      
      const files = await listDriveBackups(tokenToUse);
      setDriveFiles(files);
      
      if (!files || files.length === 0) {
        throw new Error('No master library found on Google Drive. Click "Sync Local Pool to Google Drive" first to publish!');
      }

      const latestMasterFile = files[0];
      setStatusMsg({ type: 'info', text: `🌐 STEP 2/2: Downloading & Syncing "${latestMasterFile.name}" to live website content...` });
      
      const blob = await downloadFromDrive(latestMasterFile.id, tokenToUse);
      await importSessionFromZip(blob);

      setStatusMsg({ 
        type: 'success', 
        text: `🎉 LIVE WEBSITE SYNC COMPLETE! Unpacked & published all videos, notes, and quizzes from Google Drive to live website content!` 
      });
      
      onRefreshSessions?.();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Drive to Website Sync Failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-[var(--text-primary)]">
      
      {/* Premium Futuristic Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[var(--accent-coral)]/20 via-[var(--accent-peach)]/10 to-transparent border border-[var(--border-color)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--accent-coral)]/20 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
              Cloud Storage & Sync Hub
            </h3>
          </div>
          <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed max-w-xl">
            Publish, backup, and sync course materials, video encryption keys, notes, and quizzes to the central Master Drive Pool.
          </p>
        </div>

        {/* Live Quick Stats Badges */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
            <HardDrive className="w-3.5 h-3.5 text-[var(--accent-coral)]" />
            <span>Local: <strong className="text-[var(--text-primary)] font-bold">{sessions.length}</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
            <FolderArchive className="w-3.5 h-3.5 text-[var(--accent-peach)]" />
            <span>Cloud: <strong className="text-[var(--text-primary)] font-bold">{driveFiles.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Segmented Controller Tab Bar */}
      <div className="p-1.5 rounded-2xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex items-center space-x-1.5 shadow-inner">
        <button
          onClick={() => setActiveTab('gdrive')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'gdrive'
              ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
          }`}
        >
          <GoogleIcon className="w-4 h-4" />
          <span>Google Drive Master Pool</span>
          {driveUser && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'github'
              ? 'bg-[var(--accent-coral)] text-white dark:text-[#261619] shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
          }`}
        >
          <GithubIcon className="w-4 h-4" />
          <span>GitHub Gist Backup</span>
          {githubUser && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
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
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--border-color)] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <GoogleIcon className="w-5 h-5" />
                <h4 className="font-bold text-[var(--text-primary)] text-sm font-heading">Google Drive Master Pool</h4>
                <button
                  onClick={passcodeVerified ? handleLockMasterPool : () => setPasscodeModalOpen(true)}
                  title={passcodeVerified ? "Click to lock Master Pool" : "Click to unlock Master Pool with Passcode"}
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono flex items-center gap-1 transition cursor-pointer border ${
                    passcodeVerified
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-rose-950/40 hover:border-rose-500/40 hover:text-rose-300'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                  }`}
                >
                  {passcodeVerified ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                  <span>{passcodeVerified ? 'Unlocked' : 'Locked'}</span>
                </button>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)]">
                  <div className="space-y-0.5">
                    <div className="font-bold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Signed in as {driveUser.email}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      EduKatalyst identity verified. {driveToken ? 'Google Drive upload permission granted.' : 'Google Drive API access token required for file uploads.'}
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

                {!driveToken && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3 text-left">
                    <div className="flex items-start space-x-2.5">
                      <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-amber-300 text-xs font-heading">Google Drive Upload Access Token Required</h5>
                        <p className="text-[11px] text-amber-200/80 leading-relaxed">
                          Google Identity Sign-In verified your account profile. To upload videos and backup packages to Google Drive, paste a 1-click Access Token below:
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <a
                        href="https://developers.google.com/oauthplayground/#step1&scopes=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>🔗 Get 1-Click Token</span>
                      </a>

                      <div className="flex space-x-2 flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Paste ya29... token here"
                          value={driveToken}
                          onChange={(e) => setDriveToken(e.target.value)}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition"
                        />
                        <button
                          onClick={handleSaveDriveToken}
                          disabled={isVerifyingDrive || !driveToken}
                          className="px-3.5 py-2 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold text-xs flex items-center space-x-1 transition shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isVerifyingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>Verify</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 py-2 text-center flex flex-col items-center justify-center">
                <p className="text-[11px] text-[var(--text-muted)] max-w-sm leading-relaxed">
                  Sign in with your Google account to back up and publish video lectures, study materials, and quizzes.
                </p>

                <CleanGoogleSignInComponent
                  onSuccessCredential={(userInfo) => {
                    setDriveUser({
                      email: userInfo.email,
                      name: userInfo.name || userInfo.email,
                      picture: userInfo.picture || ''
                    });
                    setStatusMsg({
                      type: 'success',
                      text: `Signed in as ${userInfo.name || userInfo.email} (${userInfo.email})!`
                    });
                  }}
                  onError={(err) => {
                    setStatusMsg({ type: 'error', text: err.message });
                  }}
                />

                {/* 1-Click Drive Upload Authorization Token Box */}
                <div className="w-full pt-2 text-left">
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3 max-w-md mx-auto">
                    <div className="flex items-start space-x-2.5">
                      <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-amber-300 text-xs font-heading">Authorize Google Drive File Uploads</h5>
                        <p className="text-[11px] text-amber-200/80 leading-relaxed">
                          To grant write permissions for Google Drive file uploads on localhost, get a 1-click token below:
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <a
                        href="https://developers.google.com/oauthplayground/#step1&scopes=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>🔗 Get 1-Click Token</span>
                      </a>

                      <div className="flex space-x-2 flex-1 w-full">
                        <div className="relative flex-1">
                          <input
                            type={showDriveTokenPass ? "text" : "password"}
                            placeholder="Paste ya29... token here (Masked for Security)"
                            value={driveToken}
                            onChange={(e) => setDriveToken(e.target.value)}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl pl-3 pr-9 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDriveTokenPass(!showDriveTokenPass)}
                            className="absolute right-2.5 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
                            title={showDriveTokenPass ? "Hide Access Token" : "Show Access Token"}
                          >
                            {showDriveTokenPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <button
                          onClick={handleSaveDriveToken}
                          disabled={isVerifyingDrive || !driveToken}
                          className="px-3.5 py-2 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold text-xs flex items-center space-x-1 transition shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isVerifyingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>Verify</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3-Stage Publishing Architecture Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[var(--accent-coral)]/10 via-[var(--bg-surface)] to-[var(--bg-surface)] border border-[var(--border-color)] space-y-5 shadow-md">
            
            {/* Header & Flow Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--accent-coral)]/20 text-[var(--accent-coral)] text-[10px] font-mono font-bold border border-[var(--accent-coral)]/30">
                    STAGE 1 ➔ STAGE 2 ➔ STAGE 3
                  </span>
                  <h4 className="font-extrabold text-[var(--text-primary)] text-sm font-heading">
                    Master Cloud Sync & Website Publisher Pipeline
                  </h4>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Accumulate videos, notes, and quizzes in local storage pool ➔ Sync compressed master library to Google Drive ➔ Sync Drive content to live website.
                </p>
              </div>

              {/* Action Buttons for Stage 2 & Stage 3 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleUploadMasterZipToDrive}
                  disabled={isProcessing || sessions.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-coral)] text-white dark:text-[#261619] font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  title="Upload all accumulated local storage files to Google Drive Master Pool"
                >
                  <Upload className="w-4 h-4" />
                  <span>🚀 Sync Storage to Drive</span>
                </button>

                <button
                  onClick={handleSyncDriveToWebsite}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50 cursor-pointer"
                  title="Download and sync latest Google Drive master library to live website content"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>🌐 Sync Drive to Website</span>
                </button>
              </div>
            </div>

            {/* STAGE 1: Accumulated Local Storage Pool */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs font-heading text-[var(--text-primary)] flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[var(--accent-coral)]" />
                  <span>Stage 1: Accumulated Local Storage Pool ({sessions.length} items)</span>
                </h5>

                {/* Content Type Statistics Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[var(--bg-ground)] border border-[var(--border-color)] text-[10.5px] font-mono text-[var(--text-secondary)]">
                    📹 Videos: <strong className="text-[var(--accent-coral)]">{sessions.filter(s => !s.id.startsWith('note_') && !s.id.startsWith('quiz_')).length}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[var(--bg-ground)] border border-[var(--border-color)] text-[10.5px] font-mono text-[var(--text-secondary)]">
                    📝 Notes: <strong className="text-[var(--accent-peach)]">{sessions.filter(s => s.id.startsWith('note_')).length}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[var(--bg-ground)] border border-[var(--border-color)] text-[10.5px] font-mono text-[var(--text-secondary)]">
                    ❓ Quizzes: <strong className="text-emerald-400">{sessions.filter(s => s.id.startsWith('quiz_')).length}</strong>
                  </span>
                </div>
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
                    type={showGithubTokenPass ? "text" : "password"}
                    placeholder="ghp_... (Masked for Security)"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl pl-9 pr-10 py-2.5 text-[var(--text-primary)] font-mono placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGithubTokenPass(!showGithubTokenPass)}
                    className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
                    title={showGithubTokenPass ? "Hide GitHub Token" : "Show GitHub Token"}
                  >
                    {showGithubTokenPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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

      {/* 🔐 Master Creator Passcode Lock Modal */}
      {passcodeModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-4 relative text-left">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[var(--text-primary)] text-sm font-heading">Master Storage Security Lock</h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans">Enter Creator Passcode to publish to Master Drive Pool</p>
                </div>
              </div>
              <button
                onClick={() => setPasscodeModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-ground)] text-[var(--text-muted)] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPasscode} className="space-y-4 pt-1">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-[var(--text-secondary)] font-heading flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Master Creator Passcode</span>
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter Master Creator Passcode"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-full bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-coral)] transition"
                />
                {passcodeError ? (
                  <p className="text-[11px] text-rose-400 font-medium">{passcodeError}</p>
                ) : (
                  <p className="text-[10.5px] text-[var(--text-muted)]">
                    Enter your administrator passcode to grant upload access.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasscodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-ground)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--accent-coral)] hover:opacity-95 text-white dark:text-[#261619] font-extrabold text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
