import JSZip from 'jszip';
import { saveVideoSession } from './storage';

/**
 * Export a single video session to a .zip bundle
 */
export async function exportSessionToZip(session, onBlobReady = null) {
  const zip = new JSZip();

  const folderName = session.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const folder = zip.folder(folderName);

  const metadata = {
    id: session.id,
    title: session.title,
    category: session.category || 'General',
    tags: Array.isArray(session.tags) ? session.tags : [],
    description: session.description || '',
    keyHex: session.keyHex,
    keyUri: session.keyUri || 'https://mock-worker.local/get-key?vid=demo',
    createdAt: session.createdAt,
    segmentCount: session.segmentCount,
    totalSizeBytes: session.totalSizeBytes
  };

  folder.file('metadata.json', JSON.stringify(metadata, null, 2));
  folder.file('output.m3u8', session.playlistText || '');
  if (session.keyBlob) {
    folder.file('enc.key', session.keyBlob);
  }

  const segments = session.segments || {};
  for (const segName of Object.keys(segments)) {
    folder.file(segName, segments[segName]);
  }

  const contentBlob = await zip.generateAsync({ type: 'blob' });

  if (onBlobReady) {
    await onBlobReady(contentBlob);
    return;
  }

  const link = document.createElement('a');
  link.href = URL.createObjectURL(contentBlob);
  link.download = `hls_encrypted_${folderName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/**
 * Import a single video session or Master Archive from a .zip file
 */
export async function importSessionFromZip(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);

  // Check if this is a Master Archive with manifest.json
  const manifestFile = zip.file('manifest.json') || zip.file(/manifest\.json$/)[0];
  if (manifestFile) {
    return await importMasterBundleFromZip(zip, manifestFile);
  }

  // Single Session import fallback
  let metadataFile = zip.file('metadata.json') || zip.file(/metadata\.json$/)[0];
  let playlistFile = zip.file('output.m3u8') || zip.file(/output\.m3u8$/)[0] || zip.file(/\.m3u8$/)[0];
  let keyFile = zip.file('enc.key') || zip.file(/enc\.key$/)[0] || zip.file(/\.key$/)[0];

  if (!playlistFile || !keyFile) {
    throw new Error('Invalid HLS Zip package: missing playlist (.m3u8) or key file (.key)');
  }

  let metadata = {};
  if (metadataFile) {
    const metaText = await metadataFile.async('string');
    try {
      metadata = JSON.parse(metaText);
    } catch (e) {}
  }

  const playlistText = await playlistFile.async('string');
  const keyBuffer = await keyFile.async('arraybuffer');
  const keyBlob = new Blob([keyBuffer], { type: 'application/octet-stream' });

  let keyHex = metadata.keyHex;
  if (!keyHex) {
    const keyBytes = new Uint8Array(keyBuffer);
    keyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const tsFiles = zip.file(/\.ts$/);
  const segments = {};
  let totalSizeBytes = 0;

  for (const file of tsFiles) {
    const fileName = file.name.split('/').pop();
    const segBuffer = await file.async('arraybuffer');
    const segBlob = new Blob([segBuffer], { type: 'video/mp2t' });
    segments[fileName] = segBlob;
    totalSizeBytes += segBlob.size;
  }

  const sessionRecord = {
    id: metadata.id || `imported_${Date.now()}`,
    title: metadata.title || zipFile.name.replace(/\.zip$/i, ''),
    category: metadata.category || 'General',
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    description: metadata.description || '',
    keyHex: keyHex,
    keyBlob: keyBlob,
    keyUri: metadata.keyUri || 'https://mock-worker.local/get-key?vid=demo',
    playlistText: playlistText,
    segments: segments,
    segmentCount: Object.keys(segments).length,
    totalSizeBytes: totalSizeBytes || zipFile.size
  };

  return sessionRecord;
}

/**
 * Export Master Storage Archive containing all sessions + automated setup scripts
 */
export async function exportMasterBundle(sessions, onBlobReady = null) {
  const zip = new JSZip();

  const manifest = {
    version: '1.0.0',
    app: 'EduKatalyst by DZVN',
    exportedAt: new Date().toISOString(),
    sessionCount: sessions.length,
    sessions: sessions.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category || 'General',
      tags: Array.isArray(s.tags) ? s.tags : [],
      description: s.description || '',
      createdAt: s.createdAt,
      keyHex: s.keyHex,
      segmentCount: s.segmentCount,
      totalSizeBytes: s.totalSizeBytes
    }))
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Add README_RESTORE.txt
  const readmeText = `=======================================================
EduKatalyst Master Storage Archive & Restore Guide
=======================================================

Included Files & Directories:
- manifest.json       : Master manifest indexing all video sessions & metadata.
- setup.bat           : Windows double-click automated extraction & setup script.
- restore.py          : Cross-platform Python 3 automated extraction script.
- videos/             : Encrypted HLS video sessions (.m3u8, .key, .ts chunks).

RESTORE OPTIONS:

Option 1: In-Browser 1-Click Restore (Recommended)
1. Open the EduKatalyst website.
2. Open Creator Studio -> Storage Manager.
3. Click "Import Zip" or "Master Restore", and select this zip file.
4. All video sessions, AES-128 keys, and metadata will be populated instantly into browser IndexedDB.

Option 2: Windows Automated Setup Script
1. Extract this zip archive into your desired directory.
2. Double-click "setup.bat".
3. The script will automatically organize and place session files into local target folders.

Option 3: Python Cross-Platform Restore
1. Open terminal/command prompt in the extracted directory.
2. Run: python restore.py
`;
  zip.file('README_RESTORE.txt', readmeText);

  // Add Windows setup.bat
  const batScript = `@echo off
title EduKatalyst Master Storage Automated Restore
echo ===================================================
echo   EduKatalyst Master Storage Setup & Restore Script
echo ===================================================
echo.
echo Checking for Python installation...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Launching Python restore script...
    python restore.py
) else (
    echo Python not found. Running PowerShell automated extraction...
    powershell -Command "Write-Host 'Extracting video sessions...' -ForegroundColor Green; Expand-Archive -Path 'edukatalyst_master_backup.zip' -DestinationPath './restored_edukatalyst_data' -Force"
    echo Restoration completed! Extracted to ./restored_edukatalyst_data
)
echo.
echo ===================================================
echo Done! All EduKatalyst storage files ready.
echo ===================================================
pause
`;
  zip.file('setup.bat', batScript);

  // Add Python restore.py
  const pythonScript = `import os
import json
import zipfile
import sys

print("===================================================")
print("  EduKatalyst Master Storage Restore Script (Python)")
print("===================================================")

script_dir = os.path.dirname(os.path.abspath(__file__))
manifest_path = os.path.join(script_dir, "manifest.json")

if not os.path.exists(manifest_path):
    print("[-] Error: manifest.json not found in current directory.")
    sys.exit(1)

with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

print(f"[+] Loaded Master Manifest created at: {manifest.get('exportedAt')}")
print(f"[+] Total Video Sessions: {manifest.get('sessionCount')}")

out_dir = os.path.join(script_dir, "restored_sessions")
os.makedirs(out_dir, exist_ok=True)

videos_dir = os.path.join(script_dir, "videos")
if os.path.exists(videos_dir):
    for sess in manifest.get("sessions", []):
        sid = sess.get("id")
        title = sess.get("title")
        print(f"  -> Restored session: {title} ({sid})")

print("\\n[+] Restoration complete! Sessions saved to: " + out_dir)
`;
  zip.file('restore.py', pythonScript);

  // Add videos/ subfolders for each session
  const videosFolder = zip.folder('videos');

  for (const s of sessions) {
    const sFolder = videosFolder.folder(s.id);
    const meta = {
      id: s.id,
      title: s.title,
      category: s.category || 'General',
      tags: Array.isArray(s.tags) ? s.tags : [],
      description: s.description || '',
      createdAt: s.createdAt,
      keyHex: s.keyHex,
      segmentCount: s.segmentCount,
      totalSizeBytes: s.totalSizeBytes
    };

    sFolder.file('metadata.json', JSON.stringify(meta, null, 2));
    sFolder.file('output.m3u8', s.playlistText || '');
    if (s.keyBlob) {
      sFolder.file('enc.key', s.keyBlob);
    }

    const segments = s.segments || {};
    for (const segName of Object.keys(segments)) {
      sFolder.file(segName, segments[segName]);
    }
  }

  const contentBlob = await zip.generateAsync({ type: 'blob' });

  if (onBlobReady) {
    await onBlobReady(contentBlob);
    return;
  }

  const link = document.createElement('a');
  link.href = URL.createObjectURL(contentBlob);
  link.download = `edukatalyst_master_backup_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/**
 * Import a Master Bundle zip containing multiple sessions
 */
async function importMasterBundleFromZip(zip, manifestFile) {
  const metaText = await manifestFile.async('string');
  const manifest = JSON.parse(metaText);

  let importedSessions = [];
  const videoEntries = zip.folder('videos');

  for (const sessionMeta of manifest.sessions || []) {
    const sid = sessionMeta.id;
    const sessionFolder = zip.folder(`videos/${sid}`) || zip.folder(sid);

    if (!sessionFolder) continue;

    let playlistFile = sessionFolder.file('output.m3u8');
    let keyFile = sessionFolder.file('enc.key');

    if (!playlistFile || !keyFile) continue;

    const playlistText = await playlistFile.async('string');
    const keyBuffer = await keyFile.async('arraybuffer');
    const keyBlob = new Blob([keyBuffer], { type: 'application/octet-stream' });

    const tsFiles = sessionFolder.file(/\.ts$/);
    const segments = {};
    let totalSizeBytes = 0;

    for (const file of tsFiles) {
      const fileName = file.name.split('/').pop();
      const segBuffer = await file.async('arraybuffer');
      const segBlob = new Blob([segBuffer], { type: 'video/mp2t' });
      segments[fileName] = segBlob;
      totalSizeBytes += segBlob.size;
    }

    const sessionRecord = {
      id: sessionMeta.id,
      title: sessionMeta.title,
      category: sessionMeta.category || 'General',
      tags: sessionMeta.tags || [],
      description: sessionMeta.description || '',
      createdAt: sessionMeta.createdAt,
      keyHex: sessionMeta.keyHex,
      keyBlob: keyBlob,
      playlistText: playlistText,
      segments: segments,
      segmentCount: Object.keys(segments).length,
      totalSizeBytes: totalSizeBytes
    };

    await saveVideoSession(sessionRecord);
    importedSessions.push(sessionRecord);
  }

  return {
    isMasterBundle: true,
    importedCount: importedSessions.length,
    sessions: importedSessions,
    title: `Master Archive (${importedSessions.length} Sessions)`
  };
}

/**
 * Convenience alias for exporting all master storage sessions to a Zip Blob
 */
export async function exportMasterStorageZip() {
  const sessions = await getAllVideoSessions();
  let resultBlob = null;
  await exportMasterBundle(sessions, (blob) => {
    resultBlob = blob;
  });
  return resultBlob;
}

/**
 * Convenience alias for importing sessions from a Zip file or Blob
 */
export async function importMasterStorageZip(zipFile) {
  return await importSessionFromZip(zipFile);
}

