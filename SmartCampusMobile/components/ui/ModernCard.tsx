// @ts-nocheck
/**
 * ModernCard - Beautiful card component with multiple variants
 * Inspired by Edumate and modern iOS apps
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cardStyles, shadows, borderRadius, gradients } from '../../theme';

export type CardVariant = 'default' | 'elevated' | 'gradient' | 'flat' | 'outlined';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  gradientColors?: string[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'default',
  gradientColors,
  onPress,
  style,
  disabled = false,
  haptic = true,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return cardStyles.elevated;
      case 'gradient':
        return cardStyles.gradient;
      case 'flat':
        return cardStyles.flat;
      case 'outlined':
        return {
          ...cardStyles.outlined,
          borderWidth: 1,
          borderColor: '#E1E8ED',
        };
      default:
        return cardStyles.default;
    }
  };

  const cardContent = (
    <View style={[styles.cardInner, style]}>
      {children}
    </View>
  );

  const cardContainer = variant === 'gradient' ? (
    <LinearGradient
      colors={gradientColors || gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[getCardStyle(), style]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={animatedStyle}
      >
        {cardContainer}
      </AnimatedTouchable>
    );
  }

  return cardContainer;
};

const styles = StyleSheet.create({
  cardInner: {
    width: '100%',
  },
});

export default ModernCard;

