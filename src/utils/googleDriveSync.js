/**
 * Google Drive Integration Utility
 * Handles Google Drive API v3, Public Drive Folder fetching, Automatic Refresh Tokens, and Direct OAuth 2.0.
 */

const DRIVE_TOKEN_KEY = 'katalyst_drive_access_token';
const REFRESH_TOKEN_KEY = 'katalyst_drive_refresh_token';
const PUBLIC_FOLDER_KEY = 'katalyst_public_drive_folder_id';
const CLIENT_ID_KEY = 'katalyst_google_client_id';
const FOLDER_NAME = 'EduKatalyst Storage';

// Master Google Drive OAuth Credentials loaded securely from environment variables (.env / .env.local)
const DEFAULT_MASTER_TOKEN = import.meta.env.VITE_MASTER_GOOGLE_DRIVE_TOKEN || '';
const DEFAULT_MASTER_REFRESH_TOKEN = import.meta.env.VITE_MASTER_GOOGLE_REFRESH_TOKEN || '';
const DEFAULT_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '119791404749-o4a3g19ps1sjvkgmcf9qj62ih9l5mcpp.apps.googleusercontent.com';

/**
 * Automatically detect & extract Google OAuth Access Token from URL hash (#access_token=...) on app boot
 */
export function checkAndExtractOAuthHashToken() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  if (hash.includes('access_token=')) {
    try {
      const hashContent = hash.substring(hash.indexOf('access_token='));
      const params = new URLSearchParams(hashContent);
      const token = params.get('access_token');
      if (token) {
        setStoredDriveToken(token);
        // Clean URL back to standard app route
        window.history.replaceState(null, '', window.location.pathname + '#/studio');
        return token;
      }
    } catch {
      // Ignore hash parse errors
    }
  }
  return null;
}

/**
 * Retrieve stored Google OAuth Access Token (or Master Token Fallback)
 */
export function getStoredDriveToken() {
  // Check hash first on app load
  const hashToken = checkAndExtractOAuthHashToken();
  if (hashToken) return hashToken;

  const userToken = localStorage.getItem(DRIVE_TOKEN_KEY);
  if (userToken) return userToken;

  // Fallback to central Master Platform Google Account token
  return import.meta.env.VITE_MASTER_GOOGLE_DRIVE_TOKEN || DEFAULT_MASTER_TOKEN;
}

/**
 * Save or clear Google OAuth Access Token (Supports raw tokens or full Google JSON payloads)
 */
export function setStoredDriveToken(tokenOrJson) {
  if (!tokenOrJson) {
    localStorage.removeItem(DRIVE_TOKEN_KEY);
    return;
  }

  let tokenStr = String(tokenOrJson).trim();

  // Handle full pasted JSON response from Google OAuth Playground
  if (tokenStr.startsWith('{') && tokenStr.includes('access_token')) {
    try {
      const parsed = JSON.parse(tokenStr);
      if (parsed.access_token) {
        tokenStr = parsed.access_token.trim();
      }
      if (parsed.refresh_token) {
        setStoredRefreshToken(parsed.refresh_token);
      }
    } catch {
      // Ignore JSON parse failure
    }
  }

  localStorage.setItem(DRIVE_TOKEN_KEY, tokenStr);
}

/**
 * Retrieve stored Google Refresh Token
 */
export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || import.meta.env.VITE_MASTER_GOOGLE_REFRESH_TOKEN || DEFAULT_MASTER_REFRESH_TOKEN;
}

/**
 * Save or clear Google Refresh Token
 */
export function setStoredRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * Retrieve stored Public Master Google Drive Folder ID
 */
export function getStoredPublicFolderId() {
  return localStorage.getItem(PUBLIC_FOLDER_KEY) || import.meta.env.VITE_MASTER_GOOGLE_FOLDER_ID || '';
}

/**
 * Save Public Master Google Drive Folder ID
 */
export function setStoredPublicFolderId(folderId) {
  if (folderId) {
    localStorage.setItem(PUBLIC_FOLDER_KEY, folderId.trim());
  } else {
    localStorage.removeItem(PUBLIC_FOLDER_KEY);
  }
}

/**
 * Retrieve stored Google Client ID
 */
export function getStoredClientId() {
  const stored = localStorage.getItem(CLIENT_ID_KEY);
  if (!stored || stored.includes('982845620958')) {
    return DEFAULT_CLIENT_ID;
  }
  return stored;
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
 * Build direct public download URL for any Google Drive file (NO SIGN-IN REQUIRED)
 */
export function getPublicDriveFileUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

/**
 * Fetch public file content from Google Drive without any authentication (NO SIGN-IN REQUIRED)
 */
export async function fetchPublicDriveFile(fileId, responseType = 'text') {
  const url = getPublicDriveFileUrl(fileId);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch public Google Drive file (HTTP ${response.status})`);
  }
  if (responseType === 'blob') return await response.blob();
  if (responseType === 'json') return await response.json();
  return await response.text();
}

/**
 * Automatically refresh an expired access token in the background using a stored refresh token
 */
export async function refreshAccessTokenInBackground() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available.');

  const targetClientId = '407408718192.apps.googleusercontent.com'; // OAuth Playground client ID fallback

  const params = new URLSearchParams();
  params.append('client_id', targetClientId);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  let res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!res.ok) {
    const fallbackParams = new URLSearchParams();
    fallbackParams.append('client_id', getStoredClientId());
    fallbackParams.append('grant_type', 'refresh_token');
    fallbackParams.append('refresh_token', refreshToken);

    res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: fallbackParams,
    });
  }

  if (!res.ok) throw new Error('Background token refresh failed.');
  const data = await res.json();
  if (data.access_token) {
    setStoredDriveToken(data.access_token);
    return data.access_token;
  }
  throw new Error('No access token returned.');
}

/**
 * Exchange OAuth Playground Authorization Code (starts with 4/0A...) for Access Token & Refresh Token
 */
export async function exchangeAuthCodeForToken(authCode, customClientId = '') {
  const code = authCode.trim();
  const targetClientId = '407408718192.apps.googleusercontent.com'; // OAuth Playground client ID

  const params = new URLSearchParams();
  params.append('code', code);
  params.append('client_id', targetClientId);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', 'https://developers.google.com/oauthplayground');

  let data = null;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!res.ok) {
    // Retry with custom client ID if Playground default ID fails
    const fallbackParams = new URLSearchParams();
    fallbackParams.append('code', code);
    fallbackParams.append('client_id', customClientId || getStoredClientId());
    fallbackParams.append('grant_type', 'authorization_code');
    fallbackParams.append('redirect_uri', 'https://developers.google.com/oauthplayground');

    const fallbackRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: fallbackParams,
    });

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json().catch(() => ({}));
      throw new Error(`Auth Code Exchange Failed: ${err.error_description || err.error || fallbackRes.statusText}`);
    }
    data = await fallbackRes.json();
  } else {
    data = await res.json();
  }

  if (data.access_token) {
    setStoredDriveToken(data.access_token);
    if (data.refresh_token) {
      setStoredRefreshToken(data.refresh_token);
    }
    return data.access_token;
  }
  throw new Error('No access token returned from code exchange.');
}

/**
 * Validate current Google Drive Access Token and retrieve account email (with background auto-refresh fallback)
 */
export async function validateDriveToken(accessToken) {
  let token = (accessToken || getStoredDriveToken()).trim();
  if (!token) {
    throw new Error('No Google Drive Access Token provided.');
  }

  // Handle full JSON payloads pasted by user
  if (token.startsWith('{') && token.includes('access_token')) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.access_token) token = parsed.access_token;
      if (parsed.refresh_token) setStoredRefreshToken(parsed.refresh_token);
    } catch {
      // Ignore JSON error
    }
  }

  // If user pasted an OAuth Playground Authorization Code (starts with 4/0A...), exchange it for Access Token
  if (token.startsWith('4/0A') || token.startsWith('4/0a') || token.startsWith('4/0t')) {
    try {
      token = await exchangeAuthCodeForToken(token);
    } catch (err) {
      console.warn('[EduKatalyst Code Exchange Warn]:', err);
    }
  }

  let response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
  
  // If access token is expired, attempt seamless background token refresh!
  if (!response.ok) {
    try {
      token = await refreshAccessTokenInBackground();
      response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
    } catch {
      // Background refresh failed
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error_description || errData.error || 'Invalid or expired Google Drive Access Token. Please sign in again.');
  }

  const data = await response.json();
  
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
      // Ignore userinfo error if scope restricted
    }
  }

  return {
    email: email || 'Authorized Account',
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/**
 * Load Google Identity Services SDK dynamically
 */
export function loadGoogleGsiScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(window.google.accounts.oauth2);
      return;
    }

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google?.accounts?.oauth2));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.accounts?.oauth2);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
    document.head.appendChild(script);
  });
}

/**
 * 100% Reliable Direct Google OAuth 2.0 Page Redirect (Immune to browser popup blockers)
 */
export function redirectToGoogleOAuth(customClientId = '') {
  const clientId = customClientId || getStoredClientId();
  if (!clientId) throw new Error('Google OAuth Client ID is required.');

  const cleanOrigin = window.location.origin.replace(/\/$/, '');
  const redirectUri = cleanOrigin;
  const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email profile');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=consent`;

  window.location.href = authUrl;
}

/**
 * Direct Popup Window Google OAuth 2.0 Sign-In Fallback
 */
export function openGoogleOAuthPopup(customClientId = '') {
  const clientId = customClientId || getStoredClientId();
  if (!clientId) {
    throw new Error('Google OAuth Client ID is required.');
  }

  return new Promise((resolve, reject) => {
    const cleanOrigin = window.location.origin.replace(/\/$/, '');
    const redirectUri = cleanOrigin;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}`;

    const width = 520;
    const height = 680;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      'about:blank',
      'GoogleAccountSignIn',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      reject(new Error('Popup window was blocked by your browser. Please allow popups for this site to sign in with Google.'));
      return;
    }

    popup.location.href = authUrl;

    const timer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(timer);
          reject(new Error('Google Sign-In window was closed.'));
          return;
        }

        const popupUrl = popup.location.href;
        if (popupUrl && popupUrl.includes('#access_token=')) {
          clearInterval(timer);
          const hashParams = new URLSearchParams(popupUrl.split('#')[1]);
          const token = hashParams.get('access_token');
          popup.close();

          if (token) {
            setStoredDriveToken(token);
            resolve(token);
          } else {
            reject(new Error('Failed to retrieve access token from Google Sign-In.'));
          }
        }
      } catch {
        // Ignore cross-origin security errors while user completes Google auth pages
      }
    }, 400);
  });
}

/**
 * Trigger official Google Account Sign-In OAuth 2.0 via GSI Token Client (Zero redirect_uri requirement)
 */
export async function promptGoogleDriveSignIn(customClientId = '') {
  const clientId = customClientId || getStoredClientId();
  if (!clientId) {
    throw new Error('Google OAuth Client ID is required.');
  }

  console.log('[EduKatalyst GIS] Requesting OAuth Token from origin:', window.location.origin, 'with Client ID:', clientId);

  try {
    const oauth2 = await loadGoogleGsiScript();
    return await new Promise((resolve, reject) => {
      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email profile',
        callback: (response) => {
          console.log('[EduKatalyst GIS Response]:', response);
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            setStoredDriveToken(response.access_token);
            resolve(response.access_token);
          } else {
            reject(new Error('No access token returned from Google Sign-In.'));
          }
        },
        error_callback: (err) => {
          console.warn('[EduKatalyst GIS Error Callback]:', err);
          if (err.type === 'popup_closed') {
            reject(new Error('Google Sign-In popup window was closed before signing in.'));
          } else {
            reject(new Error(err.message || 'Google Sign-In failed'));
          }
        }
      });

      tokenClient.requestAccessToken();
    });
  } catch (err) {
    console.warn('[EduKatalyst GIS load error, using direct popup fallback]:', err);
    return openGoogleOAuthPopup(clientId);
  }
}

/**
 * Ensure the "EduKatalyst Storage" folder exists in Google Drive, return its folderId
 */
export async function ensureDriveAppFolder(token) {
  const accessToken = token || getStoredDriveToken();
  if (!accessToken) throw new Error('Google Drive token required.');

  // Search for existing folder
  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errData = await searchRes.json().catch(() => ({}));
    const detailMsg = errData.error?.message || errData.error_description || (searchRes.status === 403 ? 'Insufficient Permission: Please sign out and re-consent to Google Drive permissions.' : searchRes.statusText) || 'Unknown Google Drive API error';
    if (detailMsg.includes('disabled') || detailMsg.includes('has not been used in project')) {
      throw new Error(`Google Drive API is disabled in your Google Cloud Console project. Enable it at https://console.cloud.google.com/apis/library/drive.googleapis.com`);
    }
    throw new Error(`Google Drive API Error (${searchRes.status}): ${detailMsg}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if it doesn't exist
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
 * Upload a File Blob (Zip or JSON) to Google Drive in the EduKatalyst folder
 */
export async function uploadZipToDrive(fileBlob, filename, token) {
  const accessToken = token || getStoredDriveToken();
  if (!accessToken) throw new Error('Google Drive token required.');

  const folderId = await ensureDriveAppFolder(accessToken);

  const metadata = {
    name: filename,
    parents: [folderId],
    description: 'EduKatalyst Encrypted Storage Backup Package',
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

  const fileData = await response.json();
  return {
    id: fileData.id,
    name: fileData.name,
    mimeType: fileData.mimeType,
  };
}

/**
 * List all backup files in the EduKatalyst folder
 */
export async function listDriveBackups(token) {
  const accessToken = token || getStoredDriveToken();
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
 * Download a backup file from Google Drive as a Blob
 */
export async function downloadFromDrive(fileId, token) {
  const accessToken = token || getStoredDriveToken();
  if (!accessToken) {
    // Fall back to public unauthenticated download if no token provided!
    return await fetchPublicDriveFile(fileId, 'blob');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    // If authenticated download fails or token restricted, attempt public download fallback
    try {
      return await fetchPublicDriveFile(fileId, 'blob');
    } catch {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Failed to download file from Google Drive: ${errData.error?.message || response.statusText}`);
    }
  }

  return await response.blob();
}
