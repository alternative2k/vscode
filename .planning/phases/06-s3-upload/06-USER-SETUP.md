# Phase 6: User Setup Required

**Generated:** 2026-01-16
**Phase:** 06-s3-upload
**Status:** Incomplete

## Overview

This phase enables cloud backup of recordings to your own AWS S3 bucket. You provide your own bucket for storage - no server-side infrastructure required.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| N/A | None required | - | - |

*Note: S3 credentials are entered directly in the app UI and stored in localStorage.*

## Account Setup

- [ ] **Create AWS account** (skip if you already have one)
  - URL: https://aws.amazon.com/console/
  - Skip if: Already have AWS account with S3 access

## Dashboard Configuration

### 1. Create S3 Bucket

- [ ] **Create S3 bucket with public write access**
  - Location: AWS Console -> S3 -> Create bucket
  - Details:
    - Choose a unique bucket name (e.g., `formcheck-recordings-yourname`)
    - Select region closest to you
    - **Uncheck** "Block all public access" (needed for browser uploads)
    - Acknowledge the warning about public access

### 2. Configure CORS Policy

- [ ] **Add CORS configuration**
  - Location: Bucket -> Permissions -> CORS
  - Add the following JSON:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Configure Bucket Policy (Optional - for true public writes)

- [ ] **Add bucket policy for anonymous PUT**
  - Location: Bucket -> Permissions -> Bucket policy
  - Add (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicPut",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

*Note: This allows anyone to upload. For production, use IAM credentials with limited scope.*

## Local Development

No special local development setup required. The app will prompt you to enter your S3 bucket details in a configuration modal.

## Verification

After setup, verify in the app:

1. Open FormCheck app
2. Go to Settings -> S3 Configuration
3. Enter your bucket name and region
4. Enter your AWS access key ID and secret access key
5. Test upload should succeed

---
**Once all items complete:** Mark status as "Complete"
