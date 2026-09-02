import { describe, it, expect, beforeEach } from 'vitest';
import { computeHash, verifyPassword, isCreatorAuthenticated, setCreatorAuthenticated } from '../auth';

describe('auth utility', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should compute SHA-256 hash using Web Crypto API', async () => {
    const hash = await computeHash('test_string');
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // SHA-256 hex length
  });

  it('should verify correct passcode', async () => {
    const isValid = await verifyPassword('Test123', 'Test123');
    expect(isValid).toBe(true);
  });

  it('should reject incorrect passcode', async () => {
    const isValid = await verifyPassword('WrongPassword', 'Test123');
    expect(isValid).toBe(false);
  });

  it('should manage creator UI authentication in sessionStorage', () => {
    expect(isCreatorAuthenticated()).toBe(false);

    setCreatorAuthenticated(true);
    expect(isCreatorAuthenticated()).toBe(true);

    setCreatorAuthenticated(false);
    expect(isCreatorAuthenticated()).toBe(false);
  });
});
