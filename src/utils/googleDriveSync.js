/**
 * Clean & Production-Grade Google Drive Integration Utility
 * Powered by official @react-oauth/google & Google Drive API v3
 */

const DRIVE_TOKEN_KEY = 'katalyst_drive_access_token';
const CLIENT_ID_KEY = 'katalyst_google_client_id';
const PUBLIC_FOLDER_KEY = 'katalyst_public_drive_folder_id';
const FOLDER_NAME = 'EduKatalyst Storage';

export const DEFAULT_MASTER_ACCESS_TOKEN = import.meta.env.VITE_MASTER_GOOGLE_DRIVE_TOKEN || '';
export const DEFAULT_MASTER_REFRESH_TOKEN = import.meta.env.VITE_MASTER_REFRESH_TOKEN || '';

/**
 * Safely mask sensitive token string for UI & logging
 */
export function maskTokenString(token) {
  if (!token || typeof token !== 'string') return '';
  if (token.length <= 12) return '••••••••';
  return `${token.slice(0, 8)}••••••••${token.slice(-4)}`;
}

/**
 * Get stored Access Token (or environment variable fallback)
 */
export function getStoredDriveToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(DRIVE_TOKEN_KEY) || DEFAULT_MASTER_ACCESS_TOKEN;
}

/**
 * Auto-extract OAuth access token from URL hash or query string
 */
export function checkAndExtractOAuthHashToken() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || window.location.search;
  if (!hash) return null;

  const match = hash.match(/(?:access_token|token)=([^&]+)/);
  if (match && match[1]) {
    const token = decodeURIComponent(match[1]);
    setStoredDriveToken(token);
    // Clean URL hash
    window.history.replaceState(null, '', window.location.pathname);
    return token;
  }
  return null;
}

/**
 * Save or remove Access Token
 */
export function setStoredDriveToken(token) {
  if (!token) {
    localStorage.removeItem(DRIVE_TOKEN_KEY);
    return;
  }
  let tokenStr = String(token).trim();
  if (tokenStr.startsWith('{') && tokenStr.includes('access_token')) {
    try {
      const parsed = JSON.parse(tokenStr);
      if (parsed.access_token) tokenStr = parsed.access_token.trim();
    } catch {
      // Ignore JSON parse error
    }
  }
  localStorage.setItem(DRIVE_TOKEN_KEY, tokenStr);
}

/**
 * Get stored Google Client ID
 */
export function getStoredClientId() {
  if (typeof window === 'undefined') return DEFAULT_CLIENT_ID;
  return localStorage.getItem(CLIENT_ID_KEY) || DEFAULT_CLIENT_ID;
}

/**
 * Save Google Client ID
 */
export function setStoredClientId(clientId) {
  if (clientId) {
    localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
  } else {
    localStorage.removeItem(CLIENT_ID_KEY);
  }
}

/**
 * Get stored Public Drive Folder ID
 */
export function getStoredPublicFolderId() {
  return localStorage.getItem(PUBLIC_FOLDER_KEY) || import.meta.env.VITE_MASTER_GOOGLE_FOLDER_ID || '';
}

/**
 * Save Public Drive Folder ID
 */
export function setStoredPublicFolderId(folderId) {
  if (folderId) {
    localStorage.setItem(PUBLIC_FOLDER_KEY, folderId.trim());
  } else {
    localStorage.removeItem(PUBLIC_FOLDER_KEY);
  }
}

/**
 * Auto-resolve Refresh Token (1//0...) to a fresh Access Token (ya29...) if needed
 */
export async function resolveDriveAccessToken(inputToken) {
  let token = (inputToken || getStoredDriveToken()).trim();
  if (!token) throw new Error('Google Drive token required.');

  // If token is a Refresh Token (starts with 1//0...)
  if (token.startsWith('1//0') || token.includes('refresh_token')) {
    try {
      const clientId = getStoredClientId();
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: 'refresh_token',
          refresh_token: token,
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        return data.access_token;
      }
    } catch (err) {
      console.warn('Failed to resolve refresh token:', err);
    }
    return DEFAULT_MASTER_ACCESS_TOKEN;
  }

  return token;
}

/**
 * Validate token and fetch Google user email
 */
export async function validateDriveToken(accessToken) {
  let token = await resolveDriveAccessToken(accessToken);

  // Check tokeninfo
  let res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
  
  if (!res.ok && DEFAULT_MASTER_REFRESH_TOKEN) {
    try {
      const refreshedToken = await resolveDriveAccessToken(DEFAULT_MASTER_REFRESH_TOKEN);
      if (refreshedToken) {
        token = refreshedToken;
        setStoredDriveToken(refreshedToken);
        res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(refreshedToken)}`);
      }
    } catch {
      // Ignore refresh fallback error
    }
  }

  if (!res.ok) {
    setStoredDriveToken('');
    throw new Error('Google token expired or invalid. Paste your fresh Access Token (ya29...) below!');
  }

  const data = await res.json();
  let email = data.email || '';

  if (!email) {
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        email = userInfo.email || userInfo.name || 'Google User';
      }
    } catch {
      // Ignore userinfo fetch error
    }
  }

  return {
    email: email || 'Authorized Google Account',
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/**
 * Ensure "EduKatalyst Storage" folder exists in Google Drive
 */
export async function ensureDriveAppFolder(token) {
  const accessToken = await resolveDriveAccessToken(token);

  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errData = await searchRes.json().catch(() => ({}));
    const detailMsg = errData.error?.message || errData.error_description || searchRes.statusText;
    throw new Error(`Google Drive API Error (${searchRes.status}): ${detailMsg}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(`Failed to create Google Drive folder: ${errData.error?.message || createRes.statusText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Upload File Blob to Google Drive
 */
export async function uploadZipToDrive(fileBlob, filename, token) {
  const accessToken = await resolveDriveAccessToken(token);
  const folderId = await ensureDriveAppFolder(accessToken);

  const metadata = {
    name: filename,
    parents: [folderId],
    description: 'EduKatalyst Backup Package',
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', fileBlob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Upload to Drive failed: ${err.error?.message || response.statusText}`);
  }

  return await response.json();
}

/**
 * List files in EduKatalyst Google Drive folder
 */
export async function listDriveBackups(token) {
  let accessToken = '';
  try {
    accessToken = await resolveDriveAccessToken(token);
  } catch {
    return [];
  }
  if (!accessToken) return [];

  const folderId = await ensureDriveAppFolder(accessToken);
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,size)&orderBy=createdTime desc`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`List Drive Backups Failed: ${errData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Download file from Google Drive
 */
export async function downloadFromDrive(fileId, token) {
  let accessToken = '';
  try {
    accessToken = await resolveDriveAccessToken(token);
  } catch {
    return await fetchPublicDriveFile(fileId, 'blob');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Download from Drive Failed: ${errData.error?.message || response.statusText}`);
  }

  return await response.blob();
}

const LEDGER_FILENAME = 'edukatalyst_master_ledger.json';

/**
 * Fetch the Master Sync Ledgerbook from Google Drive
 */
export async function fetchMasterLedger(token) {
  let accessToken = '';
  try {
    accessToken = await resolveDriveAccessToken(token);
  } catch {
    return null;
  }
  if (!accessToken) return null;

  try {
    const files = await listDriveBackups(accessToken);
    const ledgerFile = files.find(f => f.name === LEDGER_FILENAME);
    if (!ledgerFile) return null;

    const blob = await downloadFromDrive(ledgerFile.id, accessToken);
    const text = await blob.text();
    return JSON.parse(text);
  } catch (err) {
    console.warn('Failed to fetch Master Ledgerbook from Drive:', err);
    return null;
  }
}

/**
 * Create or update the Master Sync Ledgerbook on Google Drive
 */
export async function updateMasterLedger(ledgerData, token) {
  let accessToken = '';
  try {
    accessToken = await resolveDriveAccessToken(token);
  } catch {
    return null;
  }
  if (!accessToken) return null;

  try {
    const payload = JSON.stringify({
      app: 'EduKatalyst Master Storage Pool',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      ...ledgerData
    }, null, 2);

    const blob = new Blob([payload], { type: 'application/json' });
    const uploadedFile = await uploadZipToDrive(blob, LEDGER_FILENAME, accessToken);
    return uploadedFile;
  } catch (err) {
    console.warn('Failed to update Master Ledgerbook on Drive:', err);
    return null;
  }
}

/**
 * Unauthenticated public file fetch helper
 */
export async function fetchPublicDriveFile(fileId, responseType = 'text') {
  const url = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch public Google Drive file (HTTP ${response.status})`);
  }
  if (responseType === 'blob') return await response.blob();
  if (responseType === 'json') return await response.json();
  return await response.text();
}
