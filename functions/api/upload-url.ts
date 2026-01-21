import { AwsClient } from 'aws4fetch';

interface Env {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  CF_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
}

interface UploadUrlRequest {
  fileName: string;
  contentType: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

interface ErrorResponse {
  error: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as UploadUrlRequest;
    const { fileName, contentType } = body;

    // Validate required fields
    if (!fileName || typeof fileName !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fileName' } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!contentType || typeof contentType !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid contentType' } as ErrorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create AWS client for R2
    const client = new AwsClient({
      service: 's3',
      region: 'auto',
      accessKeyId: context.env.R2_ACCESS_KEY_ID,
      secretAccessKey: context.env.R2_SECRET_ACCESS_KEY,
    });

    // Build the R2 URL
    const R2_URL = `https://${context.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const objectKey = `formcheck/${fileName}`;
    const url = `${R2_URL}/${context.env.R2_BUCKET_NAME}/${objectKey}?X-Amz-Expires=3600`;

    // Generate presigned URL
    const signedRequest = await client.sign(
      new Request(url, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
      }),
      { aws: { signQuery: true } }
    );

    const response: UploadUrlResponse = {
      uploadUrl: signedRequest.url.toString(),
      objectKey,
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate upload URL',
      } as ErrorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
