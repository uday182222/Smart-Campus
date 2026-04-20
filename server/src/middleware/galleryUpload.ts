import { Request } from 'express';
import multer from 'multer';
import { AppError } from '../utils/errors';

/**
 * Multer configuration specifically for gallery uploads
 * Supports images and videos
 */

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} not allowed. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, QuickTime) are supported.`, 400));
  }
};

export const galleryUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Middleware to handle single gallery file upload
 */
export const handleGalleryFileUpload = (fieldName: string = 'file') => {
  return galleryUpload.single(fieldName);
};

