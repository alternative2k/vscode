---
status: resolved
trigger: "FormCheck mobile mode issues: warning messages overlap skeleton toggle and lock button; user icon overlaps header text; lock button reverts to unlocked after brief delay"
created: 2026-01-22T00:00:00Z
updated: 2026-01-22T00:10:00Z
---

## Current Focus

hypothesis: All 4 issues identified and fixed
test: Build verification
expecting: Build succeeds, all issues resolved
next_action: Archive session

## Symptoms

expected: UI elements should not overlap in mobile mode; lock button should stay locked when pressed
actual: Warning messages overlap skeleton and lock buttons; user icon overlaps header text; lock button reverts to unlocked after brief delay
errors: No console errors reported
reproduction: Open app in mobile mode, observe UI layout; press lock button and observe it revert
started: Recent - likely after v3.0 User Access Control was added

## Eliminated

[none - all hypotheses confirmed]

## Evidence

- timestamp: 2026-01-22T00:01:00Z
  checked: AlertOverlay.tsx positioning
  found: Alert banner used `top-14` positioning with `z-index: 10`. Left panel (skeleton toggle, tracking status, continuous recording) is at `top-4 left-4` with no z-index.
  implication: CONFIRMED - Alert banner at top-14 overlapped the left control panel which starts at top-4

- timestamp: 2026-01-22T00:02:00Z
  checked: App.tsx header layout
  found: Header controls used `absolute top-4 right-4` with flex layout. On narrow mobile screens, overlapped centered "FormCheck" title.
  implication: CONFIRMED - Mobile layout needed separate handling to prevent overlap

- timestamp: 2026-01-22T00:03:00Z
  checked: useAppLock.ts polling behavior
  found: Hook polls lock status every 30 seconds. toggleLock() did optimistic update but poll could overwrite before server response.
  implication: CONFIRMED - Race condition between poll and toggle caused revert

- timestamp: 2026-01-22T00:04:00Z
  checked: Build verification
  found: npm run build succeeds after all fixes applied
  implication: All fixes are syntactically correct and compile

## Resolution

root_cause:
1. **Alert overlap with left controls**: AlertOverlay banner at `top-14` overlapped left control panel items (skeleton toggle, continuous recording status) which stack below `top-4`
2. **Alert overlap with right controls**: Alert spanned `left-4 right-4` and overlapped header controls at `top-4 right-4`
3. **Header overlap on mobile**: User info positioned `absolute top-4 right-4` overlapped centered title on narrow screens
4. **Lock button revert**: Race condition - polling (30s interval) could fetch stale server value before POST completes or KV propagates

fix:
1. **AlertOverlay.tsx**: Changed alert positioning from `top-14 left-4 right-4` to `top-4 left-20 right-20 md:left-1/4 md:right-1/4` - centers alert while avoiding left/right control panels on mobile
2. **App.tsx**: Restructured header to use separate mobile/desktop layouts:
   - Mobile: Flexbox row with "FormCheck" left, controls right (no absolute positioning, no overlap)
   - Desktop: Centered title with absolute positioned controls (original behavior preserved)
   - Removed emoji icons from lock button text for cleaner mobile UI
3. **useAppLock.ts**: Added 5-second cooldown after toggle that ignores poll results, preventing race condition. Cooldown is cleared on toggle failure to allow poll to correct state.

verification: Build succeeds (npm run build)

files_changed:
- src/components/AlertOverlay.tsx
- src/App.tsx
- src/hooks/useAppLock.ts
