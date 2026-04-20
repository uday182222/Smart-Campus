import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: string;
  label?: string;
  color?: string;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  label,
  color = '#6366F1',
  style,
  size = 'medium',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Continuous rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, []);

  const handlePress = () => {
    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const sizeStyles = {
    small: { width: 48, height: 48, borderRadius: 24 },
    medium: { width: 56, height: 56, borderRadius: 28 },
    large: { width: 64, height: 64, borderRadius: 32 },
  };

  const iconSize = {
    small: 20,
    medium: 24,
    large: 28,
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles[size],
        { backgroundColor: color },
        style,
        {
          transform: [
            { scale: scaleAnim },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, sizeStyles[size]]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[styles.icon, { fontSize: iconSize[size] }]}>
          {icon}
        </Text>
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    color: 'white',
  },
  label: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default FloatingActionButton;
