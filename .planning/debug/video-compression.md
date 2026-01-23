# Video Compression Optimization

## Date
2026-01-23

## Issue Description
Video uploads are taking too much space. Need to optimize file size while maintaining visual quality for form analysis.

## Requirements
- Target quality: SD (480p)
- Goal: Maximize space savings
- Use case: Form analysis/exercise feedback

## Current Implementation
Files to review:
- `src/hooks/useRecording.ts` - Manual recording hook
- `src/hooks/useContinuousRecording.ts` - Continuous recording hook

## Next Steps
1. Add video constraints for resolution (480p max)
2. Configure MediaRecorder bitrate limits
3. Consider video codec optimization (VP8 vs VP9)
4. Implement quality/bitrate controls

## Implementation Plan

### Options to Add:
- Resolution constraint: 640x480 (4:3) or 854x480 (16:9)
- Bitrate limit: 500-1000 kbps for 480p
- Codec preference: VP8 (better compatibility) or VP9 (better compression)
- Frame rate limit: 15-20 fps for form analysis
- Quality parameter for MediaRecorder

### Code Changes Needed:
1. Update video stream constraints when requesting camera
2. Add MediaRecorder options for bitrate/quality
3. Update recording hooks to use optimized settings