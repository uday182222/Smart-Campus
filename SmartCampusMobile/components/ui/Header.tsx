/**
 * Smart Campus - Screen Header Component
 * Professional header with gradient background
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================
export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backIcon?: React.ReactNode;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
    badge?: number;
  };
  rightActions?: Array<{
    icon: React.ReactNode;
    onPress: () => void;
    badge?: number;
  }>;
  gradient?: string[];
  backgroundColor?: string;
  textColor?: string;
  variant?: 'gradient' | 'solid' | 'transparent';
  size?: 'small' | 'medium' | 'large';
  centerTitle?: boolean;
  style?: StyleProp<ViewStyle>;
  statusBarStyle?: 'light' | 'dark';
}

// ============================================================================
// COMPONENT
// ============================================================================
export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  backIcon,
  rightAction,
  rightActions,
  gradient = colors.gradients.primary,
  backgroundColor = colors.primary.main,
  textColor = colors.text.white,
  variant = 'gradient',
  size = 'medium',
  centerTitle = false,
  style,
  statusBarStyle = 'light',
}) => {
  const insets = useSafeAreaInsets();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 56,
          titleSize: 18,
          subtitleSize: 12,
          paddingBottom: spacing.sm,
        };
      case 'large':
        return {
          height: 120,
          titleSize: 28,
          subtitleSize: 16,
          paddingBottom: spacing.lg,
        };
      case 'medium':
      default:
        return {
          height: 80,
          titleSize: 22,
          subtitleSize: 14,
          paddingBottom: spacing.base,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const totalHeight = sizeStyles.height + insets.top;

  const renderBackButton = () => {
    if (!onBack) return <View style={styles.actionPlaceholder} />;

    return (
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {backIcon || <Text style={[styles.backIcon, { color: textColor }]}>←</Text>}
      </TouchableOpacity>
    );
  };

  const renderRightActions = () => {
    const actions = rightActions || (rightAction ? [rightAction] : []);
    
    if (actions.length === 0) {
      return <View style={styles.actionPlaceholder} />;
    }

    return (
      <View style={styles.rightActionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            style={[styles.actionButton, index > 0 && { marginLeft: spacing.sm }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {action.icon}
            {action.badge !== undefined && action.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {action.badge > 99 ? '99+' : action.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTitle = () => (
    <View style={[styles.titleContainer, centerTitle && styles.titleCentered]}>
      <Text
        style={[
          styles.title,
          { fontSize: sizeStyles.titleSize, color: textColor },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            { fontSize: sizeStyles.subtitleSize, color: `${textColor}CC` },
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const headerContent = (
    <View
      style={[
        styles.container,
        { 
          paddingTop: insets.top + spacing.sm,
          paddingBottom: sizeStyles.paddingBottom,
          height: totalHeight,
        },
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle === 'light' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <View style={styles.content}>
        {renderBackButton()}
        {renderTitle()}
        {renderRightActions()}
      </View>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientContainer, shadows.md, style]}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  if (variant === 'transparent') {
    return (
      <View style={[styles.transparentContainer, style]}>
        {headerContent}
      </View>
    );
  }

  return (
    <View style={[styles.solidContainer, { backgroundColor }, shadows.md, style]}>
      {headerContent}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  gradientContainer: {
    width: '100%',
  },
  solidContainer: {
    width: '100%',
  },
  transparentContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  container: {
    width: '100%',
    paddingHorizontal: spacing.base,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  titleCentered: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
  },
  actionPlaceholder: {
    width: 40,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error.main,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.white,
  },
});

export default Header;

