/**
 * GradientButton - Beautiful gradient button with animations
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, shadows, gradients } from '../../theme';

type ButtonSize = 'small' | 'medium' | 'large';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  gradient?: string[];
  icon?: string;
  iconRight?: boolean;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: any;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  gradient = gradients.primary,
  icon,
  iconRight = false,
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(0.9);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withSpring(1);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 40, paddingHorizontal: 16, iconSize: 18 };
      case 'large':
        return { height: 56, paddingHorizontal: 32, iconSize: 24 };
      default:
        return { height: 48, paddingHorizontal: 24, iconSize: 20 };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator color={colors.text.white} size="small" />
      ) : (
        <>
          {icon && !iconRight && (
            <MaterialCommunityIcons
              name={icon as any}
              size={sizeStyles.iconSize}
              color={colors.text.white}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              size === 'small' && styles.textSmall,
              size === 'large' && styles.textLarge,
            ]}
          >
            {title}
          </Text>
          {icon && iconRight && (
            <MaterialCommunityIcons
              name={icon as any}
              size={sizeStyles.iconSize}
              color={colors.text.white}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={disabled || loading}
      style={[animatedStyle, fullWidth && styles.fullWidth, style]}
    >
      <LinearGradient
        colors={(disabled ? ['#A0A0A0', '#808080'] : gradient) as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            height: sizeStyles.height,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          shadows.small,
        ]}
      >
        {renderContent()}
      </LinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.button,
    color: colors.text.white,
  },
  textSmall: {
    ...typography.buttonSmall,
  },
  textLarge: {
    fontSize: 18,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  fullWidth: {
    width: '100%',
  },
});

export default GradientButton;

