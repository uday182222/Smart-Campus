import 'package:cloud_firestore/cloud_firestore.dart';

enum MediaType {
  image,
  video,
}

enum GalleryCategory {
  events,
  sports,
  academics,
  extracurricular,
  achievements,
  general,
}

class GalleryItem {
  final String id;
  final String schoolId;
  final String title;
  final String description;
  final MediaType mediaType;
  final String mediaUrl;
  final String? thumbnailUrl;
  final GalleryCategory category;
  final List<String> tags;
  final String uploadedBy;
  final String uploadedByName;
  final DateTime uploadedAt;
  final bool isActive;
  final bool isPublic;
  final int viewCount;
  final int likeCount;
  final List<String> likedBy;
  final Map<String, dynamic>? metadata;

  GalleryItem({
    required this.id,
    required this.schoolId,
    required this.title,
    required this.description,
    required this.mediaType,
    required this.mediaUrl,
    this.thumbnailUrl,
    required this.category,
    this.tags = const [],
    required this.uploadedBy,
    required this.uploadedByName,
    required this.uploadedAt,
    required this.isActive,
    required this.isPublic,
    this.viewCount = 0,
    this.likeCount = 0,
    this.likedBy = const [],
    this.metadata,
  });

  factory GalleryItem.fromMap(Map<String, dynamic> map) {
    return GalleryItem(
      id: map['id'] ?? '',
      schoolId: map['schoolId'] ?? '',
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      mediaType: MediaType.values.firstWhere(
        (e) => e.name == map['mediaType'],
        orElse: () => MediaType.image,
      ),
      mediaUrl: map['mediaUrl'] ?? '',
      thumbnailUrl: map['thumbnailUrl'],
      category: GalleryCategory.values.firstWhere(
        (e) => e.name == map['category'],
        orElse: () => GalleryCategory.general,
      ),
      tags: List<String>.from(map['tags'] ?? []),
      uploadedBy: map['uploadedBy'] ?? '',
      uploadedByName: map['uploadedByName'] ?? '',
      uploadedAt: (map['uploadedAt'] as Timestamp).toDate(),
      isActive: map['isActive'] ?? true,
      isPublic: map['isPublic'] ?? true,
      viewCount: map['viewCount'] ?? 0,
      likeCount: map['likeCount'] ?? 0,
      likedBy: List<String>.from(map['likedBy'] ?? []),
      metadata: map['metadata'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'schoolId': schoolId,
      'title': title,
      'description': description,
      'mediaType': mediaType.name,
      'mediaUrl': mediaUrl,
      'thumbnailUrl': thumbnailUrl,
      'category': category.name,
      'tags': tags,
      'uploadedBy': uploadedBy,
      'uploadedByName': uploadedByName,
      'uploadedAt': Timestamp.fromDate(uploadedAt),
      'isActive': isActive,
      'isPublic': isPublic,
      'viewCount': viewCount,
      'likeCount': likeCount,
      'likedBy': likedBy,
      'metadata': metadata,
    };
  }

  GalleryItem copyWith({
    String? id,
    String? schoolId,
    String? title,
    String? description,
    MediaType? mediaType,
    String? mediaUrl,
    String? thumbnailUrl,
    GalleryCategory? category,
    List<String>? tags,
    String? uploadedBy,
    String? uploadedByName,
    DateTime? uploadedAt,
    bool? isActive,
    bool? isPublic,
    int? viewCount,
    int? likeCount,
    List<String>? likedBy,
    Map<String, dynamic>? metadata,
  }) {
    return GalleryItem(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      title: title ?? this.title,
      description: description ?? this.description,
      mediaType: mediaType ?? this.mediaType,
      mediaUrl: mediaUrl ?? this.mediaUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      category: category ?? this.category,
      tags: tags ?? this.tags,
      uploadedBy: uploadedBy ?? this.uploadedBy,
      uploadedByName: uploadedByName ?? this.uploadedByName,
      uploadedAt: uploadedAt ?? this.uploadedAt,
      isActive: isActive ?? this.isActive,
      isPublic: isPublic ?? this.isPublic,
      viewCount: viewCount ?? this.viewCount,
      likeCount: likeCount ?? this.likeCount,
      likedBy: likedBy ?? this.likedBy,
      metadata: metadata ?? this.metadata,
    );
  }

  String get mediaTypeDisplayName {
    switch (mediaType) {
      case MediaType.image:
        return 'Image';
      case MediaType.video:
        return 'Video';
    }
  }

  String get categoryDisplayName {
    switch (category) {
      case GalleryCategory.events:
        return 'Events';
      case GalleryCategory.sports:
        return 'Sports';
      case GalleryCategory.academics:
        return 'Academics';
      case GalleryCategory.extracurricular:
        return 'Extracurricular';
      case GalleryCategory.achievements:
        return 'Achievements';
      case GalleryCategory.general:
        return 'General';
    }
  }

  bool get isImage => mediaType == MediaType.image;
  bool get isVideo => mediaType == MediaType.video;
}

class GalleryAlbum {
  final String id;
  final String schoolId;
  final String name;
  final String description;
  final GalleryCategory category;
  final String coverImageUrl;
  final List<String> galleryItemIds;
  final String createdBy;
  final String createdByName;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isActive;
  final bool isPublic;

  GalleryAlbum({
    required this.id,
    required this.schoolId,
    required this.name,
    required this.description,
    required this.category,
    required this.coverImageUrl,
    this.galleryItemIds = const [],
    required this.createdBy,
    required this.createdByName,
    required this.createdAt,
    required this.updatedAt,
    required this.isActive,
    required this.isPublic,
  });

  factory GalleryAlbum.fromMap(Map<String, dynamic> map) {
    return GalleryAlbum(
      id: map['id'] ?? '',
      schoolId: map['schoolId'] ?? '',
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      category: GalleryCategory.values.firstWhere(
        (e) => e.name == map['category'],
        orElse: () => GalleryCategory.general,
      ),
      coverImageUrl: map['coverImageUrl'] ?? '',
      galleryItemIds: List<String>.from(map['galleryItemIds'] ?? []),
      createdBy: map['createdBy'] ?? '',
      createdByName: map['createdByName'] ?? '',
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
      isActive: map['isActive'] ?? true,
      isPublic: map['isPublic'] ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'schoolId': schoolId,
      'name': name,
      'description': description,
      'category': category.name,
      'coverImageUrl': coverImageUrl,
      'galleryItemIds': galleryItemIds,
      'createdBy': createdBy,
      'createdByName': createdByName,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'isActive': isActive,
      'isPublic': isPublic,
    };
  }

  GalleryAlbum copyWith({
    String? id,
    String? schoolId,
    String? name,
    String? description,
    GalleryCategory? category,
    String? coverImageUrl,
    List<String>? galleryItemIds,
    String? createdBy,
    String? createdByName,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
    bool? isPublic,
  }) {
    return GalleryAlbum(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      galleryItemIds: galleryItemIds ?? this.galleryItemIds,
      createdBy: createdBy ?? this.createdBy,
      createdByName: createdByName ?? this.createdByName,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
      isPublic: isPublic ?? this.isPublic,
    );
  }

  String get categoryDisplayName {
    switch (category) {
      case GalleryCategory.events:
        return 'Events';
      case GalleryCategory.sports:
        return 'Sports';
      case GalleryCategory.academics:
        return 'Academics';
      case GalleryCategory.extracurricular:
        return 'Extracurricular';
      case GalleryCategory.achievements:
        return 'Achievements';
      case GalleryCategory.general:
        return 'General';
    }
  }

  int get itemCount => galleryItemIds.length;
}
