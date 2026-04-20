/**
 * Smart Campus - Modern Input Component
 * Production-ready text input with validation
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================
export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  variant?: 'outlined' | 'filled' | 'underlined';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  size = 'medium',
  disabled = false,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    textInputProps.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    textInputProps.onBlur?.({} as any);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 40, fontSize: 14, paddingHorizontal: 12 };
      case 'large':
        return { height: 56, fontSize: 18, paddingHorizontal: 20 };
      case 'medium':
      default:
        return { height: 48, fontSize: 16, paddingHorizontal: 16 };
    }
  };

  const getVariantStyles = (): ViewStyle => {
    const borderColor = error
      ? colors.error.main
      : isFocused
      ? colors.primary.main
      : colors.border.light;

    switch (variant) {
      case 'filled':
        return {
          backgroundColor: isFocused ? colors.background.paper : colors.grey[100],
          borderWidth: isFocused ? 2 : 0,
          borderColor,
          borderRadius: borderRadius.md,
        };
      case 'underlined':
        return {
          backgroundColor: 'transparent',
          borderBottomWidth: isFocused ? 2 : 1,
          borderBottomColor: borderColor,
          borderRadius: 0,
        };
      case 'outlined':
      default:
        return {
          backgroundColor: colors.background.paper,
          borderWidth: isFocused ? 2 : 1,
          borderColor,
          borderRadius: borderRadius.md,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border.light, error ? colors.error.main : colors.primary.main],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            error && { color: colors.error.main },
            isFocused && !error && { color: colors.primary.main },
          ]}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          variantStyles,
          { height: sizeStyles.height },
          disabled && styles.disabled,
          isFocused && !error && shadows.sm,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            {
              fontSize: sizeStyles.fontSize,
              paddingHorizontal: leftIcon ? 0 : sizeStyles.paddingHorizontal,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.text.hint}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>

      {(error || hint) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  leftIcon: {
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginRight: spacing.sm,
    marginLeft: spacing.xs,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.hint,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error.main,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Input;

