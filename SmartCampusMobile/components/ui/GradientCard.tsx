import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePressScale } from '../../hooks/useAnimations';
import { useAccentColor } from '../../hooks/useAccentColor';
import { LT } from '../../constants/lightTheme';

export interface GradientCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  status?: string;
  statusColor?: string;
  progress?: number;
  progressLabel?: string;
  gradientColors?: [string, string];
  children?: React.ReactNode;
  dark?: boolean;
  colors?: [string, string];
  onPress?: () => void;
}

export function GradientCard({
  title,
  subtitle,
  badge,
  status,
  statusColor,
  progress,
  progressLabel,
  gradientColors,
  children,
  dark = true,
  colors,
  onPress,
}: GradientCardProps) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  const accent = useAccentColor();

  /** Dark gradient for legacy / super-admin style screens (not affected by app light sweep). */
  const darkGradient: [string, string] = ['#0D0D0D', '#1A1A1A'];
  const gradientColorsFinal: [string, string] =
    colors || gradientColors || (dark ? darkGradient : ['#EEF2FF', '#DBEAFE']);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={gradientColorsFinal as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 24,
            minHeight: 160,
            borderWidth: dark ? 0 : 1,
            borderColor: dark ? 'transparent' : LT.cardBorder,
            ...(!dark ? LT.shadow : {}),
          }}
        >
          {badge && (
            <View
              style={{
                backgroundColor: dark ? accent : LT.primary,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
                alignSelf: 'flex-start',
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
            </View>
          )}
          {status && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: statusColor || (dark ? accent : LT.secondary),
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  color: statusColor || (dark ? '#94A3B8' : LT.textSecondary),
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {status}
              </Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 26,
              fontWeight: '900',
              color: dark ? '#FFFFFF' : LT.textPrimary,
              letterSpacing: -0.5,
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 14,
                color: dark ? '#94A3B8' : LT.textSecondary,
                marginBottom: 16,
              }}
            >
              {subtitle}
            </Text>
          )}
          {progress !== undefined && (
            <View>
              {progressLabel && (
                <Text style={{ fontSize: 12, color: dark ? '#94A3B8' : LT.textMuted, marginBottom: 4 }}>
                  {progressLabel}
                </Text>
              )}
              <View
                style={{
                  height: 4,
                  backgroundColor: dark ? '#333333' : LT.cardBorder,
                  borderRadius: 2,
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    height: 4,
                    backgroundColor: dark ? accent : LT.primary,
                    borderRadius: 2,
                    width: `${Math.round(progress * 100)}%`,
                  }}
                />
              </View>
            </View>
          )}
          {children}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default GradientCard;
