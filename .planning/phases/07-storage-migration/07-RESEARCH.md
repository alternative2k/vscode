# Phase 7: Storage Migration - Research

**Researched:** 2026-01-20
**Domain:** Browser-based video uploads with secure cloud storage (Cloudflare R2 vs Supabase Storage)
**Confidence:** HIGH

<research_summary>
## Summary

Researched secure frontend-compatible storage solutions to replace the current S3 implementation which exposes AWS credentials in localStorage. The current approach (`src/utils/s3Upload.ts`) uses direct PUT requests with credentials in the browser — a security anti-pattern that requires a backend for secure uploads.

**Key finding:** Both Cloudflare R2 and Supabase Storage solve this problem with presigned URLs, but Cloudflare R2 is the clear winner for this project due to:
1. **Zero egress fees** — critical for video files that will be downloaded/streamed
2. **Generous free tier** — 10GB storage, 1M Class A ops/month, unlimited egress (vs Supabase's 1GB storage, 10GB bandwidth)
3. **S3-compatible API** — minimal code changes from existing S3 patterns
4. **Cloudflare Pages Functions** — can generate presigned URLs without a separate backend

**Primary recommendation:** Use Cloudflare R2 with Pages Functions for presigned URL generation. The frontend requests a presigned upload URL from the Pages Function, then uploads directly to R2. Credentials stay server-side.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| aws4fetch | 1.0.20+ | Generate presigned URLs in Workers/Pages Functions | Workers-compatible, uses fetch + SubtleCrypto APIs |
| Cloudflare R2 | N/A | Object storage | Zero egress, S3-compatible, generous free tier |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| hono | 4.x | Lightweight API framework for Pages Functions | If you need routing in the function |
| wrangler | 4.x | Cloudflare CLI for deployment | Local dev, deployment |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare R2 | Supabase Storage | Supabase has better DX for auth-integrated apps but 10GB bandwidth limit on free tier kills video use case |
| Cloudflare R2 | AWS S3 | S3 requires backend for secure uploads, has egress fees |
| aws4fetch | AWS SDK v3 | AWS SDK v3 not Workers-compatible (uses DOMParser) |
| Pages Functions | Cloudflare Workers | Both use same runtime; Pages Functions simpler for this project's structure |

**Installation:**
```bash
npm install aws4fetch
# R2 is configured via Cloudflare dashboard, not npm
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   └── useCloudUpload.ts    # Replaces useS3Upload, uses presigned URLs
├── utils/
│   └── cloudUpload.ts       # Upload logic, replaces s3Upload.ts
├── types/
│   └── cloud.ts             # Replaces s3.ts types
└── components/
    └── CloudConfigModal.tsx # Simplified - just enable/disable, no credentials

functions/                   # Cloudflare Pages Functions directory
└── api/
    └── upload-url.ts        # Generates presigned upload URLs
```

### Pattern 1: Presigned URL Upload Flow
**What:** Frontend requests upload URL from Pages Function, uploads directly to R2
**When to use:** All file uploads from browser
**Example:**
```typescript
// Frontend: Request presigned URL
const response = await fetch('/api/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'recording-123.webm',
    contentType: 'video/webm'
  })
});
const { uploadUrl } = await response.json();

// Frontend: Upload directly to R2
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'video/webm' },
  body: videoBlob
});
```

### Pattern 2: Pages Function for Presigned URL Generation
**What:** Cloudflare Pages Function generates presigned URLs using aws4fetch
**When to use:** Any operation requiring R2 credentials
**Example:**
```typescript
// functions/api/upload-url.ts
import { AwsClient } from 'aws4fetch';

export async function onRequestPost(context) {
  const { fileName, contentType } = await context.request.json();

  const client = new AwsClient({
    service: 's3',
    region: 'auto',
    accessKeyId: context.env.R2_ACCESS_KEY_ID,
    secretAccessKey: context.env.R2_SECRET_ACCESS_KEY,
  });

  const R2_URL = `https://${context.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `${R2_URL}/${context.env.R2_BUCKET_NAME}/${fileName}?X-Amz-Expires=3600`;

  const signedRequest = await client.sign(
    new Request(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    }),
    { aws: { signQuery: true } }
  );

  return new Response(JSON.stringify({
    uploadUrl: signedRequest.url.toString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Pattern 3: CORS Configuration for R2
**What:** Allow browser uploads to R2 bucket
**When to use:** Required for any presigned URL upload from browser
**Example:**
```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:5173"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Anti-Patterns to Avoid
- **Storing credentials in frontend:** Current S3Config in localStorage exposes secrets
- **Using wildcard CORS headers:** `AllowedHeaders: ["*"]` doesn't work on R2
- **AWS SDK v3 in Workers:** Not compatible, use aws4fetch instead
- **Missing Content-Type in signature:** Causes 403 errors if upload uses different Content-Type
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AWS Signature V4 signing | Custom signing logic | aws4fetch | Complex algorithm, easy to get wrong, security-critical |
| Presigned URL generation | Manual URL construction | aws4fetch `client.sign()` | Handles all edge cases, timing, encoding |
| Retry logic with backoff | Custom retry loops | Existing pattern in codebase is fine | Already implemented in s3Upload.ts |
| Progress tracking | Custom XHR progress | XMLHttpRequest.upload.onprogress | Already works, keep it |

**Key insight:** The current `s3Upload.ts` upload logic (XHR with progress, retry with backoff) is solid. The problem is credential exposure and the need for a public bucket. The fix is adding a presigned URL layer, not rewriting upload logic.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: CORS Wildcard Headers
**What goes wrong:** `AllowedHeaders: ["*"]` doesn't work on R2, uploads fail with CORS errors
**Why it happens:** R2 doesn't support wildcard for AllowedHeaders like AWS S3 does
**How to avoid:** Explicitly list all headers: `["Content-Type", "Content-Length"]`
**Warning signs:** Browser console shows CORS preflight failures

### Pitfall 2: Missing Content-Type in Presigned URL
**What goes wrong:** Upload returns 403 Forbidden
**Why it happens:** If Content-Type is in signature but upload uses different type
**How to avoid:** Include `Content-Type` header when signing AND ensure frontend sends same type
**Warning signs:** 403 errors only for some uploads, works in curl but not browser

### Pitfall 3: r2.dev Rate Limiting
**What goes wrong:** 429 Too Many Requests errors in production
**Why it happens:** Using r2.dev subdomain for production instead of custom domain
**How to avoid:** r2.dev is for testing only. Use presigned URLs with S3 API endpoint for production
**Warning signs:** Works locally, fails under load

### Pitfall 4: Presigned URL Expiration
**What goes wrong:** Large video uploads fail partway through
**Why it happens:** URL expires during upload (default can be short)
**How to avoid:** Use adequate expiration (3600 seconds for videos up to ~100MB)
**Warning signs:** Uploads work for small files, fail for large ones

### Pitfall 5: Credential Exposure in Git
**What goes wrong:** R2 credentials committed to repo
**Why it happens:** Forgetting to add env files to .gitignore
**How to avoid:** Use wrangler secrets, never store in code. Add `.dev.vars` to .gitignore
**Warning signs:** Cloudflare dashboard shows unauthorized access
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Generate Presigned Upload URL (Pages Function)
```typescript
// Source: Cloudflare R2 docs - aws4fetch example
import { AwsClient } from 'aws4fetch';

interface Env {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  CF_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { fileName, contentType } = await context.request.json();

  const client = new AwsClient({
    service: 's3',
    region: 'auto',
    accessKeyId: context.env.R2_ACCESS_KEY_ID,
    secretAccessKey: context.env.R2_SECRET_ACCESS_KEY,
  });

  const R2_URL = `https://${context.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const objectKey = `formcheck/${fileName}`;
  const url = `${R2_URL}/${context.env.R2_BUCKET_NAME}/${objectKey}?X-Amz-Expires=3600`;

  const signedRequest = await client.sign(
    new Request(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    }),
    { aws: { signQuery: true } }
  );

  return new Response(JSON.stringify({
    uploadUrl: signedRequest.url.toString(),
    objectKey,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Frontend Upload with Progress (Modified from existing pattern)
```typescript
// Source: Existing s3Upload.ts pattern, modified for presigned URLs
export async function uploadToCloud(
  blob: Blob,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // 1. Get presigned URL from Pages Function
  const response = await fetch('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName,
      contentType: blob.type || 'video/webm',
    }),
  });

  if (!response.ok) {
    return { success: false, error: 'Failed to get upload URL' };
  }

  const { uploadUrl, objectKey } = await response.json();

  // 2. Upload directly to R2 (reuse existing XHR pattern for progress)
  return attemptUpload(blob, uploadUrl, onProgress);
}
```

### CORS Configuration for R2 Bucket
```json
// Source: Cloudflare R2 docs - CORS configuration
[
  {
    "AllowedOrigins": [
      "https://formcheck.example.com",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AWS SDK v3 in Workers | aws4fetch | 2023+ | SDK not Workers-compatible, aws4fetch is the standard |
| Public bucket with credentials | Presigned URLs | Always best practice | Security - credentials never leave server |
| S3 direct | R2 for video | 2023+ | Zero egress fees make video storage viable |
| Separate backend API | Pages Functions | 2024+ | Can deploy with frontend, no separate infra |

**New tools/patterns to consider:**
- **Cloudflare Pages Functions**: Serverless functions bundled with frontend deployment
- **R2 Super Slurper**: Migrate existing S3 data to R2 (if needed for existing recordings)

**Deprecated/outdated:**
- **AWS SDK v3 in Workers/Functions**: Not compatible, use aws4fetch
- **Exposing credentials in frontend**: Never acceptable, even for "trusted" apps
</sota_updates>

<open_questions>
## Open Questions

Things that couldn't be fully resolved:

1. **File size limits for presigned URL uploads**
   - What we know: R2 supports objects up to 5TB, presigned URLs work for large files
   - What's unclear: Practical limit for single PUT (vs multipart) from browser
   - Recommendation: Test with 500MB+ videos; may need multipart for very large files (future phase)

2. **Custom domain for R2**
   - What we know: r2.dev is rate-limited, custom domains available but require Pro plan for WAF HMAC
   - What's unclear: Whether presigned URL approach needs custom domain
   - Recommendation: Presigned URLs use S3 API endpoint, not r2.dev - should be fine

3. **Authentication for upload-url endpoint**
   - What we know: Pages Function is public by default
   - What's unclear: Whether to add auth (password protection already exists in app)
   - Recommendation: Since app has password auth, could add simple token check in Phase 8 or later
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- Cloudflare R2 Presigned URLs docs - https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Cloudflare R2 aws4fetch example - https://developers.cloudflare.com/r2/examples/aws/aws4fetch/
- Cloudflare R2 CORS docs - https://developers.cloudflare.com/r2/buckets/cors/
- Cloudflare R2 Pricing - https://developers.cloudflare.com/r2/pricing/

### Secondary (MEDIUM confidence)
- Supabase Storage signed uploads - https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl (verified with official docs)
- Supabase Storage resumable uploads - https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- Community comparison articles (verified claims against official pricing)

### Tertiary (LOW confidence - needs validation)
- None - all critical findings verified with official documentation
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Cloudflare R2 for object storage
- Ecosystem: aws4fetch for signing, Pages Functions for backend
- Patterns: Presigned URL upload flow
- Pitfalls: CORS, credential security, URL expiration

**Confidence breakdown:**
- Standard stack: HIGH - verified with Cloudflare official docs
- Architecture: HIGH - pattern is well-documented, community-tested
- Pitfalls: HIGH - documented in community forums, verified in docs
- Code examples: HIGH - from official documentation

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable ecosystem)
</metadata>

---

*Phase: 07-storage-migration*
*Research completed: 2026-01-20*
*Ready for planning: yes*
