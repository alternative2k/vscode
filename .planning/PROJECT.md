# FormCheck

## What This Is

A web app that uses your device camera to record video and provide real-time exercise form feedback. Shows a skeleton overlay with posture alerts for squats, push-ups, and general positioning. Works on laptops and mobile browsers, with recordings saved locally and uploadable to user-configured S3 storage.

## Core Value

Real-time visual feedback on exercise form — the skeleton overlay and posture alerts must work reliably so users can self-correct during workouts.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Camera access with live video preview (laptop + mobile browsers)
- [ ] Body tracking with skeleton overlay drawn on live video
- [ ] Posture alerts for squat form (knee angle, back straightness, depth)
- [ ] Posture alerts for push-up form (body alignment, elbow angle, depth)
- [ ] General posture flagging for obviously wrong positions
- [ ] Video recording (clean video without overlay burned in)
- [ ] Local save of recordings
- [ ] Upload to user-configured S3 storage
- [ ] Simple authentication for small group access
- [ ] Modern, clean UI that works on desktop and mobile
- [ ] Deployable to free/cheap static hosting

### Out of Scope

- Backend storage (users provide their own S3) — keeps hosting costs zero
- Complex user management (simple auth only) — small group doesn't need it
- Overlay burned into recordings — user wants clean video files
- Rep counting or joint angle stats — posture alerts are the focus
- Native mobile apps — web app covers both platforms

## Context

Target users are a small group who want to check their exercise form during workouts. The app needs to run in-browser using the device camera, with body pose detection handled client-side (likely MediaPipe or TensorFlow.js PoseNet).

S3 upload means users configure their own bucket credentials, keeping the app fully static with no backend costs. Authentication can be lightweight — possibly a simple password gate or basic OAuth for the small group.

The body tracking libraries run entirely in-browser, making this deployable as a static site to Vercel, Netlify, or GitHub Pages for free.

## Constraints

- **Hosting**: Must run on free tier static hosting (Vercel, Netlify, GitHub Pages)
- **Storage**: No backend storage — users provide S3 credentials
- **Browser compatibility**: Must work on modern Chrome, Safari, Firefox on desktop and mobile
- **Client-side processing**: All pose detection runs in browser (no server-side ML)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| User-configured S3 for uploads | Zero storage costs, users own their data | — Pending |
| Live overlay only, clean recordings | Simpler implementation, more flexible output | — Pending |
| Client-side pose detection | No backend needed, free hosting, privacy | — Pending |
| Web app over native | Single codebase covers laptop + mobile | — Pending |

---
*Last updated: 2026-01-15 after initialization*
