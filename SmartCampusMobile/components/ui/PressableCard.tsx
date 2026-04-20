import React from 'react';
import { Animated, TouchableOpacity, ViewStyle } from 'react-native';
import { usePressScale } from '../../hooks/useAnimations';

let Haptics: typeof import('expo-haptics') | null = null;
try {
  Haptics = require('expo-haptics');
} catch (_) {}

interface PressableCardProps {
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function PressableCard({ onPress, children, style }: PressableCardProps) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  const handlePress = () => {
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
