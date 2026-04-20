import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..100
  color: string;
  bgColor?: string;
  label: string;
  value: string;
  sublabel?: string;
}

export function CircularProgress({
  size = 90,
  strokeWidth = 8,
  progress,
  color,
  bgColor = '#EEE8FE',
  label,
  value,
  sublabel,
}: CircularProgressProps) {
  const safeProgress = useMemo(() => Math.max(0, Math.min(100, progress)), [progress]);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: safeProgress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [safeProgress, animatedProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // react-native-svg types can be picky with Animated wrappers.
  const AnimatedCircle = useMemo(() => Animated.createAnimatedComponent(Circle as any), []);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        {/* Background track */}
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>

        {/* Progress arc */}
        <Svg
          width={size}
          height={size}
          style={{ position: 'absolute', transform: [{ rotateZ: '-90deg' }] }}
        >
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset as any}
            strokeLinecap="round"
          />
        </Svg>

        {/* Center text */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: size * 0.22, fontWeight: '800', color: '#0F0F1A', letterSpacing: -0.5 }}>
            {value}
          </Text>
          {sublabel ? (
            <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>{sublabel}</Text>
          ) : null}
        </View>
      </View>

      <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

