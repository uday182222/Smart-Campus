/**
 * Gallery Service
 * Handles all gallery-related API calls using apiClient
 */

import apiClient from './apiClient';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export interface GalleryItem {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  albumId?: string;
  visibility: 'public' | 'class' | 'private';
  classIds?: string[];
  eventDate?: Date;
  uploadedBy: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  width?: number;
  height?: number;
  fileSize?: number;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  schoolId: string;
  visibility: 'public' | 'class' | 'private';
  itemCount: number;
  createdAt: Date;
}

export interface UploadGalleryItemData {
  title: string;
  description?: string;
  albumId?: string;
  visibility: 'public' | 'class' | 'private';
  classIds?: string[];
  eventDate?: string;
}

class GalleryService {
  /**
   * POST /api/gallery
   * Upload media to gallery (with file upload)
   */
  async uploadGalleryItem(
    fileUri: string,
    data: UploadGalleryItemData,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; data?: { itemId: string; url: string; thumbnailUrl?: string }; error?: string }> {
    try {
      // Create FormData
      const formData = new FormData();
      
      // Determine file type and name
      const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
      const fileName = `gallery_${Date.now()}.${fileExtension}`;
      
      // Add file
      formData.append('file', {
        uri: fileUri,
        type: isImage ? 'image/jpeg' : 'video/mp4',
        name: fileName,
      } as any);
      
      // Add metadata
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.albumId) formData.append('albumId', data.albumId);
      formData.append('visibility', data.visibility);
      if (data.classIds && data.classIds.length > 0) {
        formData.append('classIds', JSON.stringify(data.classIds));
      }
      if (data.eventDate) formData.append('eventDate', data.eventDate);

      // Upload using apiClient's postFormData method
      const response = await apiClient.postFormData<{ success: boolean; data: any; message?: string }>(
        '/gallery',
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              onProgress(progress);
            }
          },
        }
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            itemId: response.data.itemId || response.data.id,
            url: response.data.url || response.data.fileUrl,
            thumbnailUrl: response.data.thumbnailUrl,
          },
        };
      }
      
      return { success: false, error: 'Failed to upload gallery item' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload gallery item',
      };
    }
  }

  /**
   * GET /api/gallery/:schoolId
   * Get all gallery items for a school
   */
  async getGalleryItems(
    schoolId: string,
    options?: { albumId?: string; visibility?: string; limit?: number; offset?: number }
  ): Promise<{ success: boolean; data?: { items: GalleryItem[]; total: number }; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (options?.albumId) params.append('albumId', options.albumId);
      if (options?.visibility) params.append('visibility', options.visibility);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString();
      const url = `/gallery/${schoolId}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<{ success: boolean; data: any }>(url);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            items: response.data.items.map((item: any) => ({
              ...item,
              eventDate: item.eventDate ? new Date(item.eventDate) : undefined,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
            total: response.data.total || 0,
          },
        };
      }
      
      return { success: false, error: 'Failed to get gallery items' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get gallery items',
      };
    }
  }

  /**
   * GET /api/gallery/item/:itemId
   * Get single gallery item details
   */
  async getItemDetails(itemId: string): Promise<{ success: boolean; data?: { item: GalleryItem }; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/gallery/item/${itemId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            item: {
              ...response.data.item,
              eventDate: response.data.item.eventDate ? new Date(response.data.item.eventDate) : undefined,
              createdAt: new Date(response.data.item.createdAt),
              updatedAt: new Date(response.data.item.updatedAt),
            },
          },
        };
      }
      
      return { success: false, error: 'Failed to get gallery item details' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get gallery item details',
      };
    }
  }

  /**
   * DELETE /api/gallery/item/:itemId
   * Delete gallery item
   */
  async deleteItem(itemId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(
        `/gallery/item/${itemId}`
      );
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Gallery item deleted successfully',
        };
      }
      
      return { success: false, error: 'Failed to delete gallery item' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete gallery item',
      };
    }
  }

  /**
   * POST /api/gallery/album
   * Create new album
   */
  async createAlbum(data: { name: string; description?: string; coverImageId?: string }): Promise<{ success: boolean; data?: { albumId: string }; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: any; message?: string }>(
        '/gallery/album',
        data
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            albumId: response.data.albumId || response.data.id,
          },
          message: response.message || 'Album created successfully',
        };
      }
      
      return { success: false, error: 'Failed to create album' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create album',
      };
    }
  }

  /**
   * GET /api/gallery/albums/:schoolId
   * Get all albums for a school
   */
  async getAlbums(schoolId: string): Promise<{ success: boolean; data?: { albums: Album[] }; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(
        `/gallery/albums/${schoolId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            albums: response.data.albums.map((album: any) => ({
              ...album,
              createdAt: new Date(album.createdAt),
            })),
          },
        };
      }
      
      return { success: false, error: 'Failed to get albums' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get albums',
      };
    }
  }

  // Utility methods
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export default new GalleryService();
