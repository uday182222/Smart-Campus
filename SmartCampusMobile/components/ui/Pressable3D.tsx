import React, { useRef } from 'react';
import { Animated, Pressable, ViewStyle } from 'react-native';

let Haptics: typeof import('expo-haptics') | null = null;
try {
  Haptics = require('expo-haptics');
} catch (_) {}

interface Pressable3DProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  scaleValue?: number;
}

export function Pressable3D({ onPress, children, style, scaleValue = 0.96 }: Pressable3DProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
