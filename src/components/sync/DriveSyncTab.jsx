import React, { useState } from 'react';
import { HardDrive, Key, CheckCircle, AlertCircle, RefreshCw, Download, Trash2, LogOut, ShieldCheck, ExternalLink, Activity, HelpCircle, Zap } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleDriveSync } from '../../hooks/useGoogleDriveSync';
import { exportMasterStorageZip, importMasterStorageZip } from '../../utils/zipHelper';
import {
  getMasterDriveFolderId,
  setMasterDriveFolderId,
  getPublicApiKey,
  setPublicApiKey,
  getTokenEndpointUrl,
  setTokenEndpointUrl,
  getDriveFolderUrl,
  exchangeAuthCode,
  runDriveConnectionTest,
  forceExpireDriveToken,
  refreshAccessTokenViaServerless
} from '../../services/googleDriveService';

import backupService from '../../services/BackupService';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '119791404749-o4a3g19ps1sjvkgmcf9qj62ih9l5mcpp.apps.googleusercontent.com';
const OAUTH_PLAYGROUND_URL = 'https://developers.google.com/oauthplayground/#step1&scopes=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file';

export function DriveSyncTab({ onClose }) {
  const {
    driveToken,
    userInfo,
    driveFiles,
    isLoading,
    error,
    syncStatus,
    saveToken,
    disconnectDrive,
    loadDriveState,
    uploadBackup,
    downloadBackup,
    deleteBackup,
  } = useGoogleDriveSync();

  const [inputToken, setInputToken] = useState(driveToken);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [endpointInput, setEndpointInput] = useState(() => getTokenEndpointUrl());

  const [driveAuthStatus, setDriveAuthStatus] = useState('');
  const [driveAuthError, setDriveAuthError] = useState('');

  // Live Connection Testing State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showHelperModal, setShowHelperModal] = useState(false);

  // Google Drive Authorization Code Flow Handler (useGoogleLogin flow: 'auth-code')
  const requestDriveAccess = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: async (codeResponse) => {
      console.log('[Google] Drive Authorization Code received');
      setDriveAuthStatus('Authorization code received. Exchanging token...');
      setDriveAuthError('');

      if (codeResponse && codeResponse.code) {
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
          const tokenData = await exchangeAuthCode(codeResponse.code, origin);
          
          setDriveAuthStatus('Google Drive authorization successful');
          setDriveAuthError('');

          if (tokenData.access_token) {
            setInputToken(tokenData.access_token);
            saveToken(tokenData.access_token);
            await loadDriveState(tokenData.access_token);

            // Execute full 5-step E2E verification test:
            setIsTesting(true);
            const testRes = await runDriveConnectionTest(tokenData.access_token);
            setTestResult(testRes);
          }
        } catch (exchangeErr) {
          console.error('[Drive] Code exchange error:', exchangeErr.message);
          setDriveAuthStatus('');
          setDriveAuthError(`Token Exchange Error: ${exchangeErr.message}`);
        } finally {
          setIsTesting(false);
        }
      } else {
        setDriveAuthStatus('');
        setDriveAuthError('Google Drive authorization failed: No authorization code received');
      }
    },
    onError: (errorResponse) => {
      console.error('[GIS OAuth Error Raw Object]:', JSON.stringify(errorResponse, null, 2), errorResponse);
      setDriveAuthStatus('');
      const msg = errorResponse?.error_description || errorResponse?.error || 'OAuth authorization error';
      setDriveAuthError(`GIS OAuth Error [${errorResponse?.error || 'oauth_error'}]: ${msg}`);
    },
    onNonOAuthError: (nonOAuthError) => {
      console.error('[GIS NonOAuthError Raw Object]:', JSON.stringify(nonOAuthError, null, 2), nonOAuthError);
      console.error('[GIS NonOAuthError Type]:', nonOAuthError?.type);
      console.error('[GIS NonOAuthError Message]:', nonOAuthError?.message);

      const errType = nonOAuthError?.type || 'non_oauth_error';
      const msg = nonOAuthError?.message || errType;
      setDriveAuthStatus('');
      setDriveAuthError(`GIS non-OAuth error [${errType}]: ${msg}`);
    },
  });

  const handleAuthorizeClick = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    console.info(`[GoogleOAuth] Requesting Drive authorization code from origin: ${origin} with Client ID: ${CLIENT_ID}`);
    setDriveAuthError('');
    setDriveAuthStatus('');
    requestDriveAccess();
  };

  const handleFetchTokenFromApi = async () => {
    setDriveAuthError('');
    setDriveAuthStatus('Fetching access token from Google API endpoint...');
    setIsFetchingToken(true);

    try {
      const fetchedToken = await refreshAccessTokenViaServerless();
      if (fetchedToken) {
        setInputToken(fetchedToken);
        saveToken(fetchedToken);
        await loadDriveState(fetchedToken);
        setDriveAuthStatus('Access token successfully fetched from Google API endpoint!');
      } else {
        setDriveAuthError('Failed to fetch access token. Token endpoint unconfigured or session expired.');
      }
    } catch (err) {
      setDriveAuthError(`Fetch Token API Error: ${err.message}`);
    } finally {
      setIsFetchingToken(false);
    }
  };

  const handleManualTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await backupService.testConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({
        status: 'error',
        latencyMs: 0,
        mode: 'Connection Test Failed',
        details: err.message || 'Google Drive connection failed.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleForceExpireTest = async () => {
    forceExpireDriveToken();
    setDriveAuthStatus('Access token forcibly expired for dev test. Retrying Drive request...');
    setIsTesting(true);
    try {
      const refreshedToken = await refreshAccessTokenViaServerless();
      if (refreshedToken) {
        setInputToken(refreshedToken);
        setDriveAuthStatus('Token refresh successful via serverless endpoint!');
        const testRes = await runDriveConnectionTest(refreshedToken);
        setTestResult(testRes);
      } else {
        setDriveAuthError('Token refresh failed. Serverless endpoint unconfigured or session expired.');
      }
    } catch (err) {
      setDriveAuthError(`Token refresh error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveEndpointUrl = (e) => {
    e.preventDefault();
    setTokenEndpointUrl(endpointInput);
    setDriveAuthStatus(`Token endpoint updated: ${endpointInput || '(Default)'}`);
  };

  const handleManualSaveToken = async (e) => {
    e.preventDefault();
    saveToken(inputToken);
    await loadDriveState(inputToken);
  };

  const handleExportDriveBackup = async () => {
    setIsExporting(true);
    try {
      const zipBlob = await exportMasterStorageZip();
      const filename = `edukatalyst_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      await uploadBackup(zipBlob, filename);
    } catch (err) {
      console.error('[Drive] Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDriveFile = async (fileId) => {
    try {
      const zipBlob = await downloadBackup(fileId);
      await importMasterStorageZip(zipBlob);
      if (onClose) onClose();
    } catch (err) {
      console.error('[Drive] Import error:', err);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const activeEndpoint = getTokenEndpointUrl();

  return (
    <div className="space-y-6">
      {/* Action Toolbar & Test Runner */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 bg-[var(--accent-coral)] text-[var(--bg-ground)] font-bold text-xs rounded-xl shadow hover:opacity-90 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              <span>{isTesting ? 'Pinging Google Drive...' : 'Test Real Drive Connection'}</span>
            </button>

            <button
              onClick={handleForceExpireTest}
              disabled={isTesting || !driveToken}
              className="px-3 py-2 bg-[var(--bg-ground)] text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 disabled:opacity-40"
              title="Force token expiry to test serverless refresh"
            >
              <Zap className="w-4 h-4" />
              <span>Force Token Expiry (Dev Test)</span>
            </button>

            <button
              onClick={() => setShowHelperModal(!showHelperModal)}
              className="px-3 py-2 bg-[var(--bg-ground)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
            >
              <HelpCircle className="w-4 h-4 text-[var(--accent-peach)]" />
              <span>Serverless Endpoint Setup</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href={getDriveFolderUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-[var(--bg-ground)] text-[var(--text-primary)] hover:border-[var(--accent-peach)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold transition flex items-center space-x-1"
            >
              <HardDrive className="w-3.5 h-3.5 text-[var(--accent-peach)]" />
              <span>Open Google Drive</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>

        {/* Real Google Drive Verification Result Banner */}
        {testResult && (
          <div className={`p-4 rounded-xl border text-xs font-mono space-y-1.5 transition-all ${
            testResult.status === 'ok'
              ? 'bg-[var(--accent-sage)]/10 border-[var(--accent-sage)]/30 text-[var(--text-primary)]'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <div className="flex items-center justify-between font-bold text-sm">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Google Drive E2E Verification Test</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-ground)] border border-[var(--border-color)] text-[11px]">
                Latency: {testResult.latencyMs}ms
              </span>
            </div>
            <p className="text-[12px] opacity-90">{testResult.details}</p>
          </div>
        )}

        {showHelperModal && (
          <div className="p-4 rounded-xl bg-[var(--bg-ground)] border border-[var(--accent-peach)]/40 text-xs space-y-3 text-[var(--text-primary)] font-mono">
            <h5 className="font-bold text-sm text-[var(--accent-peach)]">Serverless Token Endpoint Configuration</h5>
            <p>GitHub Pages Host Origin: <code>{currentOrigin}</code></p>
            <p>Active Endpoint: <code className="text-[var(--accent-sage)]">{activeEndpoint || '(Not Configured - Set VITE_OAUTH_TOKEN_ENDPOINT)'}</code></p>
            
            <form onSubmit={handleSaveEndpointUrl} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="https://your-serverless-app.vercel.app/api/token"
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-xs"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[var(--accent-coral)] text-[var(--bg-ground)] font-bold rounded-lg text-xs hover:opacity-90"
              >
                Save Endpoint
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Single Google Drive Authorization UI */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-coral)]/15 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-heading text-[var(--text-primary)]">Google Drive Storage Connection</h4>
              <p className="text-xs text-[var(--text-muted)]">
                {userInfo
                  ? `Connected to ${userInfo.email}`
                  : 'Authorize EduKatalyst to store courses, notes, and backup archives in Google Drive.'}
              </p>
            </div>
          </div>
          {userInfo && (
            <span className="px-2.5 py-1 rounded-full bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] border border-[var(--accent-sage)]/30 text-[10px] font-mono font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Drive Active
            </span>
          )}
        </div>

        {userInfo ? (
          <div className="p-4 rounded-xl bg-[var(--bg-ground)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {userInfo.picture ? (
                <img src={userInfo.picture} alt="Profile" className="w-9 h-9 rounded-full border border-[var(--border-color)]" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--accent-coral)]/20 text-[var(--accent-coral)] font-bold flex items-center justify-center text-xs">
                  {userInfo.email.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h5 className="text-xs font-bold text-[var(--text-primary)]">{userInfo.name || 'Authorized Creator'}</h5>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{userInfo.email}</p>
              </div>
            </div>

            <button
              onClick={disconnectDrive}
              className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleAuthorizeClick}
              disabled={isLoading}
              className="w-full py-3 bg-[var(--accent-coral)] hover:opacity-90 text-[var(--bg-ground)] font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Connect Google Drive</span>
            </button>

            <form onSubmit={handleManualSaveToken} className="flex gap-2">
              <div className="relative flex-1">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                <input
                  type="password"
                  placeholder="Or paste Access Token manually (ya29...)"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--bg-ground)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-coral)] font-mono"
                />
              </div>

              <a
                href={OAUTH_PLAYGROUND_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[var(--accent-peach)]/15 text-[var(--accent-peach)] hover:bg-[var(--accent-peach)]/25 border border-[var(--accent-peach)]/30 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shrink-0"
                title="Open Google OAuth Playground in a new tab to get a fresh access token link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Get Token Link</span>
              </a>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[var(--bg-ground)] text-[var(--text-primary)] font-bold text-xs rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition flex items-center space-x-1 disabled:opacity-50 shrink-0"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Connect'}
              </button>
            </form>
          </div>
        )}

        {driveAuthStatus && (
          <div className="p-3 rounded-xl bg-[var(--accent-sage)]/10 border border-[var(--accent-sage)]/30 text-xs text-[var(--accent-sage)] font-bold flex items-center gap-2 font-mono">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{driveAuthStatus}</span>
          </div>
        )}

        {driveAuthError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-mono space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Google Drive Authorization Error</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90 pl-6">{driveAuthError}</p>
            <div className="pt-1.5 pl-6 text-[10px] text-[var(--text-muted)] border-t border-rose-500/20">
              Origin: <code>{currentOrigin}</code> | Client ID: <code>{CLIENT_ID.slice(0, 24)}...</code>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {syncStatus && (
          <p className="text-xs text-[#D49A6A] font-mono">{syncStatus}</p>
        )}
      </div>

      {/* Backup Packages */}
      {driveToken && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-[#A0AAB2] uppercase tracking-wider">Master Drive Published Packages</h4>
            <button
              onClick={handleExportDriveBackup}
              disabled={isExporting || isLoading}
              className="px-3 py-1.5 bg-[#C8795A] text-white font-bold text-xs rounded-xl hover:bg-[#b56b4f] transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
              <span>Publish Backup Package</span>
            </button>
          </div>

          {driveFiles.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-[#343842] text-center text-xs text-[#A0AAB2]">
              No backup packages found in Google Drive folder "EduKatalyst Storage".
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3 rounded-xl bg-[#15171B] border border-[#343842] flex items-center justify-between hover:border-[#6EB88F]/40 transition"
                >
                  <div>
                    <h5 className="text-xs font-bold text-[#E4E6EB]">{file.name}</h5>
                    <p className="text-[10px] text-[#A0AAB2] font-mono">
                      {new Date(file.createdTime).toLocaleDateString()} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleImportDriveFile(file.id)}
                      disabled={isLoading}
                      className="p-1.5 bg-[#6EB88F]/10 text-[#6EB88F] rounded-lg hover:bg-[#6EB88F]/20 transition"
                      title="Restore from Drive"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBackup(file.id)}
                      disabled={isLoading}
                      className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition"
                      title="Delete Backup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
