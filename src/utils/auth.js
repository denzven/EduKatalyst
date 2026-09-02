/**
 * Security & Password Authentication Helper
 * Uses Web Crypto API (SHA-256 + Salt) to verify Creator Studio local UI unlock passcode.
 * 
 * IMPORTANT SECURITY BOUNDARY:
 * Local passcode verification controls local browser UI state only.
 * It MUST NOT be treated as authorization for privileged cloud operations or server storage.
 * Master cloud publishing is secured via GitHub Actions Secrets or user-owned OAuth 2.0 PKCE.
 */

const SALT = 'dzvn_edutech_salt_2026';
const SESSION_STORAGE_KEY = 'dzvn_creator_authenticated';

/**
 * Helper to compute SHA-256 hex string using browser Web Crypto API
 */
export async function computeHash(text) {
  try {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('[Auth] Failed to compute hash:', error);
    throw error;
  }
}

/**
 * Verify input password against expected salted hash.
 * Passcode can be set via custom environment or local config.
 */
export async function verifyPassword(inputPassword, expectedPassword = 'Test123') {
  if (!inputPassword) return false;
  try {
    const inputHash = await computeHash(`${SALT}:${inputPassword.trim()}`);
    const expectedHash = await computeHash(`${SALT}:${expectedPassword}`);
    
    const isValid = inputHash === expectedHash;
    console.info(`[Auth] Creator UI unlock attempt: ${isValid ? 'Success' : 'Failed'}`);
    return isValid;
  } catch (error) {
    console.error('[Auth] Error during password verification:', error);
    return false;
  }
}

/**
 * Check if current user is unlocked in creator UI mode
 */
export function isCreatorAuthenticated() {
  return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
}

/**
 * Save UI authentication state to session storage
 */
export function setCreatorAuthenticated(isAuth) {
  if (isAuth) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    console.info('[Auth] Creator UI session unlocked');
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    console.info('[Auth] Creator UI session locked');
  }
}

