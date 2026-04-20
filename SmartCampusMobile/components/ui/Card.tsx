/**
 * Smart Campus - Modern Card Component
 * Production-ready with animations and press feedback
 */

import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================
export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================================================
// COMPONENT
// ============================================================================
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  disabled = false,
  style,
  contentStyle,
  padding = 'md',
  radius = 'md',
  elevation = 'md',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.background.paper,
          borderWidth: 1,
          borderColor: colors.border.light,
        };
      case 'filled':
        return {
          backgroundColor: colors.grey[100],
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.background.paper,
          ...shadows[elevation],
        };
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing.sm };
      case 'lg':
        return { padding: spacing.lg };
      case 'md':
      default:
        return { padding: spacing.base };
    }
  };

  const getRadiusStyle = (): ViewStyle => {
    switch (radius) {
      case 'sm':
        return { borderRadius: borderRadius.sm };
      case 'lg':
        return { borderRadius: borderRadius.lg };
      case 'md':
      default:
        return { borderRadius: borderRadius.md };
    }
  };

  const cardStyle: ViewStyle = {
    ...getVariantStyle(),
    ...getRadiusStyle(),
    overflow: 'hidden',
  };

  const content = (
    <View style={[getPaddingStyle(), contentStyle]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View
        style={[
          cardStyle,
          { transform: [{ scale: scaleAnim }] },
          disabled && styles.disabled,
          style,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={styles.touchable}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {content}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Card;

