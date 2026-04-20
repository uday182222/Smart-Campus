import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SchoolRideColors } from '../theme/SchoolRideTheme';

const { width, height } = Dimensions.get('window');

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'custom';
  colors?: string[];
  style?: any;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = 'primary',
  colors,
  style,
}) => {
  const getGradientColors = () => {
    if (colors) return colors;
    
    switch (variant) {
      case 'primary':
        return [SchoolRideColors.primary.start, SchoolRideColors.primary.end];
      case 'secondary':
        return [SchoolRideColors.primary.light, SchoolRideColors.primary.dark];
      default:
        return [SchoolRideColors.primary.start, SchoolRideColors.primary.end];
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.gradient, { backgroundColor: getGradientColors()[0] }]} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default GradientBackground;
