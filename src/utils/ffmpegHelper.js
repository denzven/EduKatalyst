import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let isLoaded = false;

/**
 * Get or initialize the FFmpeg WASM singleton instance
 */
export async function getFFmpegInstance(onLog, onProgress) {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  // Attach dynamic event handlers
  if (onLog) {
    ffmpegInstance.on('log', ({ message }) => {
      onLog(message);
    });
  }

  if (onProgress) {
    ffmpegInstance.on('progress', ({ progress }) => {
      // progress is a float between 0 and 1
      onProgress(Math.round(progress * 100));
    });
  }

  if (!isLoaded) {
    onLog?.('Loading FFmpeg WebAssembly core modules from CDN...');
    
    // Load ffmpeg core ESM bundle from unpkg/jsdelivr CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    try {
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      isLoaded = true;
      onLog?.('FFmpeg WASM initialized successfully.');
    } catch (err) {
      onLog?.(`Error loading FFmpeg WASM: ${err.message}`);
      throw err;
    }
  }

  return ffmpegInstance;
}

/**
 * Generate 16-byte random key for AES-128 encryption
 */
export function generateAES128Key() {
  const keyBytes = new Uint8Array(16);
  window.crypto.getRandomValues(keyBytes);
  const keyHex = Array.from(keyBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { keyBytes, keyHex };
}

/**
 * Perform In-Browser AES-128 HLS Chunking & Encryption
 */
export async function encryptAndChunkVideo({
  file,
  keyDeliveryUrl = 'https://mock-worker.local/get-key?vid=demo',
  onLog = () => {},
  onProgress = () => {}
}) {
  const ffmpeg = await getFFmpegInstance(onLog, onProgress);

  onLog('Step 1/5: Generating 16-byte AES-128 Encryption Key via Web Crypto API...');
  const { keyBytes, keyHex } = generateAES128Key();
  onLog(`AES-128 Key (Hex): ${keyHex}`);

  onLog('Step 2/5: Writing input video and encryption metadata to FFmpeg virtual filesystem...');
  
  // Write input MP4 file to FFmpeg memory
  const inputFileName = 'input.mp4';
  const fileData = await fetchFile(file);
  await ffmpeg.writeFile(inputFileName, fileData);

  // Write binary key file
  const keyFileName = 'enc.key';
  await ffmpeg.writeFile(keyFileName, keyBytes);

  // Write keyinfo file (Format: Line 1: Key URI, Line 2: Path to key file)
  const keyInfoFileName = 'enc.keyinfo';
  const keyInfoContent = `${keyDeliveryUrl}\n${keyFileName}`;
  await ffmpeg.writeFile(keyInfoFileName, new TextEncoder().encode(keyInfoContent));

  onLog('Step 3/5: Executing FFmpeg HLS chunking & AES-128 encryption CLI...');
  
  // Try stream copy first (ultra-fast). Fallback to ultrafast x264 if needed.
  let execCode = -1;
  try {
    onLog('Executing: ffmpeg -i input.mp4 -c:v copy -c:a copy -hls_time 4 -hls_playlist_type vod -hls_key_info_file enc.keyinfo output.m3u8');
    execCode = await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-hls_time', '4',
      '-hls_playlist_type', 'vod',
      '-hls_key_info_file', keyInfoFileName,
      'output.m3u8'
    ]);
  } catch (e) {
    onLog(`Stream copy mode failed, retrying with ultrafast re-encoding: ${e.message}`);
  }

  if (execCode !== 0) {
    onLog('Executing fallback re-encode: ffmpeg -i input.mp4 -c:v libx264 -preset ultrafast -c:a aac -hls_time 4 -hls_key_info_file enc.keyinfo output.m3u8');
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-hls_time', '4',
      '-hls_playlist_type', 'vod',
      '-hls_key_info_file', keyInfoFileName,
      'output.m3u8'
    ]);
  }

  onLog('Step 4/5: Extracting generated HLS playlist and encrypted .ts chunks from virtual RAM...');

  // Read playlist text
  const playlistData = await ffmpeg.readFile('output.m3u8');
  const playlistText = new TextDecoder('utf-8').decode(playlistData);
  onLog('Playlist file output.m3u8 read successfully.');

  // Read key file blob
  const keyFileData = await ffmpeg.readFile(keyFileName);
  const keyBlob = new Blob([keyFileData.buffer], { type: 'application/octet-stream' });

  // Parse .ts chunk filenames from playlist lines
  const lines = playlistText.split('\n');
  const segmentFileNames = lines
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  onLog(`Found ${segmentFileNames.length} encrypted .ts chunk(s): ${segmentFileNames.join(', ')}`);

  const segments = {};
  let totalSizeBytes = 0;

  for (const segName of segmentFileNames) {
    try {
      const segData = await ffmpeg.readFile(segName);
      const segBlob = new Blob([segData.buffer], { type: 'video/mp2t' });
      segments[segName] = segBlob;
      totalSizeBytes += segBlob.size;
      onLog(`Extracted segment ${segName} (${(segBlob.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      onLog(`Warning: Could not read segment ${segName}: ${err.message}`);
    }
  }

  onLog('Step 5/5: Cleaning up virtual filesystem memory...');
  try {
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(keyFileName);
    await ffmpeg.deleteFile(keyInfoFileName);
    await ffmpeg.deleteFile('output.m3u8');
    for (const segName of segmentFileNames) {
      await ffmpeg.deleteFile(segName).catch(() => {});
    }
  } catch (cleanupErr) {
    // Ignore minor cleanup errors
  }

  onLog('Encryption & Chunking process complete!');
  onProgress(100);

  return {
    keyHex,
    keyBlob,
    keyUri: keyDeliveryUrl,
    playlistText,
    segments,
    totalSizeBytes
  };
}
