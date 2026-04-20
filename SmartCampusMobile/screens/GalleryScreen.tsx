/**
 * Modern Gallery Screen - Photo gallery from API (GET /gallery/:schoolId)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  StatusBar,
  Share,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { FloatingNav } from '../components/ui/FloatingNav';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import apiClient from '../services/apiClient';

import { LightButton } from '../components/ui';
import { PD, darkenHex } from '../constants/parentDesign';
import { LT } from '../constants/lightTheme';

// Theme (grid layout)
import { colors, spacing, typography, borderRadius } from '../theme';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const IMAGE_SIZE = (width - spacing.md * 2 - spacing.xs * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

interface GalleryItem {
  id: string;
  uri: string;
  title: string;
  event: string;
  date: string;
  viewCount: number;
  width: number;
  height: number;
}

const GalleryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack();
  const insets = useSafeAreaInsets();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const { userData } = useAuth();
  const isParent = (userData?.role ?? '').toUpperCase() === 'PARENT';
  const schoolId = userData?.schoolId ?? '';
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const filters = ['All', 'Sports Day', 'Annual Function', 'Science Fair', 'Art Exhibition', 'Awards'];

  const loadGallery = async () => {
    if (!schoolId) return;
    try {
      const res = await apiClient.get<{ data?: { items?: any[] } }>(`/gallery/${schoolId}`);
      const items = (res as any).data?.items ?? [];
      setGalleryItems(
        items.map((item: any) => ({
          id: item.id,
          uri: item.thumbnailUrl || item.url || '',
          title: item.caption || item.event || 'Photo',
          event: item.event || item.album?.name || 'Event',
          date: item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : '',
          viewCount: item.views ?? 0,
          width: item.dimensions?.width ?? 400,
          height: item.dimensions?.height ?? 400,
        }))
      );
    } catch (e) {
      console.error(e);
      setGalleryItems([]);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [schoolId]);

  const filteredItems = galleryItems.filter(
    item => selectedFilter === 'All' || item.event === selectedFilter
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGallery();
    setRefreshing(false);
  };

  const handleImagePress = (item: GalleryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImage(item);
  };

  const handleShare = async () => {
    if (selectedImage) {
      try {
        await Share.share({
          message: `Check out this photo from ${selectedImage.event}!`,
          url: selectedImage.uri,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      // Handle upload
      setUploadModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Camera permission needed', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      // Handle upload
      setUploadModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderItem = ({ item, index }: { item: GalleryItem; index: number }) => (
    <Animated.View entering={FadeInDown.delay(50 * (index % 9)).springify()}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleImagePress(item)}
        style={styles.imageContainer}
      >
        <Image
          source={{ uri: `${item.uri}?id=${item.id}` }}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.imageOverlay}
        >
          <View style={styles.viewCountBadge}>
            <MaterialCommunityIcons
              name="eye"
              size={12}
              color={colors.text.white}
            />
            <Text style={styles.viewCountText}>{item.viewCount}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(e.scale, 1), 4);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ] as any,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {canGoBack ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40, height: 40 }} />
            )}
            <TouchableOpacity
              onPress={() => setUploadModalVisible(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 26, marginTop: 12 }}>Gallery</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 6 }}>
            {galleryItems.length} photo{galleryItems.length === 1 ? '' : 's'}
            {selectedFilter !== 'All' ? ` · showing ${filteredItems.length}` : ''}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
          <FlatList
          horizontal
          data={filters}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.delay(100 * index)}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedFilter === item && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(item)}
              >
                {selectedFilter === item ? (
                  <View style={[styles.filterChipGradient, { backgroundColor: primary }]}>
                    <Text style={styles.filterChipTextActive}>{item}</Text>
                  </View>
                ) : (
                  <Text style={styles.filterChipText}>{item}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
            )}
          />
        </View>

      {/* Gallery Grid */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={[styles.gridContent, isParent ? { paddingBottom: 120 } : null]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="image-off" size={64} color={LT.textMuted} />
            <Text style={styles.emptyTitle}>No Photos</Text>
            <Text style={styles.emptyText}>No photos found for this category</Text>
          </View>
        }
      />

      {/* Image Detail Modal */}
      <Modal
        visible={!!selectedImage}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          
          {/* Modal Header */}
          <SafeAreaView style={styles.modalHeader} edges={['top']}>
            <View style={[styles.modalHeaderContent, { paddingTop: insets.top + spacing.sm }]}>
              <TouchableOpacity onPress={() => setSelectedImage(null)} hitSlop={12}>
                <MaterialCommunityIcons
                  name="close"
                  size={28}
                  color={colors.text.white}
                />
              </TouchableOpacity>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={handleShare} style={styles.modalAction} hitSlop={10}>
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={24}
                    color={colors.text.white}
                  />
                    </TouchableOpacity>
                <TouchableOpacity style={styles.modalAction} hitSlop={10}>
                  <MaterialCommunityIcons
                    name="download"
                    size={24}
                    color={colors.text.white}
                  />
                </TouchableOpacity>
          </View>
        </View>
          </SafeAreaView>

          {/* Image */}
          {selectedImage && (
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.modalImageContainer, animatedImageStyle]}>
                <Image
                  source={{ uri: `${selectedImage.uri}?id=${selectedImage.id}` }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </GestureDetector>
          )}

          {/* Image Info */}
          {selectedImage && (
            <SafeAreaView style={styles.modalFooter}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.modalFooterGradient}
              >
                <Text style={styles.modalTitle}>{selectedImage.title}</Text>
                <Text style={styles.modalEvent}>{selectedImage.event}</Text>
                <View style={styles.modalMeta}>
                  <View style={styles.modalMetaItem}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={14}
                      color={colors.text.white}
                    />
                    <Text style={styles.modalMetaText}>
                      {selectedImage.date}
                  </Text>
                </View>
                  <View style={styles.modalMetaItem}>
                    <MaterialCommunityIcons
                      name="eye"
                      size={14}
                      color={colors.text.white}
                    />
                    <Text style={styles.modalMetaText}>
                      {selectedImage.viewCount} views
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </SafeAreaView>
          )}
        </View>
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.uploadModalOverlay}>
          <Animated.View
            entering={ZoomIn.springify()}
            style={styles.uploadModalContent}
          >
            <View style={styles.uploadModalHeader}>
              <Text style={styles.uploadModalTitle}>Upload Photos</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadOptions}>
              <TouchableOpacity 
                style={styles.uploadOption}
                onPress={handleUpload}
              >
                <View style={[styles.uploadOptionIcon, { backgroundColor: colors.primary[100] }]}>
                  <MaterialCommunityIcons
                    name="image-multiple"
                    size={32}
                    color={colors.primary.main}
                  />
                </View>
                <Text style={styles.uploadOptionTitle}>Photo Library</Text>
                <Text style={styles.uploadOptionDesc}>
                  Select from your gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadOption} onPress={handleTakePhoto}>
                <View style={[styles.uploadOptionIcon, { backgroundColor: colors.secondary[100] }]}>
                  <MaterialCommunityIcons
                    name="camera"
                    size={32}
                    color={colors.secondary.main}
                  />
                </View>
                <Text style={styles.uploadOptionTitle}>Take Photo</Text>
                <Text style={styles.uploadOptionDesc}>
                  Use your camera
                </Text>
              </TouchableOpacity>
            </View>

            <LightButton
              label="Cancel"
              onPress={() => setUploadModalVisible(false)}
              variant="ghost"
              icon="close-outline"
              iconPosition="left"
              style={styles.cancelButton}
            />
          </Animated.View>
        </View>
      </Modal>
      {isParent ? <FloatingNav navigation={navigation} activeTab="ParentGallery" /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    backgroundColor: PD.card,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: PD.cardBorder,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  filterChipActive: {},
  filterChipGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: LT.primary,
    borderRadius: borderRadius.full,
  },
  filterChipText: {
    ...typography.caption,
    color: LT.textSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: LT.primaryLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: LT.cardBorder,
  },
  filterChipTextActive: {
    ...typography.captionBold,
    color: LT.textWhite,
  },
  gridContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: spacing.xs / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing.xs,
  },
  viewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewCountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    ...typography.h3,
    color: LT.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: LT.textMuted,
    marginTop: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalAction: {
    padding: spacing.xs,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: height * 0.7,
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalFooterGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.white,
  },
  modalEvent: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  modalMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalMetaText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  uploadModalContent: {
    backgroundColor: LT.card,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  uploadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  uploadModalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  uploadOption: {
    flex: 1,
    backgroundColor: colors.background.subtle,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    alignItems: 'center',
  },
  uploadOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  uploadOptionTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  uploadOptionDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cancelButton: {
    opacity: 0.7,
  },
});

export default GalleryScreen;
