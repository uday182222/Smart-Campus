/**
 * Full Result Modal Component
 * Immersive full-screen modal for displaying complete service results
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceResultsAPI, ServiceResult } from '../services/ServiceResultsAPI';

const { width, height } = Dimensions.get('window');

interface FullResultModalProps {
  visible: boolean;
  result: ServiceResult | null;
  onClose: () => void;
  onAskAbout?: () => void;
  onAttachToChat?: () => void;
  onShare?: () => void;
}

const FullResultModal: React.FC<FullResultModalProps> = ({
  visible,
  result,
  onClose,
  onAskAbout,
  onAttachToChat,
  onShare,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!result) return null;

  const icon = ServiceResultsAPI.getServiceIcon(result.serviceType);
  const color = ServiceResultsAPI.getServiceColor(result.serviceType);
  const serviceName = ServiceResultsAPI.getServiceName(result.serviceType);
  const timeAgo = ServiceResultsAPI.formatTimeAgo(result.createdAt);
  const dateFormatted = result.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Scroll progress indicator
  const scrollProgress = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderResultData = () => {
    // Custom rendering based on service type
    const data = result.resultData;

    if (result.serviceType === 'PALM') {
      return (
        <View style={styles.dataSection}>
          {data.lifeLine && (
            <DataItem title="Life Line" content={data.lifeLine.interpretation} color={color} />
          )}
          {data.heartLine && (
            <DataItem title="Heart Line" content={data.heartLine.interpretation} color={color} />
          )}
          {data.headLine && (
            <DataItem title="Head Line" content={data.headLine.interpretation} color={color} />
          )}
        </View>
      );
    }

    if (result.serviceType === 'ASTROLOGY') {
      return (
        <View style={styles.dataSection}>
          {data.sunSign && (
            <DataItem title="Sun Sign" content={data.sunSign} color={color} />
          )}
          {data.moonSign && (
            <DataItem title="Moon Sign" content={data.moonSign} color={color} />
          )}
          {data.ascendant && (
            <DataItem title="Ascendant" content={data.ascendant} color={color} />
          )}
        </View>
      );
    }

    // Generic data rendering for other types
    return (
      <View style={styles.dataSection}>
        <Text style={styles.dataText}>{JSON.stringify(data, null, 2)}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: opacityAnim },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[color, `${color}DD`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{icon}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.serviceName}>{serviceName}</Text>
              <Text style={styles.date}>{dateFormatted}</Text>
            </View>

            {/* Scroll Progress Indicator */}
            <Animated.View
              style={[
                styles.scrollProgress,
                {
                  opacity: scrollProgress,
                  transform: [
                    {
                      scaleX: scrollProgress,
                    },
                  ],
                },
              ]}
            />
          </LinearGradient>

          {/* Content */}
          <Animated.ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {/* Summary Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <Text style={styles.summary}>{result.summary}</Text>
            </View>

            {/* Detailed Results */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Analysis</Text>
              {renderResultData()}
            </View>

            {/* Metadata */}
            <View style={styles.metadataSection}>
              <View style={styles.metadataItem}>
                <MaterialIcons name="schedule" size={16} color="#95A5A6" />
                <Text style={styles.metadataText}>Created {timeAgo}</Text>
              </View>
              {result.lastReferencedAt && (
                <View style={styles.metadataItem}>
                  <MaterialIcons name="visibility" size={16} color="#95A5A6" />
                  <Text style={styles.metadataText}>
                    Last viewed {ServiceResultsAPI.formatTimeAgo(result.lastReferencedAt)}
                  </Text>
                </View>
              )}
            </View>
          </Animated.ScrollView>

          {/* Fixed Bottom Actions */}
          <View style={styles.footer}>
            {onAttachToChat && (
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonSecondary]}
                onPress={onAttachToChat}
              >
                <MaterialIcons name="attach-file" size={20} color={color} />
                <Text style={[styles.footerButtonText, { color }]}>
                  Attach to Chat
                </Text>
              </TouchableOpacity>
            )}

            {onAskAbout && (
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: color }]}
                onPress={onAskAbout}
              >
                <MaterialIcons name="chat" size={20} color="#FFF" />
                <Text style={styles.footerButtonTextWhite}>Ask AI About This</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Helper component for data items
const DataItem: React.FC<{ title: string; content: string; color: string }> = ({
  title,
  content,
  color,
}) => (
  <View style={styles.dataItem}>
    <View style={[styles.dataBullet, { backgroundColor: color }]} />
    <View style={styles.dataContent}>
      <Text style={styles.dataTitle}>{title}</Text>
      <Text style={styles.dataText}>{content}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Platform.OS === 'web' ? Math.min(width * 0.8, 600) : width * 0.95,
    maxHeight: height * 0.9,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
  },
  closeButton: {
    padding: 4,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transformOrigin: 'left',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495E',
  },
  dataSection: {
    gap: 16,
  },
  dataItem: {
    flexDirection: 'row',
    gap: 12,
  },
  dataBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  dataContent: {
    flex: 1,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  dataText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7F8C8D',
  },
  metadataSection: {
    marginTop: 8,
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 12,
    color: '#95A5A6',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  footerButtonSecondary: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerButtonTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default FullResultModal;

