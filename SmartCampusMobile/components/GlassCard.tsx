import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SchoolRideColors } from '../theme/SchoolRideTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'white' | 'glass' | 'elevated';
  padding?: number;
  borderRadius?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'white',
  padding = 24,
  borderRadius = 24,
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: SchoolRideColors.glass.white,
          borderWidth: 1,
          borderColor: SchoolRideColors.glass.whiteBorder,
        };
      case 'elevated':
        return {
          backgroundColor: SchoolRideColors.white,
          shadowColor: SchoolRideColors.shadow.medium,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 24,
          elevation: 8,
        };
      default:
        return {
          backgroundColor: SchoolRideColors.white,
          shadowColor: SchoolRideColors.shadow.light,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 4,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        getCardStyle(),
        {
          padding,
          borderRadius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
  },
});

export default GlassCard;
