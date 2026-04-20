import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/gallery_model.dart';
import '../../services/gallery_service.dart';
import '../../services/auth_service.dart';

class GalleryDetailScreen extends StatefulWidget {
  final GalleryItem item;

  const GalleryDetailScreen({super.key, required this.item});

  @override
  State<GalleryDetailScreen> createState() => _GalleryDetailScreenState();
}

class _GalleryDetailScreenState extends State<GalleryDetailScreen> {
  late GalleryItem _item;
  bool _isLiked = false;

  @override
  void initState() {
    super.initState();
    _item = widget.item;
    _isLiked = _item.likedBy.contains(AuthService.getCurrentUser()?.uid ?? '');
    
    // Increment view count
    GalleryService.incrementViewCount(_item.id);
  }

  Future<void> _toggleLike() async {
    final currentUser = AuthService.getCurrentUser();
    if (currentUser == null) return;

    setState(() {
      _isLiked = !_isLiked;
    });

    try {
      await GalleryService.toggleLike(_item.id, currentUser?.uid ?? '');
      
      // Update local state
      setState(() {
        _item = _item.copyWith(
          likeCount: _isLiked ? _item.likeCount + 1 : _item.likeCount - 1,
          likedBy: _isLiked 
              ? [..._item.likedBy, currentUser?.uid ?? '']
              : _item.likedBy.where((id) => id != (currentUser?.uid ?? '')).toList(),
        );
      });
    } catch (e) {
      // Revert on error
      setState(() {
        _isLiked = !_isLiked;
      });
      print('Error toggling like: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black.withOpacity(0.8),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(_isLiked ? Icons.favorite : Icons.favorite_border),
            onPressed: _toggleLike,
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Share feature coming soon!')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Media Display
          Expanded(
            child: Center(
              child: _buildMediaDisplay(),
            ),
          ),
          
          // Media Info
          Container(
            padding: const EdgeInsets.all(AppConstants.paddingMedium),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.8),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title and Category
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        _item.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getCategoryColor(_item.category).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _item.categoryDisplayName,
                        style: TextStyle(
                          color: _getCategoryColor(_item.category),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppConstants.paddingSmall),
                
                // Description
                Text(
                  _item.description,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: AppConstants.paddingMedium),
                
                // Stats and Info
                Row(
                  children: [
                    _buildStatItem(Icons.visibility, '${_item.viewCount}'),
                    const SizedBox(width: AppConstants.paddingLarge),
                    _buildStatItem(Icons.favorite, '${_item.likeCount}'),
                    const SizedBox(width: AppConstants.paddingLarge),
                    _buildStatItem(Icons.person, _item.uploadedByName),
                    const Spacer(),
                    Text(
                      _formatDate(_item.uploadedAt),
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppConstants.paddingMedium),
                
                // Tags
                if (_item.tags.isNotEmpty) ...[
                  Wrap(
                    spacing: AppConstants.paddingSmall,
                    children: _item.tags.map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '#$tag',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),
                ],
                
                // Media Type Info
                Container(
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _item.isImage ? Icons.image : Icons.play_circle_outline,
                        color: Colors.white70,
                        size: 20,
                      ),
                      const SizedBox(width: AppConstants.paddingSmall),
                      Text(
                        _item.mediaTypeDisplayName,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                      const Spacer(),
                      if (_item.isVideo)
                        const Icon(
                          Icons.play_arrow,
                          color: Colors.white70,
                          size: 20,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMediaDisplay() {
    if (_item.isImage) {
      return _buildImageDisplay();
    } else {
      return _buildVideoDisplay();
    }
  }

  Widget _buildImageDisplay() {
    return Container(
      constraints: const BoxConstraints(maxHeight: 400),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          height: 300,
          color: Colors.grey[800],
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.image,
                  size: 64,
                  color: Colors.white54,
                ),
                SizedBox(height: AppConstants.paddingSmall),
                Text(
                  'Image Preview',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 16,
                  ),
                ),
                Text(
                  'In a real app, this would show the actual image',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildVideoDisplay() {
    return Container(
      constraints: const BoxConstraints(maxHeight: 400),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          height: 300,
          color: Colors.grey[800],
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.play_circle_outline,
                  size: 64,
                  color: Colors.white54,
                ),
                SizedBox(height: AppConstants.paddingSmall),
                Text(
                  'Video Preview',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 16,
                  ),
                ),
                Text(
                  'In a real app, this would show the video player',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value) {
    return Row(
      children: [
        Icon(
          icon,
          color: Colors.white70,
          size: 16,
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Color _getCategoryColor(GalleryCategory category) {
    switch (category) {
      case GalleryCategory.events:
        return Colors.blue;
      case GalleryCategory.sports:
        return Colors.orange;
      case GalleryCategory.academics:
        return Colors.green;
      case GalleryCategory.extracurricular:
        return Colors.purple;
      case GalleryCategory.achievements:
        return Colors.red;
      case GalleryCategory.general:
        return Colors.grey;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
