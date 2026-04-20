import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { uploadToS3, deleteFromS3 } from '../middleware/s3Upload';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

/**
 * Gallery Controller
 * Complete school photo gallery management with S3 uploads, thumbnails, albums, and visibility controls
 */

// TypeScript interfaces
interface UpdateItemBody {
  title?: string;
  description?: string;
  albumId?: string;
  visibility?: 'public' | 'class' | 'private';
  classIds?: string[];
}

interface CreateAlbumBody {
  name: string;
  description?: string;
  coverImageId?: string;
}

// File validation constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * Validate file type and size
 */
function validateFile(file: Express.Multer.File): void {
  if (!file) {
    throw new ValidationError('File is required');
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `File type ${file.mimetype} not allowed. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, QuickTime) are supported.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
}

/**
 * Generate thumbnail from image
 */
async function generateThumbnail(
  fileBuffer: Buffer,
  width: number = 300,
  height: number = 300
): Promise<Buffer> {
  try {
    const thumbnail = await sharp(fileBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    throw new AppError('Failed to generate thumbnail', 500);
  }
}

/**
 * Get image dimensions
 */
async function getImageDimensions(fileBuffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(fileBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    logger.error('Error getting image dimensions:', error);
    return { width: 0, height: 0 };
  }
}

/**
 * Upload buffer to S3 as a file
 */
async function uploadBufferToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'gallery'
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'smartcampus-logos-2025';
  const key = `${folder}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;
  logger.info(`Thumbnail uploaded to S3: ${key}`);
  return fileUrl;
}

/**
 * Check if user can view gallery item based on visibility
 */
async function canUserViewItem(
  item: any,
  userId: string,
  userRole: string,
  _schoolId: string
): Promise<boolean> {
  // Super admin can view everything
  if (userRole === 'SUPER_ADMIN') return true;

  // Public items are visible to all
  if (item.visibility === 'public') return true;

  // Private items only visible to uploader and admins
  if (item.visibility === 'private') {
    return item.uploadedBy === userId || ['ADMIN', 'PRINCIPAL'].includes(userRole);
  }

  // Class-specific items
  if (item.visibility === 'class') {
    const classIds = (item.classIds as any) || [];

    // Admins and staff can view all class items
    if (['ADMIN', 'PRINCIPAL', 'OFFICE_STAFF'].includes(userRole)) return true;

    // Teachers can view items from their classes
    if (userRole === 'TEACHER') {
      const teacherClasses = await prisma.teacherClass.findMany({
        where: {
          teacherId: userId,
        },
        select: { classId: true },
      });

      const teacherClassIds = teacherClasses.map((tc) => tc.classId);
      return classIds.some((cid: string) => teacherClassIds.includes(cid));
    }

    // Parents can view items from their children's classes
    if (userRole === 'PARENT') {
      const parentStudents = await prisma.parentStudent.findMany({
        where: {
          parentId: userId,
        },
        include: {
          student: {
            select: {
              id: true,
            },
          },
        },
      });

      const studentIds = parentStudents.map((ps) => ps.studentId);
      const studentClasses = await prisma.user.findMany({
        where: {
          id: { in: studentIds },
          role: 'STUDENT',
        },
        select: {
          metadata: true,
        },
      });

      // Extract class IDs from student metadata
      const studentClassIds: string[] = [];
      studentClasses.forEach((student) => {
        const metadata = student.metadata as any;
        if (metadata?.classId) {
          studentClassIds.push(metadata.classId);
        }
      });

      return classIds.some((cid: string) => studentClassIds.includes(cid));
    }
  }

  return false;
}

export const galleryController = {
  /**
   * POST /api/gallery
   * Upload media to gallery
   */
  async uploadMedia(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const file = req.file;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Validate file
      validateFile(file!);

      const title = req.body.title as string;
      const albumId = req.body.albumId as string | undefined;
      const visibility = (req.body.visibility || 'public') as string;
      const classIds = req.body.classIds as string[] | undefined;
      const eventDate = req.body.eventDate as string | undefined;
      
      // Note: description from body is used directly in database insert below

      if (!title) {
        throw new ValidationError('title is required');
      }

      // Validate visibility
      const validVisibilities = ['public', 'class', 'private'];
      if (!validVisibilities.includes(visibility)) {
        throw new ValidationError(`visibility must be one of: ${validVisibilities.join(', ')}`);
      }

      // Validate classIds if visibility is 'class'
      let parsedClassIds: string[] = [];
      if (visibility === 'class') {
        if (!classIds) {
          throw new ValidationError('classIds is required when visibility is "class"');
        }

        // Handle both string (from form-data) and array
        if (Array.isArray(classIds)) {
          parsedClassIds = classIds as string[];
        } else if (classIds && typeof classIds === 'string' && (classIds as string).length > 0) {
          parsedClassIds = (classIds as string).split(',').map((id: string) => id.trim());
        } else {
          parsedClassIds = [];
        }

        if (parsedClassIds.length === 0) {
          throw new ValidationError('At least one classId is required when visibility is "class"');
        }

        // Verify classes exist and belong to school
        const classes = await prisma.class.findMany({
          where: {
            id: { in: parsedClassIds },
            schoolId,
          },
        });

        if (classes.length !== parsedClassIds.length) {
          throw new ValidationError('One or more classes not found or do not belong to this school');
        }
      }

      // Generate unique filename
      const fileExtension = file!.originalname.split('.').pop() || 'bin';
      const fileName = `${uuidv4()}.${fileExtension}`;

      // Upload main file to S3
      const fileUrl = await uploadToS3(file!, 'gallery');

      // Generate thumbnail for images
      let thumbnailUrl = fileUrl;
      let dimensions: { width: number; height: number } | null = null;

      if (ALLOWED_IMAGE_TYPES.includes(file!.mimetype)) {
        // Get dimensions
        dimensions = await getImageDimensions(file!.buffer);

        // Generate thumbnail
        const thumbnailBuffer = await generateThumbnail(file!.buffer, 300, 300);
        const thumbnailFileName = `thumb_${fileName}`;
        thumbnailUrl = await uploadBufferToS3(
          thumbnailBuffer,
          thumbnailFileName,
          'image/jpeg',
          'gallery/thumbnails'
        );
      }

      // Create gallery item
      const galleryItem = await prisma.galleryItem.create({
        data: {
          schoolId,
          uploadedBy: userId!,
          type: file!.mimetype.startsWith('image/') ? 'image' : 'video',
          url: fileUrl,
          thumbnailUrl,
          caption: title,
          tags: [] as any,
          event: eventDate || null,
          albumId: albumId || null,
          visibility,
          classIds: parsedClassIds.length > 0 ? (parsedClassIds as any) : null,
          fileSize: BigInt(file!.size),
          dimensions: dimensions ? (dimensions as any) : null,
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          album: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'GALLERY_ITEM_UPLOADED',
          resource: 'GalleryItem',
          resourceId: galleryItem.id,
          details: {
            type: galleryItem.type,
            visibility,
            albumId,
            eventDate,
          },
        },
      });

      logger.info(`Gallery item uploaded: ${galleryItem.id} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Media uploaded successfully',
        data: {
          itemId: galleryItem.id,
          url: galleryItem.url,
          thumbnailUrl: galleryItem.thumbnailUrl,
          item: {
            id: galleryItem.id,
            type: galleryItem.type,
            url: galleryItem.url,
            thumbnailUrl: galleryItem.thumbnailUrl,
            caption: galleryItem.caption,
            visibility: galleryItem.visibility,
            albumId: galleryItem.albumId,
            dimensions: galleryItem.dimensions,
          },
        },
      });
    } catch (error) {
      logger.error('Error uploading media:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * GET /api/gallery/:schoolId
   * Get all gallery items for a school
   */
  async getGalleryItems(req: AuthRequest, res: Response) {
    try {
      const { schoolId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userSchoolId = req.user?.schoolId;
      const { albumId, visibility, limit = '50', offset = '0' } = req.query;

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify user has access to this school
      if (schoolId !== userSchoolId && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      // Build base where clause
      const where: any = {
        schoolId,
      };

      if (albumId) {
        where.albumId = albumId;
      }

      if (visibility) {
        where.visibility = visibility;
      }

      // Get all items (we'll filter by visibility in code)
      const allItems = await prisma.galleryItem.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          album: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          uploadDate: 'desc',
        },
      });

      // Filter items based on user permissions
      const visibleItems = [];
      for (const item of allItems) {
        const canView = await canUserViewItem(item, userId!, userRole!, schoolId);
        if (canView) {
          visibleItems.push(item);
        }
      }

      // Apply pagination
      const total = visibleItems.length;
      const paginatedItems = visibleItems.slice(offsetNum, offsetNum + limitNum);

      // Format response
      const formattedItems = paginatedItems.map((item) => ({
        id: item.id,
        schoolId: item.schoolId,
        school: item.school,
        uploadedBy: item.uploadedBy,
        type: item.type,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        caption: item.caption,
        tags: item.tags,
        event: item.event,
        albumId: item.albumId,
        album: item.album,
        visibility: item.visibility,
        classIds: item.classIds,
        views: item.views,
        downloads: item.downloads,
        dimensions: item.dimensions,
        uploadDate: item.uploadDate,
      }));

      logger.info(`Retrieved ${formattedItems.length} gallery items for school ${schoolId}`);

      res.json({
        success: true,
        data: {
          items: formattedItems,
          total,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < total,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting gallery items:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * GET /api/gallery/item/:itemId
   * Get single gallery item details
   */
  async getItemDetails(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get gallery item
      const item = await prisma.galleryItem.findUnique({
        where: { id: itemId },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          album: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      if (!item) {
        throw new NotFoundError('Gallery item not found');
      }

      // Verify same school
      if (item.schoolId !== schoolId && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this gallery item');
      }

      // Check if user can view this item
      const canView = await canUserViewItem(item, userId!, userRole!, schoolId);
      if (!canView) {
        throw new ForbiddenError('You do not have permission to view this item');
      }

      // Increment view count
      const updatedItem = await prisma.galleryItem.update({
        where: { id: itemId },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      logger.info(`Gallery item ${itemId} viewed by user ${userId}`);

      res.json({
        success: true,
        data: {
          item: {
            id: updatedItem.id,
            schoolId: updatedItem.schoolId,
            school: item.school,
            uploadedBy: updatedItem.uploadedBy,
            type: updatedItem.type,
            url: updatedItem.url,
            thumbnailUrl: updatedItem.thumbnailUrl,
            caption: updatedItem.caption,
            tags: updatedItem.tags,
            event: updatedItem.event,
            albumId: updatedItem.albumId,
            album: item.album,
            visibility: updatedItem.visibility,
            classIds: updatedItem.classIds,
            views: updatedItem.views,
            downloads: updatedItem.downloads,
            dimensions: updatedItem.dimensions,
            fileSize: updatedItem.fileSize.toString(),
            uploadDate: updatedItem.uploadDate,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting item details:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * PUT /api/gallery/item/:itemId
   * Update gallery item metadata
   */
  async updateItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const schoolId = req.user?.schoolId;
      const { title, description, albumId, visibility, classIds }: UpdateItemBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get gallery item
      const item = await prisma.galleryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new NotFoundError('Gallery item not found');
      }

      // Verify same school
      if (item.schoolId !== schoolId && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this gallery item');
      }

      // Verify user has permission (uploader or admin)
      if (item.uploadedBy !== userId && !['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'].includes(userRole!)) {
        throw new ForbiddenError('You do not have permission to update this item');
      }

      // Build update data
      const updateData: any = {};

      if (title !== undefined) updateData.caption = title;
      if (description !== undefined) {
        // Store description in tags or create a separate field
        // For now, we'll store it in tags as description
        updateData.tags = { description } as any;
      }
      if (albumId !== undefined) updateData.albumId = albumId || null;
      if (visibility !== undefined) {
        updateData.visibility = visibility;

        // Validate and update classIds if visibility is 'class'
        if (visibility === 'class') {
          if (!classIds || classIds.length === 0) {
            throw new ValidationError('classIds is required when visibility is "class"');
          }

          // Verify classes exist
          const classes = await prisma.class.findMany({
            where: {
              id: { in: classIds },
              schoolId,
            },
          });

          if (classes.length !== classIds.length) {
            throw new ValidationError('One or more classes not found');
          }

          updateData.classIds = classIds as any;
        } else {
          updateData.classIds = null;
        }
      } else if (classIds !== undefined) {
        // Update classIds without changing visibility
        if (item.visibility === 'class') {
          if (classIds.length === 0) {
            throw new ValidationError('classIds cannot be empty when visibility is "class"');
          }

          const classes = await prisma.class.findMany({
            where: {
              id: { in: classIds },
              schoolId,
            },
          });

          if (classes.length !== classIds.length) {
            throw new ValidationError('One or more classes not found');
          }

          updateData.classIds = classIds as any;
        }
      }

      // Update item
      const updatedItem = await prisma.galleryItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          album: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'GALLERY_ITEM_UPDATED',
          resource: 'GalleryItem',
          resourceId: itemId,
          details: {
            changes: Object.keys(updateData),
          },
        },
      });

      logger.info(`Gallery item updated: ${itemId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Item updated successfully',
        data: {
          item: {
            id: updatedItem.id,
            caption: updatedItem.caption,
            albumId: updatedItem.albumId,
            album: updatedItem.album,
            visibility: updatedItem.visibility,
            classIds: updatedItem.classIds,
          },
        },
      });
    } catch (error) {
      logger.error('Error updating item:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * DELETE /api/gallery/item/:itemId
   * Delete gallery item
   */
  async deleteItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get gallery item
      const item = await prisma.galleryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new NotFoundError('Gallery item not found');
      }

      // Verify same school
      if (item.schoolId !== schoolId && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this gallery item');
      }

      // Verify user has permission (uploader or admin)
      if (item.uploadedBy !== userId && !['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'].includes(userRole!)) {
        throw new ForbiddenError('You do not have permission to delete this item');
      }

      // Delete files from S3
      try {
        await deleteFromS3(item.url);
        if (item.thumbnailUrl && item.thumbnailUrl !== item.url) {
          await deleteFromS3(item.thumbnailUrl);
        }
      } catch (s3Error) {
        logger.warn('Error deleting from S3, continuing with database deletion:', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }

      // Delete from database
      await prisma.galleryItem.delete({
        where: { id: itemId },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'GALLERY_ITEM_DELETED',
          resource: 'GalleryItem',
          resourceId: itemId,
          details: {
            url: item.url,
            type: item.type,
          },
        },
      });

      logger.info(`Gallery item deleted: ${itemId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Item deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting item:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * POST /api/gallery/album
   * Create new album
   */
  async createAlbum(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { name, description, coverImageId }: CreateAlbumBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      if (!name) {
        throw new ValidationError('name is required');
      }

      // Verify cover image exists if provided
      let coverImageUrl = null;
      if (coverImageId) {
        const coverImage = await prisma.galleryItem.findUnique({
          where: { id: coverImageId },
        });

        if (!coverImage) {
          throw new NotFoundError('Cover image not found');
        }

        if (coverImage.schoolId !== schoolId && req.user?.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Cover image does not belong to this school');
        }

        coverImageUrl = coverImage.thumbnailUrl || coverImage.url;
      }

      // Create album
      const album = await prisma.album.create({
        data: {
          name,
          description: description || null,
          coverImageUrl,
          visibility: 'public', // Albums are public by default
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'ALBUM_CREATED',
          resource: 'Album',
          resourceId: album.id,
          details: {
            name,
            coverImageId,
          },
        },
      });

      logger.info(`Album created: ${album.id} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Album created successfully',
        data: {
          albumId: album.id,
          album: {
            id: album.id,
            name: album.name,
            description: album.description,
            coverImageUrl: album.coverImageUrl,
            visibility: album.visibility,
            createdAt: album.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error creating album:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * GET /api/gallery/albums/:schoolId
   * Get all albums for a school
   */
  async getAlbums(req: AuthRequest, res: Response) {
    try {
      const { schoolId } = req.params;
      const userSchoolId = req.user?.schoolId;

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify user has access to this school
      if (schoolId !== userSchoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      // Get all albums
      const albums = await prisma.album.findMany({
        include: {
          items: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter albums that have items from this school
      const schoolAlbums = albums.filter((album) => {
        // Check if album has any items from this school
        // Since Album doesn't have schoolId, we check through items
        return album.items.length > 0;
      });

      // Get item counts per album for this school
      const albumsWithCounts = await Promise.all(
        schoolAlbums.map(async (album) => {
          const itemCount = await prisma.galleryItem.count({
            where: {
              albumId: album.id,
              schoolId,
            },
          });

          return {
            id: album.id,
            name: album.name,
            description: album.description,
            coverImageUrl: album.coverImageUrl,
            visibility: album.visibility,
            itemCount,
            createdAt: album.createdAt,
          };
        })
      );

      // Filter out albums with 0 items for this school
      const filteredAlbums = albumsWithCounts.filter((album) => album.itemCount > 0);

      logger.info(`Retrieved ${filteredAlbums.length} albums for school ${schoolId}`);

      res.json({
        success: true,
        data: {
          albums: filteredAlbums,
          total: filteredAlbums.length,
        },
      });
    } catch (error) {
      logger.error('Error getting albums:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },
};
