import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Configurable upload directory — set UPLOAD_DIR in .env for custom path
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class StorageService {
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
   * Upload a file to local filesystem.
   * Returns the URL path to access the file.
   */
  async uploadFile(file: { buffer: Buffer; mimetype: string; originalname: string }, folder: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const folderPath = path.join(UPLOAD_DIR, folder);

    // Ensure subfolder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, filename);
    fs.writeFileSync(filePath, file.buffer);

    console.log(`[Storage] File saved: ${filePath}`);

    // Return a URL that can be served by Express static middleware
    return `/uploads/${folder}/${filename}`;
  }

  /**
   * Delete a file from local storage.
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const relativePath = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(UPLOAD_DIR, relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Storage] File deleted: ${fullPath}`);
    }
  }
}

export const storageService = new StorageService();
