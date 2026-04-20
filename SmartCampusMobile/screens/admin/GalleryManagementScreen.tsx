// @ts-nocheck
/**
 * Gallery Management Screen
 * Complete gallery management for admin users
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Folder, Plus, Search, Globe, Users, Lock, Grid3X3, List, Image as ImageIcon, UploadCloud } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { T } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

// Components
import MediaUploadModal from '../../components/gallery/MediaUploadModal';
import MediaViewerModal from '../../components/gallery/MediaViewerModal';
import AlbumManagementModal from '../../components/gallery/AlbumManagementModal';
import MediaGrid from '../../components/gallery/MediaGrid';

// Services
import GalleryService from '../../services/GalleryService';

const { width } = Dimensions.get('window');

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  caption: string;
  tags: string[];
  event: string;
  date: Date;
  visibility: 'public' | 'class-specific' | 'private';
  albumId?: string;
  albumName?: string;
  uploadDate: Date;
  fileSize: number;
  dimensions?: { width: number; height: number };
  views: number;
  downloads: number;
}

interface Album {
  id: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  mediaCount: number;
  createdAt: Date;
  visibility: 'public' | 'class-specific' | 'private';
}

const GalleryManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();

  if (userData?.role === 'PRINCIPAL') {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: T.textMuted }}>Access restricted to Admin only.</Text>
      </View>
    );
  }
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    loadGalleryData();
  }, []);

  useEffect(() => {
    filterMedia();
  }, [mediaItems, searchQuery, selectedAlbum, selectedEvent, selectedVisibility]);

  const loadGalleryData = async () => {
    try {
      setLoading(true);
      const [mediaData, albumsData] = await Promise.all([
        GalleryService.getAllMedia(),
        GalleryService.getAllAlbums(),
      ]);
      setMediaItems(mediaData);
      setAlbums(albumsData);
    } catch (error) {
      console.error('Error loading gallery data:', error);
      Alert.alert('Error', 'Failed to load gallery data');
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = mediaItems;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.event.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by album
    if (selectedAlbum !== 'all') {
      filtered = filtered.filter(item => item.albumId === selectedAlbum);
    }

    // Filter by event
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(item => item.event === selectedEvent);
    }

    // Filter by visibility
    if (selectedVisibility !== 'all') {
      filtered = filtered.filter(item => item.visibility === selectedVisibility);
    }

    setFilteredMedia(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGalleryData();
    setRefreshing(false);
  };

  const handleMediaPress = (media: MediaItem, index: number) => {
    setSelectedMedia(media);
    setSelectedMediaIndex(index);
    setShowViewerModal(true);
  };

  const handleUploadPress = () => {
    setShowUploadModal(true);
  };

  const handleAlbumPress = () => {
    setShowAlbumModal(true);
  };

  const handleMediaUploaded = (newMedia: MediaItem[]) => {
    setMediaItems(prev => [...newMedia, ...prev]);
    Alert.alert('Success', `${newMedia.length} media item(s) uploaded successfully`);
  };

  const handleMediaDeleted = (mediaId: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== mediaId));
    Alert.alert('Success', 'Media deleted successfully');
  };

  const handleBulkAction = async (action: 'delete' | 'move' | 'visibility', mediaIds: string[], data?: any) => {
    try {
      switch (action) {
        case 'delete':
          await GalleryService.deleteMultipleMedia(mediaIds);
          setMediaItems(prev => prev.filter(item => !mediaIds.includes(item.id)));
          break;
        case 'move':
          await GalleryService.moveMediaToAlbum(mediaIds, data.albumId);
          setMediaItems(prev => prev.map(item => 
            mediaIds.includes(item.id) 
              ? { ...item, albumId: data.albumId, albumName: data.albumName }
              : item
          ));
          break;
        case 'visibility':
          await GalleryService.updateMediaVisibility(mediaIds, data.visibility);
          setMediaItems(prev => prev.map(item => 
            mediaIds.includes(item.id) 
              ? { ...item, visibility: data.visibility }
              : item
          ));
          break;
      }
      Alert.alert('Success', 'Bulk action completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to perform bulk action');
    }
  };

  const getUniqueEvents = () => {
    const events = [...new Set(mediaItems.map(item => item.event))];
    return events.sort();
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'public';
      case 'class-specific': return 'group';
      case 'private': return 'lock';
      default: return 'visibility';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return '#2ECC71';
      case 'class-specific': return '#3498DB';
      case 'private': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }}>Admin</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Gallery Management</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}>
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }} onPress={handleAlbumPress}>
              <Folder size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }} onPress={handleUploadPress}>
              <Plus size={20} color={T.textWhite} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={T.textPlaceholder} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search media, tags, or events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={T.textPlaceholder}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {/* Album Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Album:</Text>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedAlbum === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedAlbum('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedAlbum === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {albums.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={[
                  styles.filterButton,
                  selectedAlbum === album.id && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedAlbum(album.id)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedAlbum === album.id && styles.filterButtonTextActive,
                  ]}
                >
                  {album.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Event Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Event:</Text>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedEvent === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedEvent('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedEvent === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {getUniqueEvents().map((event) => (
              <TouchableOpacity
                key={event}
                style={[
                  styles.filterButton,
                  selectedEvent === event && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedEvent(event)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedEvent === event && styles.filterButtonTextActive,
                  ]}
                >
                  {event}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visibility Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Visibility:</Text>
            {['all', 'public', 'class-specific', 'private'].map((visibility) => (
              <TouchableOpacity
                key={visibility}
                style={[
                  styles.filterButton,
                  selectedVisibility === visibility && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedVisibility(visibility)}
              >
                {visibility === 'public' ? <Globe size={16} color={selectedVisibility === visibility ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {visibility === 'class-specific' ? <Users size={16} color={selectedVisibility === visibility ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {visibility === 'private' ? <Lock size={16} color={selectedVisibility === visibility ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {visibility === 'all' ? <ImageIcon size={16} color={selectedVisibility === visibility ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedVisibility === visibility && styles.filterButtonTextActive,
                  ]}
                >
                  {visibility === 'all' ? 'All' : visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'grid' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Grid3X3 size={20} color={viewMode === 'grid' ? T.textWhite : T.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'list' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <List size={20} color={viewMode === 'list' ? T.textWhite : T.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
        <Text style={styles.resultsCount}>
          {filteredMedia.length} media item(s)
        </Text>
      </View>

      {/* Media Grid/List */}
      <ScrollView
        style={styles.mediaContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading gallery...</Text>
          </View>
        ) : filteredMedia.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={34} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No Media Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search' : 'Upload your first media to get started'}
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadPress}
            >
              <UploadCloud size={18} color={T.textWhite} strokeWidth={1.8} />
              <Text style={styles.uploadButtonText}>Upload Media</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MediaGrid
            media={filteredMedia}
            viewMode={viewMode}
            onMediaPress={handleMediaPress}
            onMediaDelete={handleMediaDeleted}
            onBulkAction={handleBulkAction}
          />
        )}
      </ScrollView>

      {/* Modals */}
      <MediaUploadModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleMediaUploaded}
        albums={albums}
      />

      <MediaViewerModal
        visible={showViewerModal}
        media={selectedMedia}
        mediaIndex={selectedMediaIndex}
        allMedia={filteredMedia}
        onClose={() => setShowViewerModal(false)}
        onDelete={handleMediaDeleted}
      />

      <AlbumManagementModal
        visible={showAlbumModal}
        onClose={() => setShowAlbumModal(false)}
        albums={albums}
        onAlbumUpdate={(updatedAlbums) => setAlbums(updatedAlbums)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  searchContainer: {
    paddingHorizontal: T.px,
    paddingBottom: 12,
    backgroundColor: T.bg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.radius.xxl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    ...T.shadowSm,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: T.textDark,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: T.textDark,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.card,
    gap: 4,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    ...T.shadowSm,
  },
  filterButtonActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textMuted,
  },
  filterButtonTextActive: {
    color: T.textWhite,
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: T.px,
    paddingVertical: 12,
    backgroundColor: T.bg,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: T.card,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
  },
  viewModeButton: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: T.primary,
  },
  resultsCount: {
    fontSize: 14,
    color: T.textMuted,
  },
  mediaContainer: {
    flex: 1,
    paddingHorizontal: T.px,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: T.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: T.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    ...T.shadowSm,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: T.textWhite,
  },
});

export default GalleryManagementScreen;
