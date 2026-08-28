/**
 * Google Drive Integration Utility
 * Handles Google Drive API v3 for client-side cloud backup & sync.
 */

const DRIVE_TOKEN_KEY = 'katalyst_drive_access_token';
const FOLDER_NAME = 'EduKatalyst Storage';

/**
 * Retrieve stored Google Drive OAuth access token
 */
export function getStoredDriveToken() {
  return localStorage.getItem(DRIVE_TOKEN_KEY) || '';
}

/**
 * Save Google Drive OAuth access token
 */
export function setStoredDriveToken(token) {
  if (token) {
    localStorage.setItem(DRIVE_TOKEN_KEY, token.trim());
  } else {
    localStorage.removeItem(DRIVE_TOKEN_KEY);
  }
}

/**
 * Validate current Google Drive Access Token
 */
export async function validateDriveToken(accessToken) {
  const token = accessToken || getStoredDriveToken();
  if (!token) {
    throw new Error('No Google Drive Access Token provided.');
  }

  const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
  if (!response.ok) {
    throw new Error('Invalid or expired Google Drive Access Token.');
  }

  const data = await response.json();
  return {
    email: data.email,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
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
