import { NextRequest } from 'next/server';
import { CloudStorageService, StorageCategory } from '@/lib/storage-service';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let category: StorageCategory;
    let fileName: string;
    let mimeType: string;
    let fileBuffer: Buffer | string;
    let uploadedByUserId: string | undefined;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      category = body.category;
      fileName = body.fileName;
      mimeType = body.mimeType;
      fileBuffer = body.fileBase64;
      uploadedByUserId = body.uploadedByUserId;

      if (!fileBuffer) {
        return apiError("'fileBase64' is required for JSON upload", 400);
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      category = (formData.get('category') as StorageCategory) || 'job-photos-before';
      uploadedByUserId = formData.get('uploadedByUserId') as string || undefined;

      if (!file) {
        return apiError("Missing 'file' in multipart form data", 400);
      }

      fileName = file.name;
      mimeType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      return apiError('Expected application/json or multipart/form-data', 400);
    }

    if (!category || !fileName || !mimeType) {
      return apiError("'category', 'fileName', and 'mimeType' are required", 400);
    }

    const storedRecord = await CloudStorageService.uploadFile(
      category,
      fileName,
      mimeType,
      fileBuffer,
      uploadedByUserId
    );

    return apiSuccess(
      storedRecord,
      `File '${fileName}' (${(storedRecord.sizeBytes / 1024).toFixed(1)} KB) successfully uploaded to S3 bucket partition '${category}'.`,
      201
    );
  } catch (error) {
    return apiError(
      'File upload failed',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
