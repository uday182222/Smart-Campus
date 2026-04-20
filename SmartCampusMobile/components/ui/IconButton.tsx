/**
 * IconButton - Circular icon button with badge support
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, shadows, borderRadius } from '../../theme';

type IconButtonVariant = 'primary' | 'secondary' | 'white' | 'ghost';
type IconButtonSize = 'small' | 'medium' | 'large';

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  badge?: number;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  badge,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { container: 32, icon: 18, badge: 14 };
      case 'large':
        return { container: 48, icon: 28, badge: 18 };
      default:
        return { container: 40, icon: 22, badge: 16 };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.secondary.main,
          iconColor: colors.text.white,
        };
      case 'white':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          iconColor: colors.text.white,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          iconColor: colors.text.primary,
        };
      default:
        return {
          backgroundColor: colors.primary.main,
          iconColor: colors.text.white,
        };
    }
  };

  const sizeValues = getSizeValues();
  const variantStyles = getVariantStyles();

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={disabled}
      style={animatedStyle}
    >
      <View
        style={[
          styles.container,
          {
            width: sizeValues.container,
            height: sizeValues.container,
            borderRadius: sizeValues.container / 2,
            backgroundColor: variantStyles.backgroundColor,
          },
          variant !== 'ghost' && variant !== 'white' && shadows.small,
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={sizeValues.icon}
          color={variantStyles.iconColor}
        />

        {badge !== undefined && badge > 0 && (
          <Animated.View
            entering={FadeIn.springify()}
            style={[
              styles.badge,
              {
                width: sizeValues.badge,
                height: sizeValues.badge,
                borderRadius: sizeValues.badge / 2,
              },
            ]}
          >
            <Text style={[styles.badgeText, { fontSize: sizeValues.badge - 6 }]}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </Animated.View>
        )}
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 16,
  },
  badgeText: {
    color: colors.text.white,
    fontWeight: '700',
  },
});

export default IconButton;

