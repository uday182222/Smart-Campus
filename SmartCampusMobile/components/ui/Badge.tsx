/**
 * Smart Campus - Badge Component
 * For notifications, counts, and status indicators
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================
export interface BadgeProps {
  value?: number | string;
  variant?: 'default' | 'dot' | 'outlined';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  max?: number;
  showZero?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// ============================================================================
// COMPONENT
// ============================================================================
export const Badge: React.FC<BadgeProps> = ({
  value,
  variant = 'default',
  color = 'error',
  size = 'medium',
  max = 99,
  showZero = false,
  children,
  style,
  position = 'top-right',
}) => {
  const getColorStyles = () => {
    const colorMap = {
      primary: colors.primary.main,
      secondary: colors.secondary.main,
      success: colors.success.main,
      warning: colors.warning.main,
      error: colors.error.main,
      info: colors.info.main,
    };
    return colorMap[color];
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { minWidth: 16, height: 16, fontSize: 10, dotSize: 6 };
      case 'large':
        return { minWidth: 26, height: 26, fontSize: 14, dotSize: 12 };
      case 'medium':
      default:
        return { minWidth: 20, height: 20, fontSize: 12, dotSize: 8 };
    }
  };

  const getPositionStyles = (): ViewStyle => {
    const offset = size === 'small' ? -4 : size === 'large' ? -6 : -5;
    
    switch (position) {
      case 'top-left':
        return { top: offset, left: offset };
      case 'bottom-right':
        return { bottom: offset, right: offset };
      case 'bottom-left':
        return { bottom: offset, left: offset };
      case 'top-right':
      default:
        return { top: offset, right: offset };
    }
  };

  const sizeStyles = getSizeStyles();
  const backgroundColor = getColorStyles();

  const displayValue = (): string | number | undefined => {
    if (variant === 'dot') return undefined;
    if (typeof value === 'number') {
      if (value === 0 && !showZero) return undefined;
      if (value > max) return `${max}+`;
      return value;
    }
    return value;
  };

  const badgeValue = displayValue();

  // If there's no value to show and not showing dot
  if (badgeValue === undefined && variant !== 'dot') {
    return children ? <View style={style}>{children}</View> : null;
  }

  const renderBadge = () => {
    if (variant === 'dot') {
      return (
        <View
          style={[
            styles.dot,
            {
              width: sizeStyles.dotSize,
              height: sizeStyles.dotSize,
              borderRadius: sizeStyles.dotSize / 2,
              backgroundColor,
            },
            children && styles.badgeAbsolute,
            children && getPositionStyles(),
          ]}
        />
      );
    }

    const isOutlined = variant === 'outlined';

    return (
      <View
        style={[
          styles.badge,
          {
            minWidth: sizeStyles.minWidth,
            height: sizeStyles.height,
            borderRadius: sizeStyles.height / 2,
            backgroundColor: isOutlined ? 'transparent' : backgroundColor,
            borderWidth: isOutlined ? 1.5 : 0,
            borderColor: backgroundColor,
          },
          children && styles.badgeAbsolute,
          children && getPositionStyles(),
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              fontSize: sizeStyles.fontSize,
              color: isOutlined ? backgroundColor : colors.text.white,
            },
          ]}
        >
          {badgeValue}
        </Text>
      </View>
    );
  };

  if (!children) {
    return renderBadge();
  }

  return (
    <View style={[styles.container, style]}>
      {children}
      {renderBadge()}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeAbsolute: {
    position: 'absolute',
    zIndex: 1,
  },
  dot: {},
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Badge;
