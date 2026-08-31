/**
 * Google Drive Integration Utility
 * Handles Google Drive API v3 and Google OAuth 2.0 Sign-In for client-side cloud backup & sync.
 */

const DRIVE_TOKEN_KEY = 'katalyst_drive_access_token';
const CLIENT_ID_KEY = 'katalyst_google_client_id';
const FOLDER_NAME = 'EduKatalyst Storage';

// Default Client ID loaded securely from environment variables (.env)
const DEFAULT_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '119791404749-o4a3g19ps1sjvkgmcf9qj62ih9l5mcpp.apps.googleusercontent.com';

/**
 * Retrieve stored Google OAuth Access Token
 */
export function getStoredDriveToken() {
  return localStorage.getItem(DRIVE_TOKEN_KEY) || '';
}

/**
 * Save or clear Google OAuth Access Token
 */
export function setStoredDriveToken(token) {
  if (token) {
    localStorage.setItem(DRIVE_TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(DRIVE_TOKEN_KEY);
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
 * Validate current Google Drive Access Token and retrieve account email
 */
export async function validateDriveToken(accessToken) {
  const token = accessToken || getStoredDriveToken();
  if (!token) {
    throw new Error('No Google Drive Access Token provided.');
  }

  const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
  if (!response.ok) {
    throw new Error('Invalid or expired Google Drive Access Token. Please sign in again.');
  }

  const data = await response.json();
  
  // Also fetch user profile email if available
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
    script.onerror = (err) => reject(new Error('Failed to load Google Identity Services SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Trigger official Google Account Sign-In OAuth 2.0 authorization page/popup
 */
export async function promptGoogleDriveSignIn(customClientId = '') {
  const clientId = customClientId || getStoredClientId();
  if (!clientId) {
    throw new Error('Google OAuth Client ID is required.');
  }

  try {
    const oauth2 = await loadGoogleGsiScript();
    return new Promise((resolve, reject) => {
      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email profile',
        prompt: 'select_account',
        callback: (response) => {
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
      });

      tokenClient.requestAccessToken();
    });
  } catch (err) {
    // Fallback: standard popup window if GIS SDK fails to initialize
    return openGoogleOAuthPopupFallback(clientId);
  }
}

/**
 * Fallback popup window authorization method
 */
function openGoogleOAuthPopupFallback(clientId) {
  return new Promise((resolve, reject) => {
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=select_account`;

    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'GoogleAccountSignIn',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error('Popup blocked! Please allow popups for this site to sign in with Google.'));
      return;
    }

    const timer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(timer);
          reject(new Error('Google Sign-In window closed.'));
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
        // Ignore cross-origin errors while user navigates Google Sign-In pages
      }
    }, 500);
  });
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
    throw new Error(`Google Drive Search Failed: ${searchRes.statusText}`);
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
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
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

  try {
    const folderId = await ensureDriveAppFolder(accessToken);
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,size)&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing Drive backups:', err);
    return [];
  }
}

/**
 * Download a backup file from Google Drive as a Blob
 */
export async function downloadFromDrive(fileId, token) {
  const accessToken = token || getStoredDriveToken();
  if (!accessToken) throw new Error('Google Drive token required.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file from Google Drive: ${response.statusText}`);
  }

  return await response.blob();
}
