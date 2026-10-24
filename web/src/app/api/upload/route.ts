import { NextRequest } from 'next/server';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import fs from 'fs';
import path from 'path';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * Direct-to-S3 / Cloudflare R2 Storage Service (Urban Company / Uber standard)
 * Uploads evidence photos, safety verification photos, and KYC documents
 * directly to AWS S3 or Cloudflare R2 bucket with immutable CDN URL generation.
 */
async function uploadToS3OrR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string | null> {
  const bucket = process.env.R2_BUCKET || process.env.AWS_S3_BUCKET;
  if (!bucket) return null;

  try {
    // Dynamic import of @aws-sdk/client-s3 for Cloudflare R2 / AWS S3 direct upload
    // @ts-ignore
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3').catch(() => ({
      S3Client: null,
      PutObjectCommand: null,
    }));

    if (!S3Client || !PutObjectCommand) return null;

    const endpoint =
      process.env.R2_ENDPOINT ||
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : undefined);

    const client = new S3Client({
      region: process.env.AWS_REGION || 'auto',
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `evidence/${fileName}`,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read',
      })
    );

    const cdnDomain = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.ghartak.in';
    return `${cdnDomain.replace(/\/$/, '')}/evidence/${fileName}`;
  } catch (err) {
    console.warn('[Upload] S3/R2 direct upload exception, falling back:', err);
    return null;
  }
}

/**
 * POST /api/upload
 * Handles evidence photo uploads, KYC documentation, and safety checklists.
 * Always outputs fully qualified immutable CDN URLs (https://cdn.ghartak.in/evidence/...)
 * ensuring Android Coil image loaders never crash on relative paths.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let fileName = `evidence_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.jpg`;
    let fileBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') || formData.get('photo') || formData.get('image');

      if (!file || typeof file === 'string') {
        return apiError("Missing file attachment. Field name should be 'file' or 'photo'.", 400);
      }

      const blob = file as Blob;
      mimeType = blob.type || 'image/jpeg';
      const arrayBuffer = await blob.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      const originalName = (file as any).name;
      if (originalName) {
        const ext = path.extname(originalName) || '.jpg';
        fileName = `evidence_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${ext}`;
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      const base64Data = body.base64 || body.image || body.photo;
      if (!base64Data || typeof base64Data !== 'string') {
        return apiError("Missing base64 image data in 'base64' or 'photo' field.", 400);
      }
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      fileBuffer = Buffer.from(cleanBase64, 'base64');
    } else {
      return apiError("Unsupported Content-Type. Use 'multipart/form-data' or 'application/json'.", 415);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return apiError("Uploaded file is empty.", 400);
    }

    // 1. Primary path: Direct-to-S3 / Cloudflare R2 Upload
    const s3Url = await uploadToS3OrR2(fileBuffer, fileName, mimeType);

    // 2. Fallback local persistence for local offline sandbox testing
    if (!s3Url) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, fileBuffer);
    }

    // 3. Fully qualified absolute CDN URL construction (never returns relative paths)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '') || (host.includes('localhost') ? `${proto}://${host}` : 'https://cdn.ghartak.in');
    const absoluteCdnUrl = s3Url || `${cdnBase}/uploads/${fileName}`;

    return apiSuccess({
      url: absoluteCdnUrl,
      cdnUrl: absoluteCdnUrl,
      fileName,
      sizeBytes: fileBuffer.length,
      storageTier: s3Url ? 'Cloudflare_R2_S3' : 'Local_Fallback',
      uploadedAt: new Date().toISOString(),
    }, 'File uploaded successfully with absolute CDN URI', 201);

  } catch (error) {
    return apiError(
      'Failed to upload file',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
