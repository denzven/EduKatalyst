# EduKatalyst — Browser Storage & IndexedDB Architecture

> **IndexedDB Schema, Storage Quotas, & Cache Eviction**  
> **Central Utility:** `src/utils/storage.js`

---

## 1. Storage Layers Overview

EduKatalyst utilizes browser-native storage APIs to enable offline study capabilities:

| Storage Layer | Data Stored | Lifecycle / Eviction Policy |
| :--- | :--- | :--- |
| **IndexedDB (`EncryptedVideoDB`)** | HLS `.m3u8` playlists, AES key blobs, `.ts` video segment blobs, notes, quizzes | Persistent; LRU eviction when disk quota threshold is exceeded |
| **LocalStorage** | Active theme preset, custom subject/tag taxonomy, user preferences | Persistent until cleared by user |
| **SessionStorage** | Temporary UI unlock state | Cleared on tab close |

---

## 2. IndexedDB Schema Specification

- **Database Name**: `EncryptedVideoDB`
- **Database Version**: `2`
- **Object Store**: `video_sessions`
- **Primary Key**: `id` (String)

```javascript
{
  id: "vid_1725200000000",             // Unique session ID
  title: "Quantum Mechanics Lect 1",   // Video title
  category: "Physics",                  // Subject directory
  tags: ["quantum", "physics"],         // Tag classifiers
  description: "Introductory lecture",  // Brief summary
  thumbnailUrl: "data:image/jpeg...",  // Base64 thumbnail frame
  createdAt: "2026-09-01T20:00:00Z",    // ISO creation timestamp
  keyHex: "a1b2c3d4...",                // 16-byte AES-128 hex key
  keyBlob: Blob,                        // AES-128 binary key Blob
  keyUri: "https://...",                // HLS key uri string
  playlistText: "#EXTM3U\n...",         // Raw .m3u8 HLS playlist text
  segments: {                           // Transport stream segment blobs map
    "output0.ts": Blob,
    "output1.ts": Blob
  },
  segmentCount: 42,                     // Total segment count
  totalSizeBytes: 15420104              // Total size in bytes
}
```

---

## 3. Storage Quota & LRU Eviction Policy

To prevent browser origin storage quota crashes on mobile or storage-constrained devices:

1. **Persistent Storage Request**: `AppShellContext` calls `navigator.storage.persist()` on app boot.
2. **Quota Estimation**: `navigator.storage.estimate()` queries current usage and total quota.
3. **LRU Cache Eviction**: When total video segment storage exceeds `MAX_OFFLINE_VIDEO_CACHE_BYTES` (500 MB), the oldest video segment blobs are evicted while preserving small note text and quiz score records.
