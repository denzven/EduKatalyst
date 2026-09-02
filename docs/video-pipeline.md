# EduKatalyst — HLS Encrypted Video Processing Pipeline

> **WASM Transcoding, AES-128 Key Generation, & HLS Playback**  
> **Utilities**: `ffmpegHelper.js`, `VideoPlayer.jsx`, `VideoUploader.jsx`

---

## 1. Pipeline Architecture

```
AUTHORING TIME (Creator Browser)
Raw Video (.mp4/.mov) ──► FFmpeg WASM Transcode ──► AES-128 HLS (.m3u8 + .ts) ──► Save IndexedDB / Drive

STUDENT RUNTIME (Student Browser)
Fetch manifest.json ──► Load HLS Playlist Blob ──► Attach hls.js to <video> ──► Playback (Zero WASM!)
```

---

## 2. Step-by-Step Transcoding Workflow

1. **File Selection**: Creator selects video file (`.mp4`, `.mov`, `.webm`, `.avi`, `.mkv`).
2. **Key Generation**: `generateAES128Key()` in [ffmpegHelper.js](file:///d:/DZVN_edutech_test/src/utils/ffmpegHelper.js#L75) uses Web Crypto API to generate a 16-byte random key and hex string.
3. **FFmpeg WASM Transcoding**:
   - Initializes `@ffmpeg/ffmpeg` 0.12 WASM instance.
   - Writes `input.mp4`, `enc.key`, and `enc.keyinfo` into virtual WASM filesystem.
   - Executes FFmpeg exec command:
     ```bash
     ffmpeg -i input.mp4 -c:v copy -c:a copy -hls_time 4 -hls_playlist_type vod -hls_key_info_file enc.keyinfo output.m3u8
     ```
4. **Segment Extraction**: Reads generated `.m3u8` playlist and `.ts` chunk files as binary Blobs.
5. **Persistence**: Saves session record into IndexedDB (`EncryptedVideoDB`).

---

## 3. Student Runtime Playback Architecture

- **No Student WASM Execution**: Student browsers fetch pre-chunked HLS playlists directly.
- **Dynamic Blob Mapping**: [VideoPlayer.jsx](file:///d:/DZVN_edutech_test/src/components/VideoPlayer.jsx#L81) creates `blob:` URLs for key and segment Blobs, replacing playlist URI strings dynamically.
- **HLS.js Stream Attachment**: Passes the virtual blob playlist URL to `hls.js`, which manages segment buffering, speed control, PiP, and full-screen rendering.
