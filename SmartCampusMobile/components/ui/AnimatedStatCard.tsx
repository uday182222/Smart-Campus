import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useSlideUp } from '../../hooks/useAnimations';

interface AnimatedStatCardProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  dark?: boolean;
  delay?: number;
}

export function AnimatedStatCard({
  value,
  label,
  prefix = '',
  suffix = '',
  dark = false,
  delay = 0,
}: AnimatedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const { translateY, opacity } = useSlideUp(delay);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = value / (duration / step);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, step);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <View
        style={{
          backgroundColor: dark ? '#FFFFFF' : '#FFFFFF',
          borderRadius: 20,
          padding: 20,
          minWidth: 140,
          marginRight: 12,
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: dark ? 0.3 : 0.08,
          shadowRadius: 12,
        }}
      >
        <Text
          style={{
            fontSize: 36,
            fontWeight: '900',
            color: dark ? '#2B5CE6' : '#FFFFFF',
            letterSpacing: -1,
          }}
        >
          {prefix}
          {displayValue.toLocaleString()}
          {suffix}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: '#94A3B8',
            marginTop: 4,
            fontWeight: '500',
          }}
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}
