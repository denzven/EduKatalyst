import { describe, it, expect, beforeEach } from 'vitest';
import {
  maskTokenString,
  getStoredDriveToken,
  setStoredDriveToken,
  getMasterDriveFolderId,
  setMasterDriveFolderId,
  getPublicApiKey,
  setPublicApiKey
} from '../googleDriveService';

describe('googleDriveService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should mask sensitive Google OAuth token strings correctly', () => {
    expect(maskTokenString('')).toBe('');
    expect(maskTokenString('ya29.a0AxM351234567890abcdef')).toBe('ya29.a0A••••••••cdef');
  });

  it('should save and clear stored drive tokens', () => {
    setStoredDriveToken('ya29.sample_token_123');
    expect(getStoredDriveToken()).toBe('ya29.sample_token_123');

    setStoredDriveToken('');
    expect(getStoredDriveToken()).toBe('');
  });

  it('should save and clear Master Drive CDN folder ID', () => {
    setMasterDriveFolderId('1A2b3C4d5E6f7G8h9I0j');
    expect(getMasterDriveFolderId()).toBe('1A2b3C4d5E6f7G8h9I0j');

    setMasterDriveFolderId('');
    expect(getMasterDriveFolderId()).toBe('');
  });

  it('should save and clear Public Google API Key for 24/7 CDN streaming', () => {
    setPublicApiKey('AIzaSySampleApiKey123456');
    expect(getPublicApiKey()).toBe('AIzaSySampleApiKey123456');

    setPublicApiKey('');
    expect(getPublicApiKey()).toBe('');
  });
});
