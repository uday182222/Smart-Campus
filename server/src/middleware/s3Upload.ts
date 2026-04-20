import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Request } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'smartcampus-logos-2025';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow common file types for homework
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} not allowed`, 400));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Max 5 files per request
  },
  fileFilter,
});

/**
 * Upload file to S3
 */
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'homework'
): Promise<string> => {
  try {
    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Note: ACLs are disabled on this bucket. Files are made public via bucket policy.
    });

    await s3Client.send(command);

    // Return public URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${fileName}`;
    
    logger.info(`File uploaded to S3: ${fileName}`);
    return fileUrl;
  } catch (error) {
    logger.error('Error uploading to S3:', error);
    throw new AppError('Failed to upload file to S3', 500);
  }
};

/**
 * Upload multiple files to S3
 */
export const uploadMultipleToS3 = async (
  files: Express.Multer.File[],
  folder: string = 'homework'
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadToS3(file, folder));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    logger.error('Error uploading multiple files to S3:', error);
    throw error;
  }
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    // Extract key from URL
    const urlParts = fileUrl.split('.com/');
    if (urlParts.length < 2) {
      throw new Error('Invalid S3 URL');
    }

    const key = urlParts[1];

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('Error deleting from S3:', error);
    // Don't throw - file deletion failure shouldn't break the flow
  }
};

/**
 * Delete multiple files from S3
 */
export const deleteMultipleFromS3 = async (fileUrls: string[]): Promise<void> => {
  try {
    const deletePromises = fileUrls.map(url => deleteFromS3(url));
    await Promise.all(deletePromises);
  } catch (error) {
    logger.error('Error deleting multiple files from S3:', error);
    // Don't throw - file deletion failure shouldn't break the flow
  }
};

/**
 * Middleware to handle file uploads
 */
export const handleFileUpload = (fieldName: string = 'attachments', maxFiles: number = 5) => {
  return upload.array(fieldName, maxFiles);
};

/**
 * Middleware to handle single file upload
 */
export const handleSingleFileUpload = (fieldName: string = 'attachment') => {
  return upload.single(fieldName);
};


