import { NextRequest } from 'next/server';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import fs from 'fs';
import path from 'path';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/upload
 * Handles multipart file uploads (photo evidence, safety inspections, signoff receipts)
 * or JSON payloads with base64 encoded images.
 * Returns accessible permanent URL: /uploads/<filename>
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let fileName = `evidence_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.jpg`;
    let fileBuffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') || formData.get('photo') || formData.get('image');

      if (!file || typeof file === 'string') {
        return apiError("Missing file attachment. Field name should be 'file' or 'photo'.", 400);
      }

      const blob = file as Blob;
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

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);

    const publicUrl = `/uploads/${fileName}`;

    return apiSuccess({
      url: publicUrl,
      fileName,
      sizeBytes: fileBuffer.length,
      uploadedAt: new Date().toISOString()
    }, 'File uploaded successfully', 201);

  } catch (error) {
    return apiError(
      'Failed to upload file',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
