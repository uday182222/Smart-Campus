import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LT } from '../../constants/lightTheme';

let Haptics: typeof import('expo-haptics') | null = null;
try {
  Haptics = require('expo-haptics');
} catch (_) {}

interface PulsingFABProps {
  onPress: () => void;
  accent?: string;
  label?: string;
}

export function PulsingFAB({ onPress, accent: accentProp, label = '+' }: PulsingFABProps) {
  const { userData } = useAuth();
  const isSuperAdmin =
    userData?.role === 'SUPER_ADMIN' ||
    userData?.role === 'super_admin' ||
    (userData?.role as string)?.toUpperCase() === 'SUPER_ADMIN';

  const defaultAccent = isSuperAdmin ? '#CBFF00' : LT.primary;
  const accent = accentProp ?? defaultAccent;
  const iconColor = isSuperAdmin ? '#1A1A1A' : '#FFFFFF';

  const pulse = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [pulse, pulseOpacity]);

  return (
    <View style={{ position: 'absolute', bottom: 32, right: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: accent,
          transform: [{ scale: pulse }],
          opacity: pulseOpacity,
        }}
      />
      <TouchableOpacity
        onPress={() => {
          if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: LT.shadow.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text style={{ color: iconColor, fontSize: 28, fontWeight: '900', marginTop: -2 }}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
