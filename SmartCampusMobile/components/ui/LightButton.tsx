import React, { useRef } from 'react';
import { Animated, Pressable, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LT } from '../../constants/lightTheme';

export type LightButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'white';

interface LightButtonProps {
  label: string;
  onPress: () => void;
  variant?: LightButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export function LightButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  fullWidth = true,
  loading,
  disabled,
  style,
}: LightButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.97,
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
      bounciness: 6,
    }).start();
  };

  const styles: Record<LightButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: { bg: LT.primary, text: '#FFFFFF' },
    secondary: { bg: LT.secondary, text: '#FFFFFF' },
    outline: { bg: 'transparent', text: LT.primary, border: LT.primary },
    danger: { bg: LT.danger, text: '#FFFFFF' },
    ghost: { bg: LT.primaryLight, text: LT.primary },
    white: { bg: '#FFFFFF', text: LT.primary, border: LT.cardBorder },
  };

  const s = styles[variant];

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={{
          backgroundColor: s.bg,
          borderWidth: s.border ? 1.5 : 0,
          borderColor: s.border,
          borderRadius: LT.radius.lg,
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.6 : 1,
          ...LT.shadow,
          ...style,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={s.text} />
        ) : (
          <>
            {icon && iconPosition === 'left' && <Ionicons name={icon} size={18} color={s.text} />}
            <Text style={{ color: s.text, fontSize: 15, fontWeight: '700' }}>{label}</Text>
            {icon && iconPosition === 'right' && <Ionicons name={icon} size={18} color={s.text} />}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

