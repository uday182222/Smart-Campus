import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LT } from '../../constants/lightTheme';

interface LightCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function LightCard({ children, style, padding = 16 }: LightCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: LT.card,
          borderRadius: LT.radius.lg,
          padding,
          borderWidth: 1,
          borderColor: LT.cardBorder,
          ...LT.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

