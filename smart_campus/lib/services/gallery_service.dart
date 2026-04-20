import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/gallery_model.dart';
import 'auth_service.dart';

class GalleryService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _galleryItemsCollection = 'gallery_items';
  static const String _galleryAlbumsCollection = 'gallery_albums';

  // Mock data for development
  static List<GalleryItem> _mockGalleryItems = [];
  static List<GalleryAlbum> _mockAlbums = [];

  static void initializeMockData() {
    _mockGalleryItems = [
      GalleryItem(
        id: 'gallery_1',
        schoolId: 'school_1',
        title: 'Annual Sports Day 2024',
        description: 'Students participating in various sports activities',
        mediaType: MediaType.image,
        mediaUrl: 'https://example.com/sports_day_1.jpg',
        thumbnailUrl: 'https://example.com/sports_day_1_thumb.jpg',
        category: GalleryCategory.sports,
        tags: ['sports', 'annual', 'students'],
        uploadedBy: 'admin_1',
        uploadedByName: 'School Admin',
        uploadedAt: DateTime.now().subtract(const Duration(days: 5)),
        isActive: true,
        isPublic: true,
        viewCount: 45,
        likeCount: 12,
        likedBy: ['parent_1', 'parent_2'],
      ),
      GalleryItem(
        id: 'gallery_2',
        schoolId: 'school_1',
        title: 'Science Fair Winners',
        description: 'Students showcasing their science projects',
        mediaType: MediaType.image,
        mediaUrl: 'https://example.com/science_fair.jpg',
        thumbnailUrl: 'https://example.com/science_fair_thumb.jpg',
        category: GalleryCategory.academics,
        tags: ['science', 'fair', 'winners'],
        uploadedBy: 'teacher_1',
        uploadedByName: 'Mrs. Johnson',
        uploadedAt: DateTime.now().subtract(const Duration(days: 10)),
        isActive: true,
        isPublic: true,
        viewCount: 32,
        likeCount: 8,
        likedBy: ['parent_1'],
      ),
      GalleryItem(
        id: 'gallery_3',
        schoolId: 'school_1',
        title: 'Graduation Ceremony 2024',
        description: 'Graduation ceremony highlights video',
        mediaType: MediaType.video,
        mediaUrl: 'https://example.com/graduation_2024.mp4',
        thumbnailUrl: 'https://example.com/graduation_2024_thumb.jpg',
        category: GalleryCategory.events,
        tags: ['graduation', 'ceremony', '2024'],
        uploadedBy: 'admin_1',
        uploadedByName: 'School Admin',
        uploadedAt: DateTime.now().subtract(const Duration(days: 15)),
        isActive: true,
        isPublic: true,
        viewCount: 78,
        likeCount: 25,
        likedBy: ['parent_1', 'parent_2', 'teacher_1'],
      ),
      GalleryItem(
        id: 'gallery_4',
        schoolId: 'school_1',
        title: 'Art Exhibition',
        description: 'Student artwork displayed in the school gallery',
        mediaType: MediaType.image,
        mediaUrl: 'https://example.com/art_exhibition.jpg',
        thumbnailUrl: 'https://example.com/art_exhibition_thumb.jpg',
        category: GalleryCategory.extracurricular,
        tags: ['art', 'exhibition', 'creativity'],
        uploadedBy: 'teacher_2',
        uploadedByName: 'Mr. Davis',
        uploadedAt: DateTime.now().subtract(const Duration(days: 20)),
        isActive: true,
        isPublic: true,
        viewCount: 28,
        likeCount: 15,
        likedBy: ['parent_2', 'teacher_1'],
      ),
    ];

    _mockAlbums = [
      GalleryAlbum(
        id: 'album_1',
        schoolId: 'school_1',
        name: 'Sports Events 2024',
        description: 'Collection of sports events and activities',
        category: GalleryCategory.sports,
        coverImageUrl: 'https://example.com/sports_day_1_thumb.jpg',
        galleryItemIds: ['gallery_1'],
        createdBy: 'admin_1',
        createdByName: 'School Admin',
        createdAt: DateTime.now().subtract(const Duration(days: 5)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
        isActive: true,
        isPublic: true,
      ),
      GalleryAlbum(
        id: 'album_2',
        schoolId: 'school_1',
        name: 'Academic Achievements',
        description: 'Academic events and achievements',
        category: GalleryCategory.academics,
        coverImageUrl: 'https://example.com/science_fair_thumb.jpg',
        galleryItemIds: ['gallery_2'],
        createdBy: 'admin_1',
        createdByName: 'School Admin',
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
        updatedAt: DateTime.now().subtract(const Duration(days: 10)),
        isActive: true,
        isPublic: true,
      ),
    ];
  }

  // Get gallery items by school ID
  static Future<List<GalleryItem>> getGalleryItemsBySchool(String schoolId, {
    GalleryCategory? category,
    bool? isPublic,
  }) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      Query query = _firestore
          .collection(_galleryItemsCollection)
          .where('schoolId', isEqualTo: schoolId)
          .where('isActive', isEqualTo: true);

      if (category != null) {
        query = query.where('category', isEqualTo: category.name);
      }

      if (isPublic != null) {
        query = query.where('isPublic', isEqualTo: isPublic);
      }

      final querySnapshot = await query
          .orderBy('uploadedAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => GalleryItem.fromMap(Map<String, dynamic>.from(doc.data()!)))
          .toList();
    } catch (e) {
      print('Error getting gallery items: $e');
      // Return mock data for development
      List<GalleryItem> items = _mockGalleryItems
          .where((item) => item.schoolId == schoolId && item.isActive)
          .toList();

      if (category != null) {
        items = items.where((item) => item.category == category).toList();
      }

      if (isPublic != null) {
        items = items.where((item) => item.isPublic == isPublic).toList();
      }

      return items;
    }
  }

  // Get gallery albums by school ID
  static Future<List<GalleryAlbum>> getGalleryAlbumsBySchool(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_galleryAlbumsCollection)
          .where('schoolId', isEqualTo: schoolId)
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => GalleryAlbum.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting gallery albums: $e');
      // Return mock data for development
      return _mockAlbums
          .where((album) => album.schoolId == schoolId && album.isActive)
          .toList();
    }
  }

  // Get gallery item by ID
  static Future<GalleryItem?> getGalleryItemById(String itemId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final doc = await _firestore.collection(_galleryItemsCollection).doc(itemId).get();
      if (!doc.exists) return null;
      
      return GalleryItem.fromMap(doc.data()!);
    } catch (e) {
      print('Error getting gallery item by ID: $e');
      // Return mock data for development
      try {
        return _mockGalleryItems.firstWhere((item) => item.id == itemId);
      } catch (e) {
        return null;
      }
    }
  }

  // Upload new gallery item (Admin/Teacher only)
  static Future<String> uploadGalleryItem(GalleryItem galleryItem) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_galleryItemsCollection).doc();
      final itemWithId = galleryItem.copyWith(
        id: docRef.id,
        uploadedBy: currentUser.uid,
        uploadedByName: currentUser.displayName ?? 'Admin User',
        uploadedAt: DateTime.now(),
      );

      await docRef.set(itemWithId.toMap());
      return docRef.id;
    } catch (e) {
      print('Error uploading gallery item: $e');
      // For development, add to mock data
      final id = 'gallery_${DateTime.now().millisecondsSinceEpoch}';
      _mockGalleryItems.add(galleryItem.copyWith(id: id));
      return id;
    }
  }

  // Create new gallery album (Admin/Teacher only)
  static Future<String> createGalleryAlbum(GalleryAlbum album) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_galleryAlbumsCollection).doc();
      final albumWithId = album.copyWith(
        id: docRef.id,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName ?? 'Admin User',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await docRef.set(albumWithId.toMap());
      return docRef.id;
    } catch (e) {
      print('Error creating gallery album: $e');
      // For development, add to mock data
      final id = 'album_${DateTime.now().millisecondsSinceEpoch}';
      _mockAlbums.add(album.copyWith(id: id));
      return id;
    }
  }

  // Update gallery item
  static Future<void> updateGalleryItem(GalleryItem galleryItem) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_galleryItemsCollection).doc(galleryItem.id).update({
        ...galleryItem.toMap(),
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      print('Error updating gallery item: $e');
      // Update mock data for development
      final index = _mockGalleryItems.indexWhere((item) => item.id == galleryItem.id);
      if (index != -1) {
        _mockGalleryItems[index] = galleryItem;
      }
    }
  }

  // Delete gallery item
  static Future<void> deleteGalleryItem(String itemId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_galleryItemsCollection).doc(itemId).delete();
    } catch (e) {
      print('Error deleting gallery item: $e');
      // Remove from mock data for development
      _mockGalleryItems.removeWhere((item) => item.id == itemId);
    }
  }

  // Increment view count
  static Future<void> incrementViewCount(String itemId) async {
    try {
      await _firestore.collection(_galleryItemsCollection).doc(itemId).update({
        'viewCount': FieldValue.increment(1),
      });
    } catch (e) {
      print('Error incrementing view count: $e');
      // Update mock data for development
      final index = _mockGalleryItems.indexWhere((item) => item.id == itemId);
      if (index != -1) {
        _mockGalleryItems[index] = _mockGalleryItems[index].copyWith(
          viewCount: _mockGalleryItems[index].viewCount + 1,
        );
      }
    }
  }

  // Toggle like
  static Future<void> toggleLike(String itemId, String userId) async {
    try {
      final item = await getGalleryItemById(itemId);
      if (item == null) return;

      final isLiked = item.likedBy.contains(userId);
      final newLikedBy = List<String>.from(item.likedBy);
      
      if (isLiked) {
        newLikedBy.remove(userId);
      } else {
        newLikedBy.add(userId);
      }

      await _firestore.collection(_galleryItemsCollection).doc(itemId).update({
        'likeCount': isLiked ? FieldValue.increment(-1) : FieldValue.increment(1),
        'likedBy': newLikedBy,
      });
    } catch (e) {
      print('Error toggling like: $e');
      // Update mock data for development
      final index = _mockGalleryItems.indexWhere((item) => item.id == itemId);
      if (index != -1) {
        final item = _mockGalleryItems[index];
        final isLiked = item.likedBy.contains(userId);
        final newLikedBy = List<String>.from(item.likedBy);
        
        if (isLiked) {
          newLikedBy.remove(userId);
        } else {
          newLikedBy.add(userId);
        }

        _mockGalleryItems[index] = item.copyWith(
          likeCount: isLiked ? item.likeCount - 1 : item.likeCount + 1,
          likedBy: newLikedBy,
        );
      }
    }
  }

  // Search gallery items
  static Future<List<GalleryItem>> searchGalleryItems(String schoolId, String query) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // Note: Firestore doesn't support full-text search natively
      // In a real app, you'd use Algolia or similar service
      final allItems = await getGalleryItemsBySchool(schoolId);
      
      return allItems.where((item) {
        return item.title.toLowerCase().contains(query.toLowerCase()) ||
               item.description.toLowerCase().contains(query.toLowerCase()) ||
               item.tags.any((tag) => tag.toLowerCase().contains(query.toLowerCase()));
      }).toList();
    } catch (e) {
      print('Error searching gallery items: $e');
      // Return mock data for development
      final allItems = _mockGalleryItems
          .where((item) => item.schoolId == schoolId && item.isActive)
          .toList();
      
      return allItems.where((item) {
        return item.title.toLowerCase().contains(query.toLowerCase()) ||
               item.description.toLowerCase().contains(query.toLowerCase()) ||
               item.tags.any((tag) => tag.toLowerCase().contains(query.toLowerCase()));
      }).toList();
    }
  }

  // Get featured gallery items
  static Future<List<GalleryItem>> getFeaturedGalleryItems(String schoolId, {int limit = 6}) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_galleryItemsCollection)
          .where('schoolId', isEqualTo: schoolId)
          .where('isActive', isEqualTo: true)
          .where('isPublic', isEqualTo: true)
          .orderBy('likeCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => GalleryItem.fromMap(doc.data()!))
          .toList();
    } catch (e) {
      print('Error getting featured gallery items: $e');
      // Return mock data for development
      final items = _mockGalleryItems
          .where((item) => item.schoolId == schoolId && item.isActive && item.isPublic)
          .toList();
      
      items.sort((a, b) => b.likeCount.compareTo(a.likeCount));
      return items.take(limit).toList();
    }
  }

  // Get gallery statistics
  static Future<Map<String, dynamic>> getGalleryStatistics(String schoolId) async {
    try {
      final items = await getGalleryItemsBySchool(schoolId);
      final albums = await getGalleryAlbumsBySchool(schoolId);
      
      int totalItems = items.length;
      int totalAlbums = albums.length;
      int totalViews = items.fold(0, (sum, item) => sum + item.viewCount);
      int totalLikes = items.fold(0, (sum, item) => sum + item.likeCount);
      
      Map<GalleryCategory, int> categoryCount = {};
      for (final category in GalleryCategory.values) {
        categoryCount[category] = items.where((item) => item.category == category).length;
      }
      
      return {
        'totalItems': totalItems,
        'totalAlbums': totalAlbums,
        'totalViews': totalViews,
        'totalLikes': totalLikes,
        'categoryCount': categoryCount,
      };
    } catch (e) {
      print('Error getting gallery statistics: $e');
      return {
        'totalItems': 0,
        'totalAlbums': 0,
        'totalViews': 0,
        'totalLikes': 0,
        'categoryCount': <GalleryCategory, int>{},
      };
    }
  }
}
