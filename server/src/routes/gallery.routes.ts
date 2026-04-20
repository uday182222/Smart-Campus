import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { galleryController } from '../controllers/gallery.controller';
import { handleGalleryFileUpload } from '../middleware/galleryUpload';

const router = Router();

// All gallery routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/gallery - Upload media to gallery (Admin/Staff/Teacher only)
router.post(
  '/',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF', 'TEACHER'),
  handleGalleryFileUpload('file'),
  galleryController.uploadMedia
);

// GET /api/gallery/:schoolId - Get all gallery items for a school
router.get('/:schoolId', galleryController.getGalleryItems);

// GET /api/gallery/item/:itemId - Get single gallery item details
router.get('/item/:itemId', galleryController.getItemDetails);

// PUT /api/gallery/item/:itemId - Update gallery item metadata (Admin/Staff/Uploader only)
router.put(
  '/item/:itemId',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF', 'TEACHER'),
  galleryController.updateItem
);

// DELETE /api/gallery/item/:itemId - Delete gallery item (Admin/Staff/Uploader only)
router.delete(
  '/item/:itemId',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF', 'TEACHER'),
  galleryController.deleteItem
);

// POST /api/gallery/album - Create new album (Admin/Staff only)
router.post(
  '/album',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF'),
  galleryController.createAlbum
);

// GET /api/gallery/albums/:schoolId - Get all albums for a school
router.get('/albums/:schoolId', galleryController.getAlbums);

export default router;
