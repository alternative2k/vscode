# Phase 8: Continuous Recording - Research

**Researched:** 2026-01-20
**Domain:** Browser MediaRecorder API for continuous background recording with chunked cloud uploads
**Confidence:** HIGH

<research_summary>
## Summary

Researched continuous background video recording in the browser using MediaRecorder API, with focus on chunked uploads, page lifecycle handling, and memory management for long-duration recordings.

**Key findings:**
1. **Page lifecycle is critical:** `visibilitychange` event (checking for `hidden` state) is the only reliable way to detect when to save/upload data. `beforeunload` and `unload` are unreliable, especially on mobile. Chrome is deprecating `unload` entirely (March 2025 - April 2026).

2. **Chunk strategy matters:** MediaRecorder's `timeslice` parameter produces chunks at intervals, but chunk sizes can vary wildly (75KB normal, up to 50MB after sleep/wake or Safari pause/resume). Need to handle unexpectedly large chunks with `Blob.slice()`.

3. **WebM VP9 is ideal:** Better compression than H.264 (~33% smaller files), royalty-free, good browser support. Already using this in existing `useRecording` hook.

4. **Progressive save to IndexedDB:** Store chunks progressively to survive page refresh. Upload from IndexedDB rather than memory to handle network interruptions gracefully.

**Primary recommendation:** Use `visibilitychange` to trigger uploads, save chunks to IndexedDB progressively, upload on `hidden` state using existing cloud upload infrastructure. Don't rely on `beforeunload`.
</research_summary>

<standard_stack>
## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| MediaRecorder API | Browser native | Video/audio recording | Only browser API for this |
| IndexedDB | Browser native | Persistent blob storage | Already using via recordingStorage.ts |
| Cloudflare R2 | N/A | Cloud storage | Already set up in Phase 7 |

### Supporting (May Need)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fix-webm-duration | 1.0.x | Add duration metadata to WebM | If playback needs duration seek |
| idb | 8.x | Promise-based IndexedDB wrapper | If current raw IndexedDB becomes unwieldy |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| IndexedDB chunks | Memory-only chunks | Memory can be reclaimed by browser, IndexedDB survives refresh |
| visibilitychange | beforeunload | beforeunload unreliable on mobile, deprecated |
| sendBeacon | fetch + keepalive | sendBeacon limited to small payloads, can't upload video chunks |

**Installation:**
```bash
# Optional - only if WebM duration issues arise
npm install fix-webm-duration
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useRecording.ts           # Existing manual recording
│   ├── useContinuousRecording.ts # NEW: Background continuous recording
│   └── useRecordingHistory.ts    # Existing (reuse)
├── utils/
│   ├── recordingStorage.ts       # Existing IndexedDB operations
│   ├── chunkStorage.ts           # NEW: Chunk-specific IndexedDB operations
│   └── cloudUpload.ts            # Existing presigned URL upload
└── types/
    └── recording.ts              # Add ContinuousRecordingChunk type
```

### Pattern 1: Progressive Chunk Storage
**What:** Save each MediaRecorder chunk to IndexedDB immediately, don't accumulate in memory
**When to use:** Long-duration continuous recording
**Example:**
```typescript
// On each ondataavailable event, save chunk to IndexedDB
mediaRecorder.ondataavailable = async (event) => {
  if (event.data.size > 0) {
    await saveChunkToIndexedDB({
      sessionId: currentSessionId,
      chunkIndex: chunkIndex++,
      blob: event.data,
      timestamp: Date.now(),
    });
  }
};
```

### Pattern 2: Visibility-Based Upload Trigger
**What:** Use visibilitychange to trigger uploads when user leaves page
**When to use:** Always - it's the only reliable page exit signal
**Example:**
```typescript
// Source: MDN visibilitychange documentation
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'hidden') {
      // User is leaving - upload pending chunks
      await uploadPendingChunks();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### Pattern 3: Chunked Session Management
**What:** Group chunks by recording session, manage lifecycle
**When to use:** Continuous recording that spans multiple upload cycles
**Example:**
```typescript
interface RecordingSession {
  sessionId: string;
  startTime: number;
  chunks: ChunkMetadata[];
  status: 'recording' | 'uploading' | 'complete';
}

// On visibility hidden:
// 1. Finalize current chunk
// 2. Mark session for upload
// 3. Upload all pending chunks
// 4. On return (visibility visible), resume recording with new session
```

### Anti-Patterns to Avoid
- **Accumulating all chunks in memory:** Browser can reclaim memory, causes OOM on long recordings
- **Using beforeunload for critical saves:** Unreliable on mobile, deprecated in Chrome
- **Assuming constant chunk sizes:** Sleep/wake can produce 50MB chunks unexpectedly
- **Not handling upload failures:** Chunks should stay in IndexedDB until confirmed uploaded
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB operations | Raw IDB API everywhere | Existing recordingStorage.ts patterns | Already have working abstraction |
| Upload with retry | New upload logic | Existing cloudUpload.ts | Already has retry with exponential backoff |
| MIME type detection | Hardcoded types | Existing getSupportedMimeType() | Already handles browser differences |
| Page lifecycle detection | Multiple event listeners | Single visibilitychange | Only reliable cross-platform approach |
| Duration calculation | Counting chunks * timeslice | Separate timer (Date.now) | Timeslice is not exact, varies wildly |

**Key insight:** The existing codebase already has most building blocks:
- MediaRecorder setup with VP9 (useRecording.ts)
- IndexedDB blob storage (recordingStorage.ts)
- Cloud upload with presigned URLs (cloudUpload.ts)
- Retry logic with backoff (cloudUpload.ts)

Continuous recording mainly needs: chunk-by-chunk IndexedDB writes + visibilitychange-triggered uploads.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Relying on beforeunload/unload Events
**What goes wrong:** Data loss on mobile, tab close, browser close
**Why it happens:** These events don't fire reliably - user switches apps, uses app manager to close browser, etc.
**How to avoid:** Use `visibilitychange` with `document.visibilityState === 'hidden'` as the trigger point
**Warning signs:** Data saves work in dev but fail in production on mobile

### Pitfall 2: Unexpectedly Large Chunks
**What goes wrong:** Upload fails with 413 (Request Entity Too Large) or timeout
**Why it happens:** Sleep/wake cycles, Safari pause/resume camera can produce chunks up to 50MB
**How to avoid:** Check chunk size, use `Blob.slice()` to split large chunks before upload
**Warning signs:** Sporadic upload failures, works most of the time but fails randomly

### Pitfall 3: Memory Exhaustion on Long Recordings
**What goes wrong:** Page becomes unresponsive, browser kills tab
**Why it happens:** Accumulating chunks in memory array for hours
**How to avoid:** Save each chunk to IndexedDB immediately, don't keep chunks array in memory
**Warning signs:** Memory usage grows linearly with recording duration

### Pitfall 4: Calculating Duration from Chunk Count
**What goes wrong:** Duration is wildly inaccurate
**Why it happens:** Timeslice is not exact - browser delays, sleep/wake, etc. can cause gaps
**How to avoid:** Keep separate timer using `Date.now()` or `Event.timeStamp`
**Warning signs:** 10-minute recording shows as 8 minutes or 15 minutes

### Pitfall 5: Not Handling Upload-Then-Delete Atomicity
**What goes wrong:** Data loss if crash between "uploaded" and "deleted from IndexedDB"
**Why it happens:** Upload succeeds, then crash before delete
**How to avoid:** Mark as "uploaded" first, delete only after confirmation, handle duplicates on server
**Warning signs:** Duplicate uploads, or missing recordings

### Pitfall 6: WebM Missing Duration Metadata
**What goes wrong:** Video player can't seek, shows "unknown duration"
**Why it happens:** MediaRecorder WebM doesn't include duration until recording stops
**How to avoid:** Use fix-webm-duration library if needed, or accept limitation for streaming-style playback
**Warning signs:** Playback works but seek bar is broken
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources and existing codebase:

### Existing MediaRecorder Setup (from useRecording.ts)
```typescript
// Source: Existing codebase - already handles MIME type detection
const getSupportedMimeType = (): string => {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
};
```

### Visibilitychange Handler (from MDN)
```typescript
// Source: MDN visibilitychange documentation
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Last reliable chance to save data
    // The user is navigating away, switching tabs, minimizing,
    // closing the tab, or on mobile switching apps
  }
});
```

### Chunk Size Handling (from AddPipe blog)
```typescript
// Source: AddPipe - handling unexpectedly large chunks
const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

function splitLargeChunk(blob: Blob): Blob[] {
  if (blob.size <= MAX_CHUNK_SIZE) {
    return [blob];
  }

  const chunks: Blob[] = [];
  let offset = 0;
  while (offset < blob.size) {
    chunks.push(blob.slice(offset, offset + MAX_CHUNK_SIZE));
    offset += MAX_CHUNK_SIZE;
  }
  return chunks;
}
```

### IndexedDB Chunk Storage (pattern from existing recordingStorage.ts)
```typescript
// Extend existing pattern for chunk-by-chunk storage
interface RecordingChunk {
  id?: number;
  sessionId: string;
  chunkIndex: number;
  blob: Blob;
  timestamp: number;
  uploaded: boolean;
}

async function saveChunk(chunk: Omit<RecordingChunk, 'id'>): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chunks'], 'readwrite');
    const store = transaction.objectStore('chunks');
    const request = store.add(chunk);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| beforeunload for saves | visibilitychange | 2020+ (recommended), 2025 (Chrome deprecating unload) | Must use visibilitychange |
| Memory-based chunk accumulation | IndexedDB progressive storage | Best practice | Prevents memory exhaustion |
| navigator.sendBeacon for upload | fetch + keepalive or regular upload on visibilitychange | N/A | sendBeacon has size limits, not for video |

**New tools/patterns to consider:**
- **Page Lifecycle API:** Chrome extension of visibilitychange with more states (frozen, discarded)
- **fetch keepalive:** Can survive page unload, but has 64KB limit per request - not suitable for video chunks

**Deprecated/outdated:**
- **unload event:** Chrome deprecating March 2025 - April 2026
- **beforeunload for data saves:** Only use for "unsaved changes" warning, not data persistence
- **Synchronous XHR in unload:** Blocked by browsers
</sota_updates>

<open_questions>
## Open Questions

Things that couldn't be fully resolved:

1. **Optimal chunk interval for continuous recording**
   - What we know: 1000ms (1 second) is current setting, produces ~75KB chunks for 1080p VP9
   - What's unclear: Is this optimal for continuous upload? Smaller = more requests, larger = more data at risk
   - Recommendation: Start with 5000ms (5 seconds), adjust based on testing. Larger chunks = fewer IndexedDB writes and uploads.

2. **Resume recording after visibility returns**
   - What we know: MediaRecorder doesn't resume after stop, must create new instance
   - What's unclear: Should we start new session or append to existing?
   - Recommendation: Start new session on each visibility cycle. Server can concatenate if needed.

3. **Handling very long recordings (hours)**
   - What we know: IndexedDB can handle large data, but browser quotas vary
   - What's unclear: Practical limits before storage quota issues
   - Recommendation: Add storage quota check, warn user if approaching limits. Auto-upload and delete old chunks.

4. **Concurrent manual and continuous recording**
   - What we know: Phase 9 will handle dual recording mode
   - What's unclear: How to share the stream without interference
   - Recommendation: Defer to Phase 9 research. For now, continuous recording is standalone.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) - Core API reference
- [MDN visibilitychange event](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event) - Page lifecycle
- [Chrome Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api) - Extended lifecycle states
- [Chrome deprecating unload](https://developer.chrome.com/docs/web-platform/deprecating-unload) - Timeline for unload deprecation

### Secondary (MEDIUM confidence)
- [AddPipe: Dealing with Huge MediaRecorder Chunks](https://blog.addpipe.com/dealing-with-huge-mediarecorder-slices/) - Chunk size variance, solutions
- [Mux: MediaRecorder Guide](https://www.mux.com/blog/how-to-use-mediarecorder) - Best practices
- [CloudThat: IndexedDB for Video Uploads](https://www.cloudthat.com/resources/blog/efficient-large-video-uploads-from-browser-to-amazon-s3-with-indexeddb) - Progressive storage pattern

### Tertiary (LOW confidence - needs validation)
- WebM vs MP4 compression ratios (varies by content type)
- Safari-specific MediaRecorder quirks (test on real devices)
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: MediaRecorder API, Page Lifecycle API
- Ecosystem: IndexedDB, visibilitychange, existing cloud upload
- Patterns: Progressive chunk storage, visibility-triggered upload
- Pitfalls: Page lifecycle, memory, chunk size variance

**Confidence breakdown:**
- Standard stack: HIGH - using browser native APIs + existing code
- Architecture: HIGH - patterns verified from official docs and production services
- Pitfalls: HIGH - documented issues from multiple sources
- Code examples: HIGH - from MDN and existing codebase

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - browser APIs are stable)
</metadata>

---

*Phase: 08-continuous-recording*
*Research completed: 2026-01-20*
*Ready for planning: yes*
