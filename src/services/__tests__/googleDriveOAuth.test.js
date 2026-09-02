import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateDriveToken,
  getStoredDriveToken,
  setStoredDriveToken,
  clearStoredDriveToken,
  getPublicApiKey,
  setPublicApiKey,
  getMasterDriveFolderId,
  setMasterDriveFolderId,
  exchangeAuthCode,
  runDriveConnectionTest,
  getDriveFolderUrl
} from '../googleDriveService';

describe('googleDrive Authorization Code Flow & Connection Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should exchange authorization code for access token via token endpoint', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'ya29.code_exchanged_token', expires_in: 3600 })
        });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });

    const result = await exchangeAuthCode('4/0A_test_code_123');
    expect(result.access_token).toBe('ya29.code_exchanged_token');
    expect(getStoredDriveToken()).toBe('ya29.code_exchanged_token');
  });

  it('should validate access token and return creator profile info', async () => {
    const mockTokenInfo = { email: 'creator@edukatalyst.io', expires_in: 3600, scope: 'drive.file' };
    const mockUserInfo = { email: 'creator@edukatalyst.io', name: 'Master Author', picture: 'https://example.com/avatar.png' };

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('tokeninfo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTokenInfo)
        });
      }
      if (url.includes('userinfo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserInfo)
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    const result = await validateDriveToken('ya29.valid_test_token');
    expect(result.email).toBe('creator@edukatalyst.io');
    expect(result.name).toBe('Master Author');
    expect(result.picture).toBe('https://example.com/avatar.png');
  });

  it('should clear token and throw connection expired error on 401 response', async () => {
    setStoredDriveToken('ya29.expired_token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    await expect(validateDriveToken('ya29.expired_token')).rejects.toThrow('Google Drive connection expired. Please connect Google Drive again.');
    expect(getStoredDriveToken()).toBe('');
  });

  it('should execute full 5-step E2E real connection test (upload, read, delete)', async () => {
    setStoredDriveToken('ya29.test_token_for_ping');

    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('upload/drive/v3/files')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 'test_file_456' }) });
      }
      if (url.includes('files/test_file_456')) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve('EduKatalyst Google Drive connection test') });
      }
      if (url.includes('files?')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ files: [{ id: 'folder_123' }] }) });
      }
      if (url.includes('tokeninfo')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ email: 'ping@edukatalyst.io', expires_in: 3500 }) });
      }
      if (url.includes('userinfo')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ email: 'ping@edukatalyst.io', name: 'Ping User' }) });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });

    const res = await runDriveConnectionTest('ya29.test_token_for_ping');
    expect(res.status).toBe('ok');
    expect(res.mode).toContain('OAuth Creator Account');
    expect(res.folderId).toBe('folder_123');
    expect(res.testFileId).toBe('test_file_456');
    expect(res.details).toContain('EduKatalyst Storage');
    expect(res.details).toContain('Uploaded, Verified, & Deleted Successfully');
  });

  it('should return correct Google Drive links', () => {
    setMasterDriveFolderId('1A2b3C_Folder_XYZ');
    expect(getDriveFolderUrl()).toBe('https://drive.google.com/drive/folders/1A2b3C_Folder_XYZ');
  });
});
