# Gallery Controller - Complete Implementation ✅

## Overview

Complete school photo gallery management system with S3 uploads, thumbnail generation, albums, and visibility controls.

## Implemented Endpoints

### 1. POST /api/gallery
**Description:** Upload media to gallery

**Content-Type:** `multipart/form-data`

**Body:**
- `file` (File) - Image or video file (required)
- `title` (string) - Item title (required)
- `description` (string) - Optional description
- `albumId` (string) - Optional album ID
- `visibility` (string) - `public|class|private` (default: `public`)
- `classIds` (string or array) - Required if visibility is `class`
- `eventDate` (string) - Optional event date

**File Validation:**
- ✅ Images: JPEG, PNG, GIF, WebP
- ✅ Videos: MP4, MPEG, QuickTime, AVI
- ✅ Max size: 20MB
- ✅ Automatic thumbnail generation for images (300x300)

**Response:**
```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "itemId": "item-id",
    "url": "https://s3.../gallery/uuid.jpg",
    "thumbnailUrl": "https://s3.../gallery/thumbnails/thumb_uuid.jpg",
    "item": {
      "id": "item-id",
      "type": "image",
      "url": "...",
      "thumbnailUrl": "...",
      "caption": "Title",
      "visibility": "public",
      "dimensions": { "width": 1920, "height": 1080 }
    }
  }
}
```

### 2. GET /api/gallery/:schoolId
**Description:** Get all gallery items for a school

**Query Params:**
- `albumId` - Filter by album
- `visibility` - Filter by visibility
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Visibility Filtering:**
- **Admin/Staff:** See all items
- **Teacher:** See public + items from their classes
- **Parent:** See public + items from their children's classes
- **Student:** See public + items from their class

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 3. GET /api/gallery/item/:itemId
**Description:** Get single gallery item details

**Features:**
- ✅ Increments view count
- ✅ Checks visibility permissions
- ✅ Returns full item metadata

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "item-id",
      "type": "image",
      "url": "...",
      "thumbnailUrl": "...",
      "caption": "Title",
      "views": 42,
      "downloads": 5,
      "dimensions": { "width": 1920, "height": 1080 },
      "uploadDate": "2024-01-01T10:00:00Z"
    }
  }
}
```

### 4. PUT /api/gallery/item/:itemId
**Description:** Update gallery item metadata

**Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "albumId": "album-id",
  "visibility": "class",
  "classIds": ["class-id-1", "class-id-2"]
}
```

**Authorization:**
- ✅ Uploader can update their own items
- ✅ Admins can update any item

**Response:**
```json
{
  "success": true,
  "message": "Item updated successfully",
  "data": {
    "item": {
      "id": "item-id",
      "caption": "Updated Title",
      "visibility": "class",
      "classIds": [...]
    }
  }
}
```

### 5. DELETE /api/gallery/item/:itemId
**Description:** Delete gallery item

**Features:**
- ✅ Deletes file from S3
- ✅ Deletes thumbnail from S3
- ✅ Deletes from database
- ✅ Authorization check (uploader or admin)

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

### 6. POST /api/gallery/album
**Description:** Create new album

**Body:**
```json
{
  "name": "Album Name",
  "description": "Album description",
  "coverImageId": "item-id" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Album created successfully",
  "data": {
    "albumId": "album-id",
    "album": {
      "id": "album-id",
      "name": "Album Name",
      "description": "Album description",
      "coverImageUrl": "...",
      "visibility": "public",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  }
}
```

### 7. GET /api/gallery/albums/:schoolId
**Description:** Get all albums for a school

**Response:**
```json
{
  "success": true,
  "data": {
    "albums": [
      {
        "id": "album-id",
        "name": "Album Name",
        "description": "Description",
        "coverImageUrl": "...",
        "visibility": "public",
        "itemCount": 25,
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 5
  }
}
```

## Key Features

### ✅ Image Processing
- **Thumbnail Generation:** Automatic 300x300 thumbnails for all images
- **Dimension Extraction:** Captures image width and height
- **Format Support:** JPEG, PNG, GIF, WebP
- **Quality Optimization:** Thumbnails compressed to 80% quality

### ✅ Video Support
- **Format Support:** MP4, MPEG, QuickTime, AVI
- **No Thumbnails:** Videos use original URL as thumbnail
- **Size Limit:** 20MB max file size

### ✅ Visibility Controls
- **Public:** Visible to all users in school
- **Class:** Visible only to users associated with specified classes
- **Private:** Visible only to uploader and admins

### ✅ Role-Based Access
- **Super Admin:** Full access to all items
- **Admin/Principal:** Can view and manage all items in their school
- **Teacher:** Can view public items + items from their classes
- **Parent:** Can view public items + items from their children's classes
- **Student:** Can view public items + items from their class

### ✅ Albums
- Organize gallery items into albums
- Set cover image for albums
- Filter items by album
- Track item count per album

### ✅ S3 Integration
- Uploads to `smartcampus-logos-2025/gallery/`
- Thumbnails stored in `smartcampus-logos-2025/gallery/thumbnails/`
- Automatic cleanup on deletion
- Public URLs generated

## Business Logic

### Visibility Checking
1. Public items: Visible to all authenticated users
2. Private items: Only uploader and admins
3. Class items:
   - Teachers: Items from their assigned classes
   - Parents: Items from their children's classes
   - Students: Items from their own class
   - Admins: All class items

### Thumbnail Generation
1. Only for image files (not videos)
2. Resized to 300x300 maintaining aspect ratio
3. Converted to JPEG format
4. 80% quality compression
5. Stored separately in S3

### File Validation
1. Check file type (MIME type)
2. Check file size (max 20MB)
3. Validate required fields
4. Validate class IDs if visibility is 'class'

## TypeScript Types

All interfaces defined:
- `UploadMediaBody` - Upload payload
- `UpdateItemBody` - Update payload
- `CreateAlbumBody` - Album creation payload

## Dependencies

- ✅ `sharp` - Image processing and thumbnail generation
- ✅ `multer` - File upload handling
- ✅ `@aws-sdk/client-s3` - S3 file storage
- ✅ `uuid` - Unique filename generation

## Testing

```bash
# Upload image
curl -X POST -H "Authorization: Bearer TOKEN" \
  -F "file=@image.jpg" \
  -F "title=School Event" \
  -F "visibility=public" \
  -F "albumId=album-id" \
  http://localhost:5000/api/v1/gallery

# Get gallery items
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/v1/gallery/SCHOOL_ID?limit=20&offset=0"

# Get item details
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/v1/gallery/item/ITEM_ID"

# Create album
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sports Day","description":"Annual sports event"}' \
  http://localhost:5000/api/v1/gallery/album
```

## Status

✅ **Complete and Ready for Use**

All endpoints implemented with:
- Full CRUD operations
- S3 file uploads
- Thumbnail generation
- Visibility controls
- Role-based access
- Album management
- Comprehensive error handling
- Activity logging

## Notes

- Thumbnails are generated automatically for images
- Videos don't have thumbnails (use original URL)
- File size limit: 20MB
- All files stored in S3 bucket: `smartcampus-logos-2025`
- Gallery folder: `gallery/`
- Thumbnails folder: `gallery/thumbnails/`

