import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { FreedomColors, FreedomTypography } from '../../theme/FreedomTheme';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button, styles[`${variant}Button`], styles[`${size}Button`]];
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }
    return baseStyle;
  };

  const getTextStyle = () => {
    return [styles.text, styles[`${variant}Text`], styles[`${size}Text`]];
  };

  return (
    <Animated.View
      style={[{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }, style]}
    >
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator 
              color={variant === 'primary' ? FreedomColors.white : FreedomColors.primary.start} 
              size="small" 
            />
          ) : (
            <>
              {icon && <Text style={styles.icon}>{icon}</Text>}
              <Text style={getTextStyle()}>{title}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: FreedomColors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  text: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.semibold,
    textAlign: 'center',
  },
  // Variants
  primaryButton: {
    backgroundColor: FreedomColors.primary.start,
    shadowColor: FreedomColors.primary.start,
    shadowOpacity: 0.3,
  },
  secondaryButton: {
    backgroundColor: FreedomColors.white,
    borderWidth: 2,
    borderColor: FreedomColors.primary.start,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: FreedomColors.white,
  },
  // Sizes
  smallButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  mediumButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  largeButton: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 18,
  },
  // Text colors
  primaryText: {
    color: FreedomColors.white,
  },
  secondaryText: {
    color: FreedomColors.primary.start,
  },
  outlineText: {
    color: FreedomColors.white,
  },
  // Text sizes
  smallText: {
    fontSize: FreedomTypography.sizes.sm,
  },
  mediumText: {
    fontSize: FreedomTypography.sizes.base,
  },
  largeText: {
    fontSize: FreedomTypography.sizes.lg,
  },
  // States
  disabledButton: {
    opacity: 0.6,
  },
});

export default AnimatedButton;

