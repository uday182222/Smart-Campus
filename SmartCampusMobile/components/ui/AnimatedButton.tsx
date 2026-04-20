import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: object;
}

const variantStyles: Record<string, { bg: string; pressedBg: string; textColor: string; borderColor?: string }> = {
  primary: { bg: '#6366F1', pressedBg: '#4F46E5', textColor: '#FFFFFF' },
  secondary: { bg: '#64748B', pressedBg: '#475569', textColor: '#FFFFFF' },
  outline: { bg: 'transparent', pressedBg: '#F1F5F9', textColor: '#6366F1', borderColor: '#6366F1' },
  ghost: { bg: 'transparent', pressedBg: '#F1F5F9', textColor: '#334155' },
};

const sizeStyles = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}) => {
  const v = variantStyles[variant] ?? variantStyles.primary;
  const s = sizeStyles[size] ?? sizeStyles.md;

  return (
    <Pressable onPress={onPress} disabled={isDisabled || isLoading} style={[fullWidth && { width: '100%' }, style]}>
      {({ pressed }) => (
        <MotiView
          animate={{
            scale: pressed ? 0.95 : 1,
            opacity: isDisabled ? 0.5 : 1,
          }}
          transition={{ type: 'timing', duration: 150 }}
        >
          <View
            style={[
              styles.box,
              {
                backgroundColor: pressed ? v.pressedBg : v.bg,
                paddingVertical: s.paddingVertical,
                paddingHorizontal: s.paddingHorizontal,
                borderWidth: variant === 'outline' ? 2 : 0,
                borderColor: v.borderColor ?? 'transparent',
                width: fullWidth ? '100%' : undefined,
              },
            ]}
          >
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text style={[styles.text, { color: v.textColor, fontSize: s.fontSize }]}>
              {isLoading ? 'Loading...' : children}
            </Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </View>
        </MotiView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
