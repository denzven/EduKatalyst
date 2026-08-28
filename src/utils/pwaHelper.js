/**
 * Progressive Web App (PWA) & Offline Utility
 * Intercepts beforeinstallprompt, tracks online/offline network state,
 * and manages Service Worker registrations.
 */

let deferredInstallPrompt = null;
const installListeners = new Set();
const onlineListeners = new Set();

// Initialize PWA event listeners
export function initPWA() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    notifyInstallListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyInstallListeners();
  });

  window.addEventListener('online', () => {
    notifyOnlineListeners(true);
  });

  window.addEventListener('offline', () => {
    notifyOnlineListeners(false);
  });
}

function notifyInstallListeners() {
  const canInstall = !!deferredInstallPrompt;
  installListeners.forEach(cb => cb(canInstall));
}

function notifyOnlineListeners(isOnline) {
  onlineListeners.forEach(cb => cb(isOnline));
}

export function subscribeToInstallPrompt(callback) {
  installListeners.add(callback);
  callback(!!deferredInstallPrompt);
  return () => installListeners.delete(callback);
}

export function subscribeToOnlineStatus(callback) {
  onlineListeners.add(callback);
  callback(navigator.onLine);
  return () => onlineListeners.delete(callback);
}

export async function triggerPWAInstall() {
  if (!deferredInstallPrompt) {
    throw new Error('PWA Installation prompt is not available on this browser or platform.');
  }

  deferredInstallPrompt.prompt();
  const choiceResult = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  notifyInstallListeners();

  return choiceResult.outcome === 'accepted';
}

export function isAppInstalled() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isOnline() {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}
