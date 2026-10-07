import { NextRequest } from 'next/server';
import { CloudStorageService, StorageCategory } from '@/lib/storage-service';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, fileName, mimeType } = body;

    if (!category) {
      return apiError("'category' is required (e.g. 'kyc-documents', 'job-photos-before', 'job-photos-after', 'tax-invoices')", 400);
    }
    if (!fileName) {
      return apiError("'fileName' is required", 400);
    }
    if (!mimeType) {
      return apiError("'mimeType' is required (e.g. 'image/jpeg', 'application/pdf')", 400);
    }

    const presigned = CloudStorageService.generatePresignedUploadUrl(
      category as StorageCategory,
      fileName,
      mimeType
    );

    return apiSuccess(
      presigned,
      `Pre-signed S3 upload URL generated for '${fileName}'. Expires in 15 minutes.`
    );
  } catch (error) {
    return apiError(
      'Failed to generate pre-signed upload URL',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
