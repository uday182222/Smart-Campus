/**
 * Smart Campus - Modern Button Component
 * Production-ready with multiple variants
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, shadows, spacing, typography, componentSizes } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  gradient?: string[];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  gradient,
  style,
  textStyle,
  haptic = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
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

  const handlePress = async () => {
    if (disabled || loading) return;
    
    if (haptic) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Haptics not available
      }
    }
    
    onPress();
  };

  const getSizeStyles = () => {
    const sizeConfig = componentSizes.button[size];
    return {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      fontSize: sizeConfig.fontSize,
    };
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.secondary.main,
          },
          text: {
            color: colors.secondary.contrast,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: colors.primary.main,
          },
          text: {
            color: colors.primary.main,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: colors.primary.main,
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.error.main,
          },
          text: {
            color: colors.text.white,
          },
        };
      case 'success':
        return {
          container: {
            backgroundColor: colors.success.main,
          },
          text: {
            color: colors.text.white,
          },
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: colors.primary.main,
          },
          text: {
            color: colors.primary.contrast,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const isGradient = variant === 'primary' || gradient;
  const gradientColors = gradient || colors.gradients.primary;

  const renderContent = () => {
    const textColor = variantStyles.text.color;
    
    return (
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'ghost' ? colors.primary.main : '#FFFFFF'} 
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                { fontSize: sizeStyles.fontSize, color: textColor },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </>
        )}
      </View>
    );
  };

  const buttonContent = isGradient && variant !== 'outline' && variant !== 'ghost' ? (
    <LinearGradient
      colors={gradientColors as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.gradient,
        { height: sizeStyles.height, borderRadius: borderRadius.md },
      ]}
    >
      {renderContent()}
    </LinearGradient>
  ) : (
    <View
      style={[
        styles.container,
        variantStyles.container,
        {
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: borderRadius.md,
        },
      ]}
    >
      {renderContent()}
    </View>
  );

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        disabled && styles.disabled,
        !isGradient && variant !== 'ghost' && shadows.sm,
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          fullWidth && styles.fullWidth,
          { borderRadius: borderRadius.md, overflow: 'hidden' },
        ]}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;

