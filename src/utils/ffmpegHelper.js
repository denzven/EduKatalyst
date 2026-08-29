import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let isLoaded = false;

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.flv'];

/**
 * Validate video file type & format
 */
export function validateVideoFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const nameLower = file.name.toLowerCase();
  const isSupportedExt = SUPPORTED_VIDEO_EXTENSIONS.some(ext => nameLower.endsWith(ext));
  const isVideoType = file.type ? file.type.startsWith('video/') : isSupportedExt;

  if (!isSupportedExt && !isVideoType) {
    return { 
      valid: false, 
      error: `Unsupported file format. Please upload a video file (${SUPPORTED_VIDEO_EXTENSIONS.join(', ')}).` 
    };
  }

  return { valid: true };
}

/**
 * Get or initialize the FFmpeg WASM singleton instance
 */
export async function getFFmpegInstance(onLog, onProgress) {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  if (onLog) {
    ffmpegInstance.on('log', ({ message }) => {
      onLog(message);
    });
  }

  if (onProgress) {
    ffmpegInstance.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  if (!isLoaded) {
    onLog?.('Initializing video processing engine...');
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    try {
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      isLoaded = true;
      onLog?.('Engine initialized successfully.');
    } catch (err) {
      onLog?.(`Engine error: ${err.message}`);
      throw new Error(`Failed to initialize video processing engine: ${err.message}`);
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
 * Perform In-Browser Multi-Format Video Processing & Encryption
 */
export async function encryptAndChunkVideo({
  file,
  keyDeliveryUrl = 'https://mock-worker.local/get-key?vid=demo',
  onLog = () => {},
  onProgress = () => {}
}) {
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ffmpeg = await getFFmpegInstance(onLog, onProgress);

  onLog('Step 1/4: Generating security key...');
  const { keyBytes, keyHex } = generateAES128Key();

  onLog('Step 2/4: Preparing video stream...');
  
  // Extract file extension dynamically
  const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
  const fileExt = extMatch ? extMatch[1].toLowerCase() : 'mp4';
  const inputFileName = `input.${fileExt}`;

  const fileData = await fetchFile(file);
  await ffmpeg.writeFile(inputFileName, fileData);

  const keyFileName = 'enc.key';
  await ffmpeg.writeFile(keyFileName, keyBytes);

  const keyInfoFileName = 'enc.keyinfo';
  const keyInfoContent = `${keyDeliveryUrl}\n${keyFileName}`;
  await ffmpeg.writeFile(keyInfoFileName, new TextEncoder().encode(keyInfoContent));

  onLog(`Step 3/4: Processing video (${fileExt.toUpperCase()} format)...`);
  
  let execCode = -1;
  try {
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
    onLog(`Stream copy mode unavailable, re-encoding video stream...`);
  }

  if (execCode !== 0) {
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

  onLog('Step 4/4: Extracting video segments...');

  const playlistData = await ffmpeg.readFile('output.m3u8');
  const playlistText = new TextDecoder('utf-8').decode(playlistData);

  const keyFileData = await ffmpeg.readFile(keyFileName);
  const keyBlob = new Blob([keyFileData.buffer], { type: 'application/octet-stream' });

  const lines = playlistText.split('\n');
  const segmentFileNames = lines
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  const segments = {};
  let totalSizeBytes = 0;

  for (const segName of segmentFileNames) {
    try {
      const segData = await ffmpeg.readFile(segName);
      const segBlob = new Blob([segData.buffer], { type: 'video/mp2t' });
      segments[segName] = segBlob;
      totalSizeBytes += segBlob.size;
    } catch (err) {
      onLog(`Warning: Could not read segment ${segName}`);
    }
  }

  // Virtual filesystem cleanup
  try {
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(keyFileName);
    await ffmpeg.deleteFile(keyInfoFileName);
    await ffmpeg.deleteFile('output.m3u8');
    for (const segName of segmentFileNames) {
      await ffmpeg.deleteFile(segName).catch(() => {});
    }
  } catch (cleanupErr) {
    // Ignore cleanup errors
  }

  onLog('Video processing complete!');
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
