import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/gallery_model.dart';
import '../../../services/gallery_service.dart';
import '../../../services/auth_service.dart';

class UploadGalleryItemScreen extends StatefulWidget {
  final GalleryItem? galleryItem;

  const UploadGalleryItemScreen({super.key, this.galleryItem});

  @override
  State<UploadGalleryItemScreen> createState() => _UploadGalleryItemScreenState();
}

class _UploadGalleryItemScreenState extends State<UploadGalleryItemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _tagsController = TextEditingController();

  MediaType _selectedMediaType = MediaType.image;
  GalleryCategory _selectedCategory = GalleryCategory.general;
  bool _isPublic = true;
  bool _isLoading = false;
  bool _isEditMode = false;

  @override
  void initState() {
    super.initState();
    _isEditMode = widget.galleryItem != null;
    if (_isEditMode) {
      _initializeWithGalleryItem();
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  void _initializeWithGalleryItem() {
    final item = widget.galleryItem!;
    _titleController.text = item.title;
    _descriptionController.text = item.description;
    _tagsController.text = item.tags.join(', ');
    _selectedMediaType = item.mediaType;
    _selectedCategory = item.category;
    _isPublic = item.isPublic;
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final tags = _tagsController.text
          .split(',')
          .map((tag) => tag.trim())
          .where((tag) => tag.isNotEmpty)
          .toList();

      final galleryItem = GalleryItem(
        id: _isEditMode ? widget.galleryItem!.id : '',
        schoolId: 'SCH-2025-A12', // Default school ID
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        mediaType: _selectedMediaType,
        mediaUrl: _isEditMode ? widget.galleryItem!.mediaUrl : 'https://example.com/placeholder.jpg',
        category: _selectedCategory,
        tags: tags,
        uploadedBy: currentUser?.uid ?? '',
        uploadedByName: currentUser?.displayName ?? 'Admin',
        uploadedAt: _isEditMode ? widget.galleryItem!.uploadedAt : DateTime.now(),
        isActive: true,
        isPublic: _isPublic,
        viewCount: _isEditMode ? widget.galleryItem!.viewCount : 0,
        likeCount: _isEditMode ? widget.galleryItem!.likeCount : 0,
        likedBy: _isEditMode ? widget.galleryItem!.likedBy : [],
      );

      if (_isEditMode) {
        await GalleryService.updateGalleryItem(galleryItem);
      } else {
        await GalleryService.uploadGalleryItem(galleryItem);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditMode ? 'Gallery item updated successfully' : 'Gallery item uploaded successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      print('Error saving gallery item: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Edit Gallery Item' : 'Upload Gallery Item'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Basic Information
              _buildBasicInfoSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Media Type Selection
              _buildMediaTypeSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Category Selection
              _buildCategorySection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Settings
              _buildSettingsSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Media Upload Placeholder
              _buildMediaUploadSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Submit Button
              _buildSubmitButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfoSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Basic Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.title),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a title';
                }
                return null;
              },
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.description),
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _tagsController,
              decoration: const InputDecoration(
                labelText: 'Tags (comma-separated)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.tag),
                hintText: 'e.g., sports, event, 2024',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaTypeSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Media Type',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            Row(
              children: [
                Expanded(
                  child: RadioListTile<MediaType>(
                    title: const Text('Image'),
                    subtitle: const Text('Photos, graphics'),
                    value: MediaType.image,
                    groupValue: _selectedMediaType,
                    onChanged: (MediaType? value) {
                      setState(() {
                        _selectedMediaType = value!;
                      });
                    },
                  ),
                ),
                Expanded(
                  child: RadioListTile<MediaType>(
                    title: const Text('Video'),
                    subtitle: const Text('Videos, animations'),
                    value: MediaType.video,
                    groupValue: _selectedMediaType,
                    onChanged: (MediaType? value) {
                      setState(() {
                        _selectedMediaType = value!;
                      });
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategorySection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Category',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            DropdownButtonFormField<GalleryCategory>(
              value: _selectedCategory,
              decoration: const InputDecoration(
                labelText: 'Select Category',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.category),
              ),
              items: GalleryCategory.values.map((category) {
                return DropdownMenuItem(
                  value: category,
                  child: Text(_getCategoryDisplayName(category)),
                );
              }).toList(),
              onChanged: (GalleryCategory? category) {
                setState(() {
                  _selectedCategory = category!;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Settings',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            SwitchListTile(
              title: const Text('Public'),
              subtitle: const Text('Visible to all users'),
              value: _isPublic,
              onChanged: (bool value) {
                setState(() {
                  _isPublic = value;
                });
              },
              secondary: Icon(
                _isPublic ? Icons.public : Icons.lock,
                color: _isPublic ? Colors.green : Colors.orange,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaUploadSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Media Upload',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[400]!),
                borderRadius: BorderRadius.circular(8),
                color: Colors.grey[50],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _selectedMediaType == MediaType.image ? Icons.image : Icons.videocam,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),
                  Text(
                    _isEditMode ? 'Media file already uploaded' : 'Media upload feature coming soon',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  if (!_isEditMode) ...[
                    const SizedBox(height: AppConstants.paddingSmall),
                    Text(
                      'In a real app, this would allow file upload',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _submitForm,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppConstants.primaryColor,
          foregroundColor: AppConstants.textWhite,
          padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: _isLoading
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
                  SizedBox(width: AppConstants.paddingSmall),
                  Text('Saving...'),
                ],
              )
            : Text(_isEditMode ? 'Update Gallery Item' : 'Upload Gallery Item'),
      ),
    );
  }

  String _getCategoryDisplayName(GalleryCategory category) {
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
}
