/**
 * Smart Campus - Avatar Component
 * User profile picture with fallback
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, componentSizes, shadows } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================
export interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'rounded' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  color?: string;
  gradient?: string[];
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  variant = 'circle',
  status,
  color,
  gradient,
  borderColor,
  borderWidth = 0,
  style,
}) => {
  const sizeValue = componentSizes.avatar[size];

  const getInitials = (): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getBorderRadius = (): number => {
    switch (variant) {
      case 'square':
        return 0;
      case 'rounded':
        return borderRadius.md;
      case 'circle':
      default:
        return sizeValue / 2;
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'online':
        return colors.success.main;
      case 'offline':
        return colors.grey[400];
      case 'busy':
        return colors.error.main;
      case 'away':
        return colors.warning.main;
      default:
        return colors.success.main;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'xs':
        return 10;
      case 'sm':
        return 12;
      case 'md':
        return 16;
      case 'lg':
        return 22;
      case 'xl':
        return 32;
      default:
        return 16;
    }
  };

  const getStatusSize = (): number => {
    switch (size) {
      case 'xs':
        return 6;
      case 'sm':
        return 8;
      case 'md':
        return 10;
      case 'lg':
        return 14;
      case 'xl':
        return 18;
      default:
        return 10;
    }
  };

  const containerStyle: ViewStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: getBorderRadius(),
    overflow: 'hidden',
    borderWidth,
    borderColor: borderColor || colors.background.paper,
  };

  const renderContent = () => {
    if (source) {
      return (
        <Image
          source={source}
          style={[styles.image, { borderRadius: getBorderRadius() }]}
          resizeMode="cover"
        />
      );
    }

    const bgColor = color || colors.primary.main;
    const gradientColors = gradient || [bgColor, bgColor];

    return (
      <LinearGradient
        colors={gradientColors as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fallback}
      >
        <Text style={[styles.initials, { fontSize: getFontSize() }]}>
          {getInitials()}
        </Text>
      </LinearGradient>
    );
  };

  const renderStatus = () => {
    if (!status) return null;

    const statusSize = getStatusSize();
    const statusPosition = size === 'xs' || size === 'sm' ? -1 : 0;

    return (
      <View
        style={[
          styles.statusBadge,
          {
            width: statusSize,
            height: statusSize,
            borderRadius: statusSize / 2,
            backgroundColor: getStatusColor(),
            bottom: statusPosition,
            right: statusPosition,
            borderWidth: size === 'xs' ? 1 : 2,
          },
        ]}
      />
    );
  };

  return (
    <View style={[containerStyle, shadows.sm, style]}>
      {renderContent()}
      {renderStatus()}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.text.white,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    borderColor: colors.background.paper,
  },
});

export default Avatar;
