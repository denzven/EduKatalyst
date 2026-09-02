import { useState, useEffect, useCallback } from 'react';
import {
  getStoredDriveToken,
  setStoredDriveToken,
  validateDriveToken
} from '../services/googleDriveService';
import backupService from '../services/BackupService';

export function useGoogleDriveSync() {
  const [driveToken, setDriveTokenState] = useState(() => getStoredDriveToken());
  const [userInfo, setUserInfo] = useState(null);
  const [driveFiles, setDriveFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');

  const saveToken = useCallback((token) => {
    setStoredDriveToken(token);
    const cleanToken = getStoredDriveToken();
    setDriveTokenState(cleanToken);
  }, []);


  const disconnectDrive = useCallback(() => {
    setStoredDriveToken('');
    setDriveTokenState('');
    setUserInfo(null);
    setDriveFiles([]);
    setError(null);
    setSyncStatus('Disconnected from Google Drive.');
  }, []);


  const loadDriveState = useCallback(async (tokenToUse) => {
    const token = tokenToUse !== undefined ? tokenToUse : driveToken;
    if (!token) {
      setUserInfo(null);
      setDriveFiles([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const info = await validateDriveToken(token);
      setUserInfo(info);
      const files = await backupService.listBackups();
      setDriveFiles(files);
    } catch (err) {
      console.warn('[useGoogleDriveSync] Drive validation notice:', err);
      setError(err.message || 'Failed to authenticate Google Drive token');
      setUserInfo(null);
      setDriveFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [driveToken]);

  useEffect(() => {
    loadDriveState();
  }, [loadDriveState]);

  const uploadBackup = useCallback(async (fileBlob, filename) => {
    setIsLoading(true);
    setSyncStatus('Uploading package to Google Drive...');
    setError(null);
    try {
      const result = await backupService.exportBackup(fileBlob, filename);
      setSyncStatus('Upload complete!');
      await loadDriveState();
      return result;
    } catch (err) {
      setError(err.message || 'Failed to upload backup to Google Drive');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadDriveState]);

  const downloadBackup = useCallback(async (fileId) => {
    setIsLoading(true);
    setSyncStatus('Downloading package from Google Drive...');
    setError(null);
    try {
      const blob = await backupService.downloadBackup(fileId);
      setSyncStatus('Download complete!');
      return blob;
    } catch (err) {
      setError(err.message || 'Failed to download backup package');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBackup = useCallback(async (fileId) => {
    setIsLoading(true);
    setError(null);
    try {
      await backupService.deleteBackup(fileId);
      await loadDriveState();
    } catch (err) {
      setError(err.message || 'Failed to delete backup package');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadDriveState]);

  return {
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
  };
}

