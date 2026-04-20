import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style,
}) => {
  const badgeStyles = [
    styles.badge,
    styles[variant],
    styles[size],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  
  // Variants
  default: {
    backgroundColor: '#6366F1',
  },
  secondary: {
    backgroundColor: '#F1F5F9',
  },
  destructive: {
    backgroundColor: '#EF4444',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  success: {
    backgroundColor: '#10B981',
  },
  warning: {
    backgroundColor: '#F59E0B',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minHeight: 20,
  },
  md: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 24,
  },
  lg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },
  
  // Text styles
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  defaultText: {
    color: 'white',
  },
  secondaryText: {
    color: '#475569',
  },
  destructiveText: {
    color: 'white',
  },
  outlineText: {
    color: '#6366F1',
  },
  successText: {
    color: 'white',
  },
  warningText: {
    color: 'white',
  },
  
  // Text sizes
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 16,
  },
});

export default Badge;
