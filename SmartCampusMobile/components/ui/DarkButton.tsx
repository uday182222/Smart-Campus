/**
 * BUTTON USAGE RULES — apply everywhere in the app:
 *
 * accent         = primary action (create, save, confirm, sign in)
 * outline-accent = secondary action (reset, edit, view all)
 * outline-danger = destructive secondary (remove, cancel)
 * danger         = destructive primary (delete — solid red)
 * ghost          = tertiary / navigation (view all, go to)
 * dark           = neutral (close, back, dismiss)
 *
 * ALWAYS use icon:
 *   Create/Save    → checkmark-circle-outline (left)
 *   Sign In/Go     → arrow-forward (right)
 *   Delete/Remove  → trash-outline (left)
 *   Reset          → refresh-outline (left)
 *   View/Navigate  → arrow-forward (right)
 *   Share          → share-outline (left)
 *   Cancel         → close-outline (left)
 */

import React, { useRef } from 'react';
import { Animated, Pressable, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccentColor } from '../../hooks/useAccentColor';

let Haptics: typeof import('expo-haptics') | null = null;
try {
  Haptics = require('expo-haptics');
} catch (_) {}

export type ButtonVariant = 'accent' | 'outline-accent' | 'outline-danger' | 'danger' | 'ghost' | 'dark';

export interface DarkButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  loading?: boolean;
  accent?: string;
}

function getVariantStyles(variant: ButtonVariant, accent: string): { bg: string; border?: string; textColor: string; iconColor: string } {
  switch (variant) {
    case 'accent':
      return { bg: accent, textColor: '#1A1A1A', iconColor: '#1A1A1A' };
    case 'outline-accent':
      return { bg: 'transparent', border: accent, textColor: accent, iconColor: accent };
    case 'outline-danger':
      return { bg: 'transparent', border: '#EF4444', textColor: '#EF4444', iconColor: '#EF4444' };
    case 'danger':
      return { bg: '#EF4444', textColor: '#FFFFFF', iconColor: '#FFFFFF' };
    case 'ghost':
      return { bg: '#2A2A2A', textColor: '#AAAAAA', iconColor: '#AAAAAA' };
    case 'dark':
      return { bg: '#2A2A2A', textColor: '#FFFFFF', iconColor: '#FFFFFF' };
    default:
      return { bg: accent, textColor: '#1A1A1A', iconColor: '#1A1A1A' };
  }
}

export function DarkButton({
  label,
  onPress,
  variant = 'accent',
  icon,
  iconPosition = 'right',
  fullWidth = true,
  style,
  loading = false,
  accent: accentProp,
}: DarkButtonProps) {
  const defaultAccent = useAccentColor();
  const accent = accentProp ?? defaultAccent;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const s = getVariantStyles(variant, accent);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={loading}
        style={{
          backgroundColor: s.bg,
          borderWidth: s.border ? 1.5 : 0,
          borderColor: s.border,
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'accent' || variant === 'dark' ? '#1A1A1A' : s.textColor} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons name={icon} size={18} color={s.iconColor} style={{ marginRight: 8 }} />
            )}
            <Text
              style={{
                color: s.textColor,
                fontSize: 15,
                fontWeight: '700',
                letterSpacing: 0.2,
              }}
            >
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons name={icon} size={18} color={s.iconColor} style={{ marginLeft: 8 }} />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
