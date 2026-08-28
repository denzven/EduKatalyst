/**
 * Security & Password Authentication Helper
 * Uses Web Crypto API (SHA-256 + Salt) to verify Admin / Creator password.
 */

const DEFAULT_PASSWORD = 'Test123';
const SALT = 'dzvn_edutech_salt_2026';
const SESSION_STORAGE_KEY = 'dzvn_creator_authenticated';

/**
 * Helper to compute SHA-256 hex string using browser Web Crypto API
 */
export async function computeHash(text) {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify input password against salted hash
 */
export async function verifyPassword(inputPassword) {
  if (!inputPassword) return false;
  // Compute salted SHA-256 for input
  const inputHash = await computeHash(`${SALT}:${inputPassword.trim()}`);
  // Compute salted SHA-256 for target default password
  const expectedHash = await computeHash(`${SALT}:${DEFAULT_PASSWORD}`);
  
  return inputHash === expectedHash;
}

/**
 * Check if current user is logged in as creator
 */
export function isCreatorAuthenticated() {
  return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
}

/**
 * Save authentication state to session storage
 */
export function setCreatorAuthenticated(isAuth) {
  if (isAuth) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
