/**
 * Splash — light theme (brand blue + green accents).
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

import { LT } from '../constants/lightTheme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const spinnerOpacity = useSharedValue(0);
  const fadeOut = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back()) }),
      withTiming(1, { duration: 200 })
    );
    logoOpacity.value = withTiming(1, { duration: 500 });
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(300, withTiming(0, { duration: 400 }));
    spinnerOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));

    const finishTimer = setTimeout(() => {
      fadeOut.value = withTiming(1, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }, 2000);

    return () => clearTimeout(finishTimer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const spinnerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fadeOut.value, [0, 1], [1, 0]),
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={LT.bgGradient} style={styles.gradient}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.appName}>Smart Campus</Text>
          <Text style={styles.tagline}>Education Made Smarter</Text>
        </Animated.View>

        <Animated.View style={[styles.spinnerContainer, spinnerAnimatedStyle]}>
          <View style={styles.spinner}>
            <View style={styles.spinnerDot} />
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(43, 92, 230, 0.06)',
    top: -width * 0.15,
    left: -width * 0.1,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    bottom: height * 0.08,
    right: -width * 0.1,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: LT.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LT.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoLetter: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: LT.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: LT.textSecondary,
    marginTop: 8,
  },
  spinnerContainer: {
    position: 'absolute',
    bottom: 80,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    borderTopColor: LT.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LT.secondary,
  },
});

export default SplashScreen;
