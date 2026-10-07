// ==============================================================================
// ElectriCare Cloud Object Storage Service (AWS S3 / GCS / Local Vault)
// Handles secure KYC docs, Before/After photos, and GST PDF invoices (TASK-011)
// ==============================================================================

import path from 'path';
import fs from 'fs';

export type StorageCategory = 'kyc-documents' | 'job-photos-before' | 'job-photos-after' | 'tax-invoices';

export interface StoredFileRecord {
  fileKey: string;
  originalFileName: string;
  category: StorageCategory;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  isPrivate: boolean;
  uploadedByUserId?: string;
  uploadedAt: string;
}

// In-memory registry of stored files
const storageRegistry = new Map<string, StoredFileRecord>();

export const STORAGE_CONFIG = {
  provider: (process.env.STORAGE_PROVIDER || 'AWS_S3_MOCK') as 'AWS_S3' | 'GCS' | 'AWS_S3_MOCK',
  bucketName: process.env.STORAGE_BUCKET_NAME || 'electricare-prod-media-mumbai',
  region: process.env.AWS_REGION || 'ap-south-1',
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
};

export class CloudStorageService {
  /**
   * Generates a pre-signed upload URL for direct client-to-cloud upload (Flutter/React)
   */
  static generatePresignedUploadUrl(
    category: StorageCategory,
    fileName: string,
    mimeType: string
  ): {
    fileKey: string;
    uploadUrl: string;
    expiresInSeconds: number;
    downloadUrl: string;
  } {
    if (!STORAGE_CONFIG.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Unsupported MIME type: '${mimeType}'. Allowed: JPEG, PNG, WEBP, PDF.`);
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const fileKey = `${category}/${timestamp}_${randomHex}_${sanitizedName}`;

    const isPrivate = category === 'kyc-documents';
    const downloadUrl = `/api/integrations/storage/${encodeURIComponent(fileKey)}`;
    const uploadUrl = `https://${STORAGE_CONFIG.bucketName}.s3.${STORAGE_CONFIG.region}.amazonaws.com/${fileKey}?X-Amz-Signature=mock_sig_${randomHex}`;

    return {
      fileKey,
      uploadUrl,
      expiresInSeconds: 900, // 15 mins validity
      downloadUrl,
    };
  }

  /**
   * Uploads and registers a file directly
   */
  static async uploadFile(
    category: StorageCategory,
    originalFileName: string,
    mimeType: string,
    fileBuffer: Buffer | string,
    uploadedByUserId?: string
  ): Promise<StoredFileRecord> {
    if (!STORAGE_CONFIG.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type '${mimeType}' is not permitted. Only images and PDFs are allowed.`);
    }

    const buffer = typeof fileBuffer === 'string' ? Buffer.from(fileBuffer, 'base64') : fileBuffer;
    if (buffer.length > STORAGE_CONFIG.maxFileSizeBytes) {
      throw new Error(`File size ${(buffer.length / (1024 * 1024)).toFixed(2)}MB exceeds maximum 10MB limit.`);
    }

    const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const fileKey = `${category}/${timestamp}_${randomHex}_${sanitizedName}`;

    const isPrivate = category === 'kyc-documents';
    const publicUrl = `/api/integrations/storage/${encodeURIComponent(fileKey)}`;

    const record: StoredFileRecord = {
      fileKey,
      originalFileName,
      category,
      mimeType,
      sizeBytes: buffer.length,
      publicUrl,
      isPrivate,
      uploadedByUserId,
      uploadedAt: new Date().toISOString(),
    };

    storageRegistry.set(fileKey, record);
    return record;
  }

  static getFileMetadata(fileKey: string): StoredFileRecord | null {
    return storageRegistry.get(fileKey) || null;
  }

  static getTelemetry() {
    const all = Array.from(storageRegistry.values());
    const totalBytes = all.reduce((sum, f) => sum + f.sizeBytes, 0);

    const byCategory = {
      kycDocuments: all.filter((f) => f.category === 'kyc-documents').length,
      jobPhotosBefore: all.filter((f) => f.category === 'job-photos-before').length,
      jobPhotosAfter: all.filter((f) => f.category === 'job-photos-after').length,
      taxInvoices: all.filter((f) => f.category === 'tax-invoices').length,
    };

    return {
      provider: STORAGE_CONFIG.provider,
      bucketName: STORAGE_CONFIG.bucketName,
      region: STORAGE_CONFIG.region,
      totalObjectsStored: all.length,
      totalStorageBytes: totalBytes,
      totalStorageFormatted: `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
      breakdownByCategory: byCategory,
      status: 'HEALTHY_CONNECTED',
    };
  }
}
