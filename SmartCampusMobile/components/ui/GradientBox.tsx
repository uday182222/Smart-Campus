import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, ViewStyle } from 'react-native';

interface GradientBoxProps {
  children: React.ReactNode;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
}

export const GradientBox: React.FC<GradientBoxProps> = ({
  children,
  colors = ['#6366f1', '#8b5cf6'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
}) => {
  return (
    <LinearGradient
      colors={colors as unknown as readonly [string, string, ...string[]]}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

