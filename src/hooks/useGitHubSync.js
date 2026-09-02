import { useState, useEffect, useCallback } from 'react';
import {
  getStoredGitHubToken,
  setStoredGitHubToken,
  validateGitHubToken,
  exportToGitHubGist,
  importFromGitHubGist,
  listUserGists
} from '../services/githubService';

export function useGitHubSync() {
  const [githubToken, setGithubTokenState] = useState(() => getStoredGitHubToken());
  const [userInfo, setUserInfo] = useState(null);
  const [gists, setGists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const saveToken = useCallback((token) => {
    setStoredGitHubToken(token);
    setGithubTokenState(token ? token.trim() : '');
  }, []);

  const loadGitHubState = useCallback(async (tokenToUse) => {
    const token = tokenToUse !== undefined ? tokenToUse : githubToken;
    if (!token) {
      setUserInfo(null);
      setGists([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const info = await validateGitHubToken(token);
      setUserInfo(info);
      const list = await listUserGists();
      setGists(list);
    } catch (err) {
      console.warn('[useGitHubSync] GitHub validation notice:', err);
      setError(err.message || 'Failed to authenticate GitHub token');
      setUserInfo(null);
      setGists([]);
    } finally {
      setIsLoading(false);
    }
  }, [githubToken]);

  useEffect(() => {
    loadGitHubState();
  }, [loadGitHubState]);

  const exportGist = useCallback(async (data, isPublic = false, description = '') => {
    setIsLoading(true);
    setStatusMessage('Creating GitHub Gist backup...');
    setError(null);
    try {
      const gist = await exportToGitHubGist(data, isPublic, description);
      setStatusMessage('Gist created successfully!');
      await loadGitHubState();
      return gist;
    } catch (err) {
      setError(err.message || 'Failed to export Gist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadGitHubState]);

  const importGist = useCallback(async (gistIdOrUrl) => {
    setIsLoading(true);
    setStatusMessage('Fetching metadata from GitHub Gist...');
    setError(null);
    try {
      const data = await importFromGitHubGist(gistIdOrUrl);
      setStatusMessage('Gist metadata fetched!');
      return data;
    } catch (err) {
      setError(err.message || 'Failed to import Gist metadata');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
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
  };
}
