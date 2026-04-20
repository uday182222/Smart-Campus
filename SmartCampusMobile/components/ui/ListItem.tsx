/**
 * Smart Campus - List Item Component
 * Reusable list item with multiple layouts
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, borderRadius, spacing, shadows, typography } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================
export interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  leftAvatar?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
  rightBadge?: number | string;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  variant?: 'default' | 'card' | 'inset';
  size?: 'small' | 'medium' | 'large';
  showChevron?: boolean;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  description,
  leftIcon,
  leftAvatar,
  rightIcon,
  rightText,
  rightBadge,
  onPress,
  disabled = false,
  selected = false,
  variant = 'default',
  size = 'medium',
  showChevron = false,
  showDivider = false,
  style,
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

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: 48,
          padding: spacing.sm,
          titleSize: 14,
          subtitleSize: 12,
        };
      case 'large':
        return {
          minHeight: 80,
          padding: spacing.base,
          titleSize: 18,
          subtitleSize: 14,
        };
      case 'medium':
      default:
        return {
          minHeight: 64,
          padding: spacing.md,
          titleSize: 16,
          subtitleSize: 13,
        };
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'card':
        return {
          backgroundColor: colors.background.paper,
          borderRadius: borderRadius.md,
          marginHorizontal: spacing.base,
          marginVertical: spacing.xs,
          ...shadows.sm,
        };
      case 'inset':
        return {
          backgroundColor: selected ? colors.primary.light + '20' : colors.grey[50],
          marginHorizontal: spacing.base,
          marginVertical: spacing.xs,
          borderRadius: borderRadius.md,
        };
      case 'default':
      default:
        return {
          backgroundColor: selected ? colors.primary.light + '15' : colors.background.paper,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const renderLeftContent = () => {
    if (leftAvatar) return <View style={styles.leftAvatar}>{leftAvatar}</View>;
    if (leftIcon) return <View style={styles.leftIcon}>{leftIcon}</View>;
    return null;
  };

  const renderRightContent = () => {
    return (
      <View style={styles.rightContainer}>
        {rightText && (
          <Text style={styles.rightText}>{rightText}</Text>
        )}
        {rightBadge !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {typeof rightBadge === 'number' && rightBadge > 99 ? '99+' : rightBadge}
            </Text>
          </View>
        )}
        {rightIcon}
        {showChevron && !rightIcon && (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    );
  };

  const content = (
    <Animated.View
      style={[
        styles.container,
        variantStyles,
        {
          minHeight: sizeStyles.minHeight,
          padding: sizeStyles.padding,
          transform: [{ scale: scaleAnim }],
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {renderLeftContent()}

      <View style={styles.contentContainer}>
        <Text
          style={[styles.title, { fontSize: sizeStyles.titleSize }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { fontSize: sizeStyles.subtitleSize }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>

      {renderRightContent()}
    </Animated.View>
  );

  if (onPress) {
    return (
      <>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          {content}
        </TouchableOpacity>
        {showDivider && variant === 'default' && <View style={styles.divider} />}
      </>
    );
  }

  return (
    <>
      {content}
      {showDivider && variant === 'default' && <View style={styles.divider} />}
    </>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: spacing.md,
  },
  leftAvatar: {
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '500',
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: colors.text.hint,
    marginTop: 4,
    lineHeight: 18,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  rightText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error.main,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.white,
  },
  chevron: {
    fontSize: 22,
    color: colors.grey[400],
    marginLeft: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.base,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ListItem;

