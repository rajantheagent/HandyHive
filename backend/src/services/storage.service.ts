import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';
import crypto from 'crypto';
import path from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export class StorageService {
  private s3Client: S3Client | null = null;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'handyhive-uploads';

    if (process.env.S3_ENDPOINT) {
      this.s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
        },
        forcePathStyle: true, // Required for MinIO
      });
    }
  }

  /**
   * Validate file format and size.
   */
  validateFile(file: { mimetype: string; size: number }): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return { valid: false, error: 'File must be JPEG, PNG, or PDF' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must not exceed 5 MB' };
    }
    return { valid: true };
  }

  /**
   * Upload a file to S3/MinIO or store locally in dev.
   * Returns the URL of the uploaded file.
   */
  async uploadFile(file: { buffer: Buffer; mimetype: string; originalname: string }, folder: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${folder}/${crypto.randomUUID()}${ext}`;

    if (this.s3Client) {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      const endpoint = process.env.S3_ENDPOINT || `https://${this.bucket}.s3.amazonaws.com`;
      return `${endpoint}/${this.bucket}/${filename}`;
    }

    // In development without S3, return a mock URL
    console.log(`[DEV] File upload simulated: ${filename} (${file.buffer.length} bytes)`);
    return `http://localhost:3000/uploads/${filename}`;
  }

  /**
   * Delete a file from storage.
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.s3Client) {
      console.log(`[DEV] File delete simulated: ${fileUrl}`);
      return;
    }

    const key = fileUrl.split('/').slice(-2).join('/');
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }
}

export const storageService = new StorageService();
