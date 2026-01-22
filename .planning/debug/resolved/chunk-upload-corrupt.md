---
status: verifying
trigger: "Continuous background recording uploads 5 chunks, only first plays in VLC, rest show black/nothing"
created: 2026-01-22T00:00:00Z
updated: 2026-01-22T00:10:00Z
---

## Current Focus

hypothesis: Fix applied - prepending init segment to each chunk should make them playable
test: TypeScript compilation passed, user needs to verify with real recording
expecting: All chunks (1-5) should now be playable in VLC
next_action: User verification - record, upload, download chunks, test in VLC

## Symptoms

expected: All 5 uploaded video chunks should play in VLC
actual: Only first chunk plays, chunks 2-5 open in VLC but show black/nothing
errors: User didn't check console during upload
reproduction: Run continuous recording for under 1 minute, let it upload 5 chunks, try to play each in VLC
started: Observed during recent session, unclear if it ever worked correctly

## Eliminated

[none yet]

## Evidence

- timestamp: 2026-01-22T00:01:00Z
  checked: useContinuousRecording.ts - MediaRecorder initialization
  found: Line 252 uses `mediaRecorder.start(5000)` with timeslice parameter
  implication: Chunks are created every 5 seconds using timeslice mode

- timestamp: 2026-01-22T00:02:00Z
  checked: MediaRecorder ondataavailable handler (lines 201-228)
  found: Each event.data blob is saved directly to IndexedDB as a separate chunk
  implication: Raw timeslice blobs are stored and uploaded - no processing or header prepending

- timestamp: 2026-01-22T00:03:00Z
  checked: cloudUpload.ts uploadChunk function
  found: Blob is uploaded directly with no transformation
  implication: Whatever MediaRecorder produces is what gets uploaded - upload path is not corrupting data

- timestamp: 2026-01-22T00:04:00Z
  checked: WebM container format knowledge
  found: WebM files require EBML header and Track/Segment info at the start. MediaRecorder with timeslice produces: Chunk 0 = EBML header + Segment info + Track info + Cluster(s). Chunks 1-N = Cluster(s) only.
  implication: This is the ROOT CAUSE - chunks 2-5 have no EBML/Track headers, so VLC cannot interpret them

- timestamp: 2026-01-22T00:05:00Z
  checked: W3C MediaRecorder API specification via web search
  found: "When multiple Blobs are returned (because of timeslice or requestData()), the individual Blobs need not be playable, but the combination of all the Blobs from a completed recording MUST be playable."
  implication: CONFIRMED - This is by design. Individual timeslice chunks are NOT guaranteed to be playable. Fix requires prepending init segment to each chunk.

- timestamp: 2026-01-22T00:10:00Z
  checked: Fix implementation in useContinuousRecording.ts
  found: Added helper functions for WebM init segment extraction and prepending; modified ondataavailable to process chunks
  implication: TypeScript compilation passes. Fix is structurally sound - extracts EBML header + Segment info + Tracks from chunk 0 and prepends to chunks 1-N.

## Resolution

root_cause: MediaRecorder with timeslice parameter produces DEPENDENT chunks, not standalone files. Only the first chunk contains the WebM initialization segment (EBML header, Segment info, Track info). Subsequent chunks contain only Cluster elements with raw media data. Without the init segment, players cannot decode the video because they don't know the codec, dimensions, frame rate, etc. This is per W3C spec - "individual Blobs need not be playable."
fix: Modified useContinuousRecording.ts to:
1. Added findClusterOffset() - finds WebM Cluster element (0x1F43B675) offset
2. Added extractInitSegment() - extracts EBML header + Segment info + Track info from first chunk
3. Added prependInitSegment() - prepends init segment to chunk data
4. Added initSegmentRef to store the init segment during session
5. Modified ondataavailable handler:
   - Chunk 0: Extract init segment and save to ref, save full chunk as-is
   - Chunks 1-N: Prepend init segment before saving to IndexedDB
6. Reset initSegmentRef when starting new session
verification: TypeScript compilation passes. Awaiting user verification with real recording test.
files_changed:
  - src/hooks/useContinuousRecording.ts
