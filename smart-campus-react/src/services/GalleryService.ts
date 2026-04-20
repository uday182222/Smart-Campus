import { apiClient } from './apiClient';

export interface GalleryItem {
  id: string;
  schoolId: string;
  school: {
    id: string;
    name: string;
  };
  uploadedBy: string;
  type: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  tags?: string[];
  event?: string;
  albumId?: string;
  visibility: 'public' | 'private' | 'class';
  classIds?: string[];
  views: number;
  downloads: number;
  uploadDate: Date;
}

export interface GalleryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UploadGalleryItemData {
  type: string;
  caption?: string;
  tags?: string[];
  event?: string;
  albumId?: string;
  visibility?: 'public' | 'private' | 'class';
  classIds?: string[];
}

class GalleryService {
  async uploadItem(file: File, data: UploadGalleryItemData): Promise<{ success: boolean; message: string; data: { item: GalleryItem } }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', data.type);
      if (data.caption) formData.append('caption', data.caption);
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      if (data.event) formData.append('event', data.event);
      if (data.albumId) formData.append('albumId', data.albumId);
      if (data.visibility) formData.append('visibility', data.visibility);
      if (data.classIds) formData.append('classIds', JSON.stringify(data.classIds));

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: { item: GalleryItem };
      }>('/gallery', formData);

      if (response.success) {
        return {
          success: true,
          message: response.message,
          data: {
            item: {
              ...response.data.item,
              uploadDate: new Date(response.data.item.uploadDate),
            },
          },
        };
      }

      throw new Error(response.message || 'Failed to upload gallery item');
    } catch (error: any) {
      console.error('Error uploading gallery item:', error);
      throw error;
    }
  }

  async getGalleryItems(
    schoolId: string,
    options?: {
      type?: string;
      event?: string;
      albumId?: string;
      visibility?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ success: boolean; data: { items: GalleryItem[]; pagination: GalleryPagination } }> {
    try {
      const params = new URLSearchParams();
      if (options?.type) params.append('type', options.type);
      if (options?.event) params.append('event', options.event);
      if (options?.albumId) params.append('albumId', options.albumId);
      if (options?.visibility) params.append('visibility', options.visibility);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());

      const queryString = params.toString();
      const url = `/gallery/${schoolId}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { items: GalleryItem[]; pagination: GalleryPagination };
      }>(url);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            items: response.data.items.map((item) => ({
              ...item,
              uploadDate: new Date(item.uploadDate),
            })),
            pagination: response.data.pagination,
          },
        };
      }

      throw new Error(response.message || 'Failed to get gallery items');
    } catch (error: any) {
      console.error('Error getting gallery items:', error);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/gallery/${itemId}`);

      if (response.success) {
        return {
          success: true,
          message: response.message,
        };
      }

      throw new Error(response.message || 'Failed to delete gallery item');
    } catch (error: any) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  }
}

export const galleryService = new GalleryService();

