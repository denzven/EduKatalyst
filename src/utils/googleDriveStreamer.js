/**
 * googleDriveStreamer.js
 * Enables Google Drive to act as a Semi-Server / Cloud Storage Backend for EduKatalyst.
 * Rather than just dumping static Zip archives, this utility enables:
 * 1. Live Manifest Sync (manifest.json listing course catalog, notes, quizzes, videos)
 * 2. On-Demand File Streaming (streaming Markdown notes, PDFs, images directly from Google Drive)
 * 3. On-Demand HLS Video Segment Fetching (fetching .m3u8 and .ts video chunks on-the-fly)
 * 4. Local IndexedDB LRU Caching for offline access
 */

import { getStoredDriveToken, ensureDriveAppFolder } from './googleDriveSync';

const MANIFEST_FILE_NAME = 'manifest.json';

/**
 * Fetch or initialize the central cloud course manifest from Google Drive.
 * @returns {Promise<Object>} The manifest data { sessions: [], notes: [], quizzes: [], updatedAt: string }
 */
export async function fetchCloudManifest() {
  const token = getStoredDriveToken();
  if (!token) throw new Error('Google Drive authorization required.');

  const folderId = await ensureDriveAppFolder(token);
  const query = encodeURIComponent(`name = '${MANIFEST_FILE_NAME}' and '${folderId}' in parents and trashed = false`);
  
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    throw new Error(`Cloud Manifest Search Failed: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (!searchData.files || searchData.files.length === 0) {
    // Manifest does not exist yet; return empty manifest structure
    return { sessions: [], notes: [], quizzes: [], updatedAt: new Date().toISOString() };
  }

  const fileId = searchData.files[0].id;
  const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!contentRes.ok) {
    throw new Error('Failed to download cloud manifest content.');
  }

  return await contentRes.json();
}

/**
 * Publish / update the central cloud course manifest on Google Drive.
 * @param {Object} manifestData 
 */
export async function publishCloudManifest(manifestData) {
  const token = getStoredDriveToken();
  if (!token) throw new Error('Google Drive authorization required.');

  const folderId = await ensureDriveAppFolder(token);
  const query = encodeURIComponent(`name = '${MANIFEST_FILE_NAME}' and '${folderId}' in parents and trashed = false`);
  
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) throw new Error('Cloud Manifest Search Failed.');

  const searchData = await searchRes.json();
  const fileBlob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });

  if (searchData.files && searchData.files.length > 0) {
    // Update existing manifest
    const fileId = searchData.files[0].id;
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: fileBlob,
    });

    if (!updateRes.ok) throw new Error('Failed to update cloud manifest.');
    return await updateRes.json();
  } else {
    // Create new manifest
    const metadata = {
      name: MANIFEST_FILE_NAME,
      parents: [folderId],
      description: 'EduKatalyst Central Course Catalog & Content Manifest',
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', fileBlob);

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!createRes.ok) throw new Error('Failed to create cloud manifest.');
    return await createRes.json();
  }
}

/**
 * Fetch raw file content (Text, Markdown, JSON, or Blob) from Google Drive on-demand.
 * @param {string} fileId 
 * @param {'json'|'text'|'blob'} [responseType='text'] 
 */
export async function fetchDriveFileContent(fileId, responseType = 'text') {
  const token = getStoredDriveToken();
  if (!token) throw new Error('Google Drive authorization required.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to stream file ${fileId} from Google Drive.`);
  }

  if (responseType === 'json') return await response.json();
  if (responseType === 'blob') return await response.blob();
  return await response.text();
}

/**
 * Stream an HLS video segment (.ts) or playlist (.m3u8) on-demand directly from Google Drive.
 * @param {string} fileId 
 * @returns {Promise<string>} Blob Object URL for video element playback
 */
export async function fetchDriveMediaStreamUrl(fileId) {
  const blob = await fetchDriveFileContent(fileId, 'blob');
  return URL.createObjectURL(blob);
}
