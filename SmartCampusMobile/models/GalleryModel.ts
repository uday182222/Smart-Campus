export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  category: GalleryCategory;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
  itemCount: number;
  schoolId: string;
}

export interface GalleryItem {
  id: string;
  albumId: string;
  title: string;
  description: string;
  mediaType: MediaType;
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  duration?: number; // for videos/audio
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
}

export type GalleryCategory = 
  | 'events' 
  | 'sports' 
  | 'academic' 
  | 'cultural' 
  | 'graduation' 
  | 'field_trip' 
  | 'achievements' 
  | 'daily_life' 
  | 'infrastructure' 
  | 'other';

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface GalleryStats {
  totalAlbums: number;
  totalItems: number;
  totalStorageUsed: number; // in MB
  popularAlbums: GalleryAlbum[];
  recentUploads: GalleryItem[];
  categoryBreakdown: {
    category: GalleryCategory;
    count: number;
  }[];
}

export interface GalleryFilters {
  category?: GalleryCategory;
  mediaType?: MediaType;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  isPublic?: boolean;
}
