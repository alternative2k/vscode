# Phase 15: User Access Control - Research

**Researched:** 2026-01-22
**Domain:** React authentication + admin-controlled access for browser-based app
**Confidence:** HIGH

<research_summary>
## Summary

Researched multi-user access control for FormCheck with these specific requirements:
1. **Admin account** can lock/unlock app for all other users
2. **User folders** in cloud storage based on unique user identifier
3. **Easy user management** - simple way to add new users

The app has no backend currently. For admin-controlled app locking and dynamic user management, we need **minimal backend state** - but it can be very lightweight (a single JSON file or KV entry).

**Primary recommendation:** Use **localStorage-synced lock state** with a Cloudflare KV flag that admin can toggle. Users are defined in env vars with unique IDs. Cloud uploads go to `userId/date/session/` folder structure.
</research_summary>

<current_system>
## Current System Analysis

**Authentication:** `src/hooks/useAuth.ts` + `src/components/PasswordGate.tsx`
- Single password from `VITE_APP_PASSWORD` env var
- Stores `formcheck_authed: 'true'` in localStorage
- No user identity, no roles

**Cloud Upload:** `src/utils/cloudUpload.ts`
- Current path structure: `{date}/{sessionId}/chunk-XXXX.webm`
- Example: `2026-01-21/abc-123/chunk-0001.webm`
- Uses presigned URLs from `/api/upload-url` Pages Function
- Easy to prepend user folder to path

**Pages Function:** `/api/upload-url`
- Already exists for R2 presigned URL generation
- Can be extended to check lock status from KV
</current_system>

<refined_requirements>
## Refined Requirements

### From User Feedback:
1. **Global app lock** - Admin can lock app for ALL non-admin users (not per-user time windows)
2. **Admin account** - Special account that can toggle lock and always has access
3. **User folders** - Each user gets unique ID used in cloud path: `{userId}/{date}/{session}/`
4. **Easy user management** - Adding users should be simple

### Derived Requirements:
- Need persistent lock state (survives page refresh, works across browsers)
- Need admin UI to toggle lock
- Need user identity with unique ID (not just name)
- Lock check must happen at app load and periodically
</refined_requirements>

<architecture_options>
## Architecture Options

### Option A: KV-Based Lock + Env Users (Recommended)
**Lock state:** Cloudflare KV (single boolean key)
**User list:** Environment variables at build time
**Effort:** Low-Medium

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Pages Function  │────▶│ Cloudflare  │
│  (React)    │     │  /api/app-lock   │     │     KV      │
└─────────────┘     └──────────────────┘     └─────────────┘
      │                                            │
      │ Check lock on load                         │
      │ Admin can toggle                           │
      └────────────────────────────────────────────┘
```

**User config (.env):**
```
VITE_USERS='[
  {"id": "sean", "name": "Sean", "password": "sean2024", "isAdmin": true},
  {"id": "guest1", "name": "Guest", "password": "guest123", "isAdmin": false}
]'
```

**Cloud path becomes:** `sean/2026-01-22/session-abc/chunk-0001.webm`

**Pros:**
- Lock is instant (no redeploy)
- KV is free tier on Cloudflare
- Simple single API endpoint
- Users still defined at build time (secure-ish)

**Cons:**
- Adding users requires redeploy
- Passwords still in bundle

### Option B: Full KV Users + Lock
**Lock state:** Cloudflare KV
**User list:** Also in Cloudflare KV (admin can add/remove)
**Effort:** Medium

**Pros:**
- Admin can add users without redeploy
- More dynamic

**Cons:**
- More complex API
- Need admin UI for user management
- Passwords stored in KV (need hashing)

### Option C: Supabase/Firebase Auth
**Lock state:** Database flag
**User list:** Managed by auth provider
**Effort:** High

**Pros:**
- Proper security
- Full user management UI
- Password hashing, sessions, etc.

**Cons:**
- Overkill for small group
- External dependency
- More complex integration
</architecture_options>

<recommendation>
## Recommendation: Option A - KV Lock + Env Users

Best balance of your requirements:

| Requirement | Solution |
|-------------|----------|
| Admin can lock app | KV flag toggled via API |
| Lock affects all users | Single global flag checked on load |
| User folders in cloud | User ID from config in upload path |
| Easy to add users | Edit .env and redeploy (or Option B later) |

### Proposed Design

**User Configuration:**
```typescript
interface UserConfig {
  id: string;        // Unique ID for folder: "sean", "john", "guest1"
  name: string;      // Display name: "Sean"
  password: string;  // Login password
  isAdmin: boolean;  // Can toggle lock, immune to lock
}
```

**Lock State (KV):**
```typescript
// Key: "app-locked"
// Value: { locked: boolean, lockedBy: string, lockedAt: string }
{
  "locked": true,
  "lockedBy": "sean",
  "lockedAt": "2026-01-22T10:30:00Z"
}
```

**Authentication Flow:**
1. User enters password → match against user list → get user object
2. Store `{ id, name, isAdmin, authenticatedAt }` in localStorage
3. Check KV lock status via `/api/app-lock`
4. If locked AND not admin → show "App locked by admin" message
5. If admin → show lock/unlock toggle in header

**Cloud Upload Path:**
```typescript
// Current: {date}/{sessionId}/chunk-XXXX.webm
// New:     {userId}/{date}/{sessionId}/chunk-XXXX.webm

function getUploadPath(userId: string, sessionId: string, chunkIndex: number): string {
  const date = new Date().toISOString().split('T')[0];
  return `${userId}/${date}/${sessionId}/chunk-${String(chunkIndex).padStart(4, '0')}.webm`;
}
```

**Result in R2:**
```
formcheck-bucket/
├── sean/
│   ├── 2026-01-22/
│   │   ├── session-abc/
│   │   │   ├── chunk-0001.webm
│   │   │   └── chunk-0002.webm
│   │   └── session-def/
│   │       └── chunk-0001.webm
│   └── 2026-01-23/
│       └── ...
├── guest1/
│   └── 2026-01-22/
│       └── ...
```
</recommendation>

<implementation_outline>
## Implementation Outline

### New Files

1. **`functions/api/app-lock.ts`** - Pages Function for lock state
   ```typescript
   // GET: Return current lock status
   // POST: Toggle lock (admin only, check password)
   ```

### Files to Modify

1. **`src/hooks/useAuth.ts`** - Major changes
   - Parse `VITE_USERS` JSON array
   - Return full user object (id, name, isAdmin)
   - Add `checkLockStatus()` function
   - Add `toggleLock()` function for admin

2. **`src/components/PasswordGate.tsx`** - Show lock message
   - After auth, check lock status
   - Show "App locked by admin" if locked and not admin

3. **`src/App.tsx`** - Admin controls
   - Show lock toggle button for admin users
   - Display current user name

4. **`src/utils/cloudUpload.ts`** - Add userId to paths
   - `uploadChunk()` takes userId parameter
   - `uploadToCloud()` takes userId parameter
   - Modify path generation

5. **`src/hooks/useCloudUpload.ts`** - Pass userId
   - Accept userId from auth context
   - Pass to upload functions

6. **`src/hooks/useContinuousRecording.ts`** - Pass userId
   - Include userId in upload calls

7. **`src/types/auth.ts`** (new) - Type definitions
   ```typescript
   interface User {
     id: string;
     name: string;
     isAdmin: boolean;
   }

   interface LockStatus {
     locked: boolean;
     lockedBy?: string;
     lockedAt?: string;
   }
   ```

8. **`.env.example`** - Document new config

### Estimated Scope
- ~200-250 lines of code changes
- 1 new Pages Function (~50 lines)
- 1-2 plans to execute
- No new npm dependencies
</implementation_outline>

<user_management>
## User Management Options

### Current Approach (Env Vars)
**Adding a user:**
1. Edit `.env` or deployment env vars
2. Add user to `VITE_USERS` array
3. Redeploy

**Pros:** Simple, no UI needed
**Cons:** Requires redeploy

### Future Enhancement: Admin Panel
If you want admin to add users without redeploy:

1. Store users in Cloudflare KV (not env)
2. Add `/api/users` endpoint (CRUD)
3. Add admin UI panel
4. Hash passwords server-side

This is Option B - more complex but more dynamic. Can be added later.

### Simplest Alternative: Shared Invite Code
Instead of individual passwords:
1. Admin has unique password
2. All other users share one "invite code"
3. System generates unique ID on first login (stored in localStorage)

**Pros:** No user management needed
**Cons:** Can't revoke specific users, IDs not human-readable
</user_management>

<lock_mechanism>
## Lock Mechanism Detail

### KV Structure
```typescript
// Cloudflare KV namespace: FORMCHECK_CONFIG
// Key: "app-locked"
interface LockState {
  locked: boolean;
  lockedBy: string;    // Admin user ID who locked
  lockedAt: string;    // ISO timestamp
  message?: string;    // Optional message to show users
}
```

### API Endpoint: `/api/app-lock`

**GET** - Check lock status (anyone can call)
```typescript
// Response
{ locked: false }
// or
{ locked: true, lockedBy: "sean", lockedAt: "2026-01-22T10:30:00Z" }
```

**POST** - Toggle lock (admin only)
```typescript
// Request
{ action: "lock" | "unlock", adminId: string, adminPassword: string }

// Response
{ success: true, locked: true }
```

### Client-Side Behavior
1. **On app load:** Fetch `/api/app-lock`
2. **If locked + not admin:** Show lock screen, don't load main app
3. **Periodic check:** Every 60 seconds while app is open
4. **Admin toggle:** POST to endpoint, update local state
</lock_mechanism>

<security_notes>
## Security Notes

**Same limitations as before:**
- Passwords in JS bundle (obfuscation, not security)
- Client-side lock check can be bypassed by determined user
- Suitable for trusted small group only

**Improvements over current:**
- Lock state is server-side (KV) - can't be bypassed by clearing localStorage
- Admin identity verified server-side for lock toggle
- User IDs create audit trail in cloud storage

**If you need real security:**
- Move to backend auth (Option B or C)
- Hash passwords server-side
- Use JWT tokens instead of localStorage
</security_notes>

<sources>
## Sources

### Primary (HIGH confidence)
- Current codebase: `src/hooks/useAuth.ts`, `src/utils/cloudUpload.ts`
- Cloudflare KV documentation
- Cloudflare Pages Functions documentation

### Secondary (MEDIUM confidence)
- [Cloudflare KV bindings](https://developers.cloudflare.com/workers/runtime-apis/kv/) - KV usage patterns
- [JWT Best Practices](https://blog.logrocket.com/jwt-authentication-best-practices/) - Security considerations
</sources>

<metadata>
## Metadata

**Research scope:**
- Core: React auth with admin role
- Ecosystem: Cloudflare KV for state, Pages Functions for API
- Patterns: Global lock flag, user-prefixed cloud paths
- Pitfalls: Client-side security limitations

**Confidence breakdown:**
- Current system analysis: HIGH - read actual code
- Recommended approach: HIGH - uses existing Cloudflare infrastructure
- Implementation estimate: HIGH - straightforward extension
- Security assessment: HIGH - known limitations documented

**Research date:** 2026-01-22
**Valid until:** Indefinite (commodity patterns)
</metadata>

---

*Phase: 15-user-access-control*
*Research completed: 2026-01-22*
*Ready for planning: yes*
