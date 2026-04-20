/**
 * Service Result Card Component
 * Beautiful card layout for displaying service results
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceResultsAPI, ServiceResult, ServiceType } from '../services/ServiceResultsAPI';

export type CardVariant = 'compact' | 'expanded' | 'full';

interface ServiceResultCardProps {
  result: ServiceResult;
  variant?: CardVariant;
  onPress?: () => void;
  onAskAbout?: () => void;
  isReferenced?: boolean;
  isNew?: boolean;
  showActions?: boolean;
}

const ServiceResultCard: React.FC<ServiceResultCardProps> = ({
  result,
  variant = 'expanded',
  onPress,
  onAskAbout,
  isReferenced = false,
  isNew = false,
  showActions = true,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isNew) {
      // Bounce animation for new results
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isNew]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const icon = ServiceResultsAPI.getServiceIcon(result.serviceType);
  const color = ServiceResultsAPI.getServiceColor(result.serviceType);
  const serviceName = ServiceResultsAPI.getServiceName(result.serviceType);
  const timeAgo = ServiceResultsAPI.formatTimeAgo(result.createdAt);

  const gradientColors = [
    `${color}15`,
    `${color}05`,
    '#FFFFFF',
  ];

  const getCardHeight = () => {
    switch (variant) {
      case 'compact':
        return 80;
      case 'expanded':
        return 120;
      case 'full':
        return 'auto';
      default:
        return 120;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          height: getCardHeight(),
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={gradientColors as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            isReferenced && styles.referencedCard,
          ]}
        >
          {/* Gradient Border */}
          <View style={[styles.borderGradient, { backgroundColor: color }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.serviceName}>{serviceName}</Text>
              <Text style={styles.date}>{timeAgo}</Text>
            </View>

            {/* Badges */}
            <View style={styles.badges}>
              {isNew && (
                <View style={[styles.badge, styles.newBadge]}>
                  <Text style={styles.badgeText}>New</Text>
                </View>
              )}
              {isReferenced && (
                <View style={[styles.badge, styles.referencedBadge]}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              )}
            </View>
          </View>

          {/* Summary */}
          {variant !== 'compact' && (
            <Text
              style={styles.summary}
              numberOfLines={variant === 'expanded' ? 2 : undefined}
            >
              {result.summary}
            </Text>
          )}

          {/* Actions */}
          {showActions && variant !== 'compact' && (
            <View style={styles.actions}>
              {onAskAbout && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: color }]}
                  onPress={onAskAbout}
                >
                  <Text style={[styles.actionButtonText, { color }]}>
                    Ask about this
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: color }]}
                onPress={onPress}
              >
                <Text style={styles.primaryButtonText}>View Full Result</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Referenced Indicator */}
          {isReferenced && (
            <View style={styles.referencedIndicator}>
              <Text style={styles.referencedText}>AI mentioned this</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  referencedCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#4ECDC4',
        shadowOpacity: 0.3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  borderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadge: {
    backgroundColor: '#3498DB',
  },
  referencedBadge: {
    backgroundColor: '#2ECC71',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495E',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  referencedIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#2ECC7120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  referencedText: {
    fontSize: 10,
    color: '#2ECC71',
    fontWeight: '600',
  },
});

export default ServiceResultCard;

