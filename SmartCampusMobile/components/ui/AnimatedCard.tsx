import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { getShadowStyle } from '../../utils/shadowStyles';

interface AnimatedCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outline' | 'filled' | 'glass';
  onPress?: () => void;
  delay?: number;
  padding?: number | string;
  style?: object;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  delay = 0,
  padding = 20,
  style,
}) => {
  const getVariantStyles = (): object => {
    const shadow = getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    });
    switch (variant) {
      case 'elevated':
        return { backgroundColor: '#FFFFFF', ...shadow, borderWidth: 0 };
      case 'outline':
        return { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' };
      case 'filled':
        return { backgroundColor: '#F8FAFC', borderWidth: 0 };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          ...shadow,
        };
      default:
        return { backgroundColor: '#FFFFFF', ...shadow, borderWidth: 0 };
    }
  };

  const paddingValue = typeof padding === 'string' && padding.startsWith('$') ? 20 : padding;

  const content = (
    <MotiView
      from={{ opacity: 0, translateY: 20, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'timing', duration: 600, delay }}
    >
      <View style={[styles.card, getVariantStyles(), { padding: paddingValue as number }, style]}>
        {children}
      </View>
    </MotiView>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  }
  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
  },
});
