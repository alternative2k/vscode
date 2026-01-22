# Phase 15: User Access Control - Research

**Researched:** 2026-01-22
**Domain:** React authentication + access control for browser-based app
**Confidence:** HIGH

<research_summary>
## Summary

Researched multi-user access control options for FormCheck, a React/Vite/TypeScript app currently using a single shared password stored in localStorage.

The app has no backend - it's a static site (Cloudflare Pages/Vercel). This constrains options significantly. True secure multi-user auth requires a backend for password hashing and session management. However, there are pragmatic client-side approaches for small group access that work with the current architecture.

**Primary recommendation:** For your use case (small group access, time-based restrictions), use a **multi-password system with optional time windows** stored in environment variables. This extends the current pattern efficiently without requiring a backend.
</research_summary>

<current_system>
## Current Authentication System

**Location:** `src/hooks/useAuth.ts` + `src/components/PasswordGate.tsx`

**How it works:**
- Single password from `VITE_APP_PASSWORD` env var (default: 'formcheck2024')
- Validates client-side, stores `formcheck_authed: 'true'` in localStorage
- Session persists across browser restarts (convenience auth, not security)
- No user identity - everyone is anonymous once authenticated
- Logout clears localStorage

**Limitations for multi-user:**
- Single shared password = no user differentiation
- No tracking of who did what
- No time-based restrictions
- No per-user settings or recording attribution
</current_system>

<options_analysis>
## Options Analysis

### Option 1: Multi-Password System (Recommended)
**What:** Multiple passwords in env config, each optionally tied to a user name and time window
**Effort:** Low (extend existing pattern)
**Security:** Same as current (client-side, obfuscated but not secure)

```typescript
// .env config format
VITE_USERS='[
  {"name": "Sean", "password": "sean2024", "allowedHours": null},
  {"name": "Guest", "password": "guest123", "allowedHours": {"start": 9, "end": 17}}
]'
```

**Pros:**
- Works with current static deployment (no backend needed)
- Easy to add/remove users via env vars
- Can attribute recordings to users
- Can restrict access by time window
- Familiar pattern - just extends existing auth

**Cons:**
- Passwords visible in JS bundle (obfuscation only, not secure)
- Can't revoke access instantly (need redeploy)
- Limited to what's in env at build time

### Option 2: Simple Backend Auth Service
**What:** Add a small API (Cloudflare Worker, Vercel Function) for user validation
**Effort:** Medium (new backend component)
**Security:** Higher (passwords never in client bundle)

**Pros:**
- Passwords hashed and stored server-side
- Can add/remove users without redeploy
- True session management possible
- Foundation for future features (quotas, audit logs)

**Cons:**
- Additional infrastructure to maintain
- Adds complexity
- Requires database or KV store for users

### Option 3: Third-Party Auth (Auth0, Clerk, Supabase Auth)
**What:** Integrate existing auth provider
**Effort:** Medium-High (external dependency)
**Security:** Highest (managed by experts)

**Pros:**
- Production-grade security
- OAuth/SSO support
- Admin dashboard for user management
- Magic links, MFA, etc.

**Cons:**
- Overkill for small group access
- External dependency and potential costs
- More complex integration

### Option 4: Frontend-Only RBAC Libraries
**What:** Use react-access-control or permify/react-role
**Effort:** Low-Medium
**Security:** Same as current (client-side only)

**Pros:**
- Established patterns
- Role-based access out of the box

**Cons:**
- Still need authentication layer (these handle authorization, not authentication)
- Roles visible in client (not secure)
</options_analysis>

<recommendation>
## Recommendation: Option 1 - Multi-Password System

For your stated goals:
1. **"Allow different people to use it"** → Multiple passwords, each tied to a name
2. **"Restrict when people can use the app"** → Optional time window per user
3. **"Work with current system"** → Extends existing useAuth pattern
4. **"Not too hard to create"** → ~50-100 lines of code changes
5. **"Must be efficient"** → No additional infrastructure, no API calls

### Proposed Design

**Configuration (build-time via env):**
```
VITE_USERS=[{"name":"Sean","pw":"sean2024"},{"name":"Guest","pw":"guest123","hours":{"from":9,"to":17}}]
```

**Authentication flow:**
1. User enters password in PasswordGate
2. `useAuth` checks password against all configured users
3. On match: store `{name, authenticatedAt}` in localStorage (not just 'true')
4. If user has time restriction, validate current hour
5. Show user name in header, attribute recordings to user

**Time restriction logic:**
- Check on initial login
- Optional: periodic re-check while app is open
- Outside allowed hours → show "Access restricted" message

**Recording attribution:**
- Add `userName` field to `StoredRecording` interface
- Add `userName` to `ContinuousSession` interface
- Filter recordings by user in history view (optional)
</recommendation>

<implementation_outline>
## Implementation Outline

### Files to Modify

1. **`src/hooks/useAuth.ts`** - Core changes
   - Parse `VITE_USERS` JSON config
   - Match password against user list
   - Store user identity (not just boolean)
   - Add time window validation
   - Export current user name

2. **`src/components/PasswordGate.tsx`** - Minor UI updates
   - Show time restriction message if applicable
   - Optional: show "Welcome, {name}" after login

3. **`src/types/recording.ts`** - Add user field
   - Add `userName?: string` to `StoredRecording`
   - Add `userName?: string` to `ContinuousSession`

4. **`src/hooks/useRecording.ts`** - Pass user
   - Include `userName` when saving recordings

5. **`src/hooks/useContinuousRecording.ts`** - Pass user
   - Include `userName` when saving sessions/chunks

6. **`src/App.tsx`** - Show user in header
   - Display logged-in user name
   - Pass user context down

7. **`.env.example`** - Document new config
   - Add `VITE_USERS` example

### Estimated Scope
- ~100-150 lines of code changes
- 1 plan to execute
- No new dependencies
- No infrastructure changes
</implementation_outline>

<time_restrictions>
## Time Restriction Feature Detail

### Configuration Format
```json
{
  "name": "Guest",
  "password": "guest123",
  "allowedHours": {
    "start": 9,
    "end": 17,
    "timezone": "local"
  }
}
```

### Validation Logic
```typescript
function isWithinAllowedHours(user: UserConfig): boolean {
  if (!user.allowedHours) return true; // No restriction

  const now = new Date();
  const hour = now.getHours(); // Local timezone

  const { start, end } = user.allowedHours;

  // Handle overnight ranges (e.g., 22-6)
  if (start > end) {
    return hour >= start || hour < end;
  }

  return hour >= start && hour < end;
}
```

### UX Considerations
- Show clear message when access is time-restricted
- Display allowed hours to user
- Option: countdown to when access opens
- Consider: 5-minute grace period at boundaries?
</time_restrictions>

<security_notes>
## Security Notes

**This is NOT secure authentication.**

All passwords are embedded in the JavaScript bundle at build time. Anyone with browser dev tools can extract them. This is **obfuscation for casual restriction**, not security.

**Acceptable for:**
- Small group of trusted users
- Preventing accidental public access
- Basic usage attribution

**NOT acceptable for:**
- Sensitive data protection
- Billing or payment features
- Compliance requirements
- Public-facing apps with untrusted users

**If you need real security later:**
- Add a backend auth service (Cloudflare Worker + D1/KV)
- Use third-party auth (Clerk, Auth0, Supabase)
- Current recordings in IndexedDB remain browser-local (not shared)
</security_notes>

<alternative_approaches>
## Alternative Approaches Considered

### Invite Codes Instead of Passwords
Generate unique codes per user, validate against list. Same security level but feels more "invitation-like."

### Time-Based One-Time Passwords (TOTP)
Use authenticator apps (Google Authenticator). Requires shared secret setup, more complex but no password to remember.

### IP-Based Restrictions
Allow access only from certain IPs. Requires backend or CDN-level rules. Breaks on mobile/dynamic IPs.

### Magic Links (Email)
Send login link to email. Requires backend email service. Better UX but more infrastructure.

**Verdict:** Multi-password system is simplest for your stated requirements.
</alternative_approaches>

<sources>
## Sources

### Primary (HIGH confidence)
- Current codebase analysis: `src/hooks/useAuth.ts`, `src/components/PasswordGate.tsx`
- Vite environment variables documentation

### Secondary (MEDIUM confidence)
- [JWT Storage in React: Local Storage vs Cookies](https://cybersierra.co/blog/react-jwt-storage-guide/) - Security considerations
- [React Role (Permify)](https://permify.co/post/open-source-implement-role-based-access-management-with-permify-react-role/) - Frontend RBAC patterns
- [LogRocket JWT Best Practices](https://blog.logrocket.com/jwt-authentication-best-practices/) - When localStorage is acceptable
- [Jason Watmore's Tutorial](https://jasonwatmore.com/post/2019/02/01/react-role-based-authorization-tutorial-with-example) - Fake backend pattern for client-side auth
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: React client-side auth
- Ecosystem: localStorage, env vars, no backend
- Patterns: Multi-password, time-based access
- Pitfalls: Security limitations of client-side auth

**Confidence breakdown:**
- Current system analysis: HIGH - read actual code
- Recommended approach: HIGH - extends proven pattern
- Security assessment: HIGH - well-documented limitations
- Implementation estimate: HIGH - straightforward changes

**Research date:** 2026-01-22
**Valid until:** Indefinite (commodity pattern, stable)
</metadata>

---

*Phase: 15-user-access-control*
*Research completed: 2026-01-22*
*Ready for planning: yes*
