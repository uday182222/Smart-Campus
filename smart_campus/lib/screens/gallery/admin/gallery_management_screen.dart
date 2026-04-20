import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/gallery_model.dart';
import '../../../services/gallery_service.dart';
import '../../../services/auth_service.dart';
import 'upload_gallery_item_screen.dart';

class GalleryManagementScreen extends StatefulWidget {
  const GalleryManagementScreen({super.key});

  @override
  State<GalleryManagementScreen> createState() => _GalleryManagementScreenState();
}

class _GalleryManagementScreenState extends State<GalleryManagementScreen> {
  List<GalleryItem> _galleryItems = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';

  final List<Map<String, String>> _filters = [
    {'value': 'all', 'label': 'All Items'},
    {'value': 'images', 'label': 'Images'},
    {'value': 'videos', 'label': 'Videos'},
    {'value': 'public', 'label': 'Public'},
    {'value': 'private', 'label': 'Private'},
  ];

  @override
  void initState() {
    super.initState();
    _loadGalleryItems();
  }

  Future<void> _loadGalleryItems() async {
    setState(() => _isLoading = true);
    
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser != null) {
        final galleryItems = await GalleryService.getGalleryItemsBySchool('SCH-2025-A12'); // Default school ID
        setState(() {
          _galleryItems = galleryItems;
        });
      }
    } catch (e) {
      print('Error loading gallery items: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading gallery items: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<GalleryItem> get _filteredGalleryItems {
    if (_selectedFilter == 'all') return _galleryItems;
    
    return _galleryItems.where((item) {
      switch (_selectedFilter) {
        case 'images':
          return item.isImage;
        case 'videos':
          return item.isVideo;
        case 'public':
          return item.isPublic;
        case 'private':
          return !item.isPublic;
        default:
          return true;
      }
    }).toList();
  }

  Future<void> _deleteGalleryItem(GalleryItem item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Gallery Item'),
        content: Text('Are you sure you want to delete "${item.title}"? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await GalleryService.deleteGalleryItem(item.id);
        setState(() {
          _galleryItems.removeWhere((galleryItem) => galleryItem.id == item.id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gallery item "${item.title}" deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting gallery item: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gallery Management'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadGalleryItems,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Section
          _buildFilterSection(),
          
          // Gallery Items List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredGalleryItems.isEmpty
                    ? _buildEmptyState()
                    : _buildGalleryItemsList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const UploadGalleryItemScreen(),
            ),
          );
          if (result == true) {
            _loadGalleryItems();
          }
        },
        backgroundColor: AppConstants.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildFilterSection() {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(
          bottom: BorderSide(color: Colors.grey[300]!),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filter Gallery Items',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filters.map((filter) {
                final isSelected = _selectedFilter == filter['value'];
                return Padding(
                  padding: const EdgeInsets.only(right: AppConstants.paddingSmall),
                  child: FilterChip(
                    label: Text(filter['label']!),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedFilter = filter['value']!;
                      });
                    },
                    selectedColor: AppConstants.primaryColor.withOpacity(0.2),
                    checkmarkColor: AppConstants.primaryColor,
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.photo_library_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'No gallery items found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'Upload your first gallery item to get started',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppConstants.paddingLarge),
          ElevatedButton.icon(
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const UploadGalleryItemScreen(),
                ),
              );
              if (result == true) {
                _loadGalleryItems();
              }
            },
            icon: const Icon(Icons.add),
            label: const Text('Upload Item'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGalleryItemsList() {
    return RefreshIndicator(
      onRefresh: _loadGalleryItems,
      child: GridView.builder(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: AppConstants.paddingMedium,
          mainAxisSpacing: AppConstants.paddingMedium,
          childAspectRatio: 0.8,
        ),
        itemCount: _filteredGalleryItems.length,
        itemBuilder: (context, index) {
          final item = _filteredGalleryItems[index];
          return _buildGalleryItemCard(item);
        },
      ),
    );
  }

  Widget _buildGalleryItemCard(GalleryItem item) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Media Preview
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                color: Colors.grey[200],
              ),
              child: Stack(
                children: [
                  // Placeholder for media
                  Container(
                    width: double.infinity,
                    height: double.infinity,
                    color: Colors.grey[300],
                    child: Icon(
                      item.isImage ? Icons.image : Icons.play_circle_outline,
                      size: 48,
                      color: Colors.grey[500],
                    ),
                  ),
                  
                  // Media Type Indicator
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        item.mediaTypeDisplayName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  
                  // Visibility Indicator
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: item.isPublic ? Colors.green : Colors.orange,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        item.isPublic ? 'Public' : 'Private',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Content
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.paddingSmall),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.categoryDisplayName,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: _getCategoryColor(item.category),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      Icon(
                        Icons.visibility,
                        size: 14,
                        color: Colors.grey[500],
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '${item.viewCount}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[500],
                        ),
                      ),
                      const SizedBox(width: AppConstants.paddingSmall),
                      Icon(
                        Icons.favorite,
                        size: 14,
                        color: Colors.grey[500],
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '${item.likeCount}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[500],
                        ),
                      ),
                      const Spacer(),
                      // Action Buttons
                      PopupMenuButton<String>(
                        onSelected: (value) {
                          switch (value) {
                            case 'edit':
                              _editGalleryItem(item);
                              break;
                            case 'delete':
                              _deleteGalleryItem(item);
                              break;
                            case 'toggle_visibility':
                              _toggleVisibility(item);
                              break;
                          }
                        },
                        itemBuilder: (context) => [
                          const PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit, size: 16),
                                SizedBox(width: 8),
                                Text('Edit'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'toggle_visibility',
                            child: Row(
                              children: [
                                Icon(Icons.visibility, size: 16),
                                SizedBox(width: 8),
                                Text('Toggle Visibility'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete, size: 16, color: Colors.red),
                                SizedBox(width: 8),
                                Text('Delete', style: TextStyle(color: Colors.red)),
                              ],
                            ),
                          ),
                        ],
                        child: const Icon(Icons.more_vert, size: 16),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _editGalleryItem(GalleryItem item) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => UploadGalleryItemScreen(galleryItem: item),
      ),
    ).then((result) {
      if (result == true) {
        _loadGalleryItems();
      }
    });
  }

  Future<void> _toggleVisibility(GalleryItem item) async {
    try {
      await GalleryService.updateGalleryItem(item.copyWith(isPublic: !item.isPublic));
      setState(() {
        final index = _galleryItems.indexWhere((galleryItem) => galleryItem.id == item.id);
        if (index != -1) {
          _galleryItems[index] = _galleryItems[index].copyWith(isPublic: !_galleryItems[index].isPublic);
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Visibility updated to ${item.isPublic ? "Private" : "Public"}'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error updating visibility: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
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
}
