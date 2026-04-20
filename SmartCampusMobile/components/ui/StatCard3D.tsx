import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useAccentColor } from '../../hooks/useAccentColor';
import { LT } from '../../constants/lightTheme';

interface StatCard3DProps {
  value: number;
  label: string;
  sublabel?: string;
  prefix?: string;
  suffix?: string;
  accent?: string;
  dark?: boolean;
  delay?: number;
}

export function StatCard3D({
  value,
  label,
  sublabel,
  prefix = '',
  suffix = '',
  accent: accentProp,
  dark = true,
  delay = 0,
}: StatCard3DProps) {
  const defaultAccent = useAccentColor();
  const accent = accentProp ?? defaultAccent;
  /** Big number: accent on dark legacy; primary blue on light (app default). */
  const numberColor = dark ? accent : LT.primary;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 1200;
      const steps = 60;
      const increment = value / steps;
      const interval = duration / steps;

      const counter = setInterval(() => {
        start += increment;
        if (start >= value) {
          setDisplay(value);
          clearInterval(counter);
        } else {
          setDisplay(Math.floor(start));
        }
      }, interval);

      return () => clearInterval(counter);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <View style={{ marginRight: 12 }}>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 20,
          minWidth: 150,
          borderWidth: 1,
          borderColor: LT.cardBorder,
          ...LT.shadow,
        }}
      >
        <Text
          style={{
            fontSize: 42,
            fontWeight: '900',
            color: numberColor,
            letterSpacing: -2,
            lineHeight: 46,
          }}
        >
          {prefix}
          {display.toLocaleString()}
          {suffix}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: LT.textPrimary,
            marginTop: 6,
          }}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            style={{
              fontSize: 11,
              fontStyle: 'italic',
              color: LT.textMuted,
              marginTop: 2,
            }}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
