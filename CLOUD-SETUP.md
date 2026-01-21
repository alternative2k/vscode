# Cloud Upload Setup Guide

This guide walks you through setting up Cloudflare R2 cloud storage for FormCheck video uploads.

## Prerequisites

- Cloudflare account (free tier works)
- Project deployed to Cloudflare Pages

## Step 1: Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to **R2 Object Storage** in the left sidebar
4. Click **Create bucket**
5. Name it (e.g., `formcheck-recordings`)
6. Choose a location (or leave as automatic)
7. Click **Create bucket**

## Step 2: Configure CORS

Your R2 bucket needs CORS rules to allow uploads from your app.

1. Click on your bucket
2. Go to **Settings** tab
3. Scroll to **CORS Policy**
4. Click **Add CORS policy** and paste:

```json
[
  {
    "AllowedOrigins": ["https://your-app-domain.pages.dev", "http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace `your-app-domain.pages.dev` with your actual Cloudflare Pages domain.

## Step 3: Create R2 API Token

1. Go to **R2 Object Storage** > **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure:
   - **Token name:** `formcheck-upload`
   - **Permissions:** Object Read & Write
   - **Specify bucket(s):** Select your bucket (e.g., `formcheck-recordings`)
   - **TTL:** Optional (leave blank for no expiration)
4. Click **Create API Token**
5. **Copy and save** the Access Key ID and Secret Access Key (shown only once)

## Step 4: Get Your Account ID

1. In Cloudflare Dashboard, look at the URL: `https://dash.cloudflare.com/<account-id>/...`
2. Or find it in the right sidebar under **Account ID**
3. Copy this value

## Step 5: Deploy to Cloudflare Pages

### Option A: Connect to Git (Recommended)

1. Go to **Workers & Pages** in Cloudflare Dashboard
2. Click **Create application** > **Pages** > **Connect to Git**
3. Select your repository
4. Configure build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**

### Option B: Direct Upload

```bash
npm run build
npx wrangler pages deploy dist --project-name=formcheck
```

## Step 6: Set Environment Variables

1. Go to your Pages project in Cloudflare Dashboard
2. Click **Settings** > **Environment variables**
3. Add these variables for **Production** (and Preview if needed):

| Variable Name | Value |
|---------------|-------|
| `R2_ACCESS_KEY_ID` | Your R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Your R2 API token secret |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID |
| `R2_BUCKET_NAME` | Your bucket name (e.g., `formcheck-recordings`) |

4. Click **Save**
5. **Redeploy** the project for changes to take effect

## Step 7: Verify Setup

1. Open your deployed app
2. Go to Settings (gear icon)
3. Enable "Cloud Upload"
4. Record a video
5. Click the upload button (cloud icon)
6. Check your R2 bucket for the uploaded file

## Troubleshooting

### Upload fails with 404

The Pages Function isn't deployed. Make sure:
- The `functions/api/upload-url.ts` file exists
- You've deployed after adding it
- Try redeploying: **Deployments** > **Retry deployment**

### Upload fails with 403

Credential or permission issue:
- Verify R2 API token has "Object Read & Write" permission
- Check the token is scoped to the correct bucket
- Confirm environment variables are set correctly
- Redeploy after changing environment variables

### Upload fails with CORS error

CORS not configured correctly:
- Add your Pages domain to the CORS AllowedOrigins
- Include both production URL and localhost for development
- Wait a few minutes for CORS changes to propagate

### Upload times out

For very large files (>500MB):
- Consider reducing recording length
- The 5-minute timeout may not be sufficient for slow connections

## Local Development

For local testing with cloud uploads:

1. Create `.dev.vars` file in project root (git-ignored):

```
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
CF_ACCOUNT_ID=your-account-id
R2_BUCKET_NAME=your-bucket-name
```

2. Run with Wrangler:

```bash
npx wrangler pages dev dist --compatibility-date=2024-01-01
```

This starts a local server with the Pages Function available at `/api/upload-url`.

## Cost Estimates

Cloudflare R2 pricing (as of 2024):
- **Storage:** $0.015/GB per month
- **Class A operations (writes):** $4.50 per million
- **Class B operations (reads):** $0.36 per million
- **Egress:** Free (no bandwidth charges)

For a small group recording ~10 videos/day at ~50MB each:
- Storage: ~15GB/month = ~$0.23/month
- Writes: ~300/month = negligible
- **Total:** Under $1/month

## Security Notes

- R2 credentials are never exposed to the client
- Presigned URLs expire after 1 hour
- Each upload gets a unique object key
- The bucket is not publicly accessible by default
