// @ts-nocheck
/**
 * Modern Onboarding Screen - Welcome slides
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { GradientButton } from '../components/ui';
import { colors, typography, spacing, gradients, borderRadius } from '../theme';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  gradient: string[];
}

interface OnboardingScreenProps {
  onFinish: () => void;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'school',
    title: 'Welcome to\nSmart Campus',
    subtitle: 'Manage your school efficiently with our comprehensive education management system',
    gradient: gradients.primary,
  },
  {
    id: '2',
    icon: 'cellphone-link',
    title: 'Stay Connected',
    subtitle: "Track your child's progress in real-time. View attendance, homework, marks, and more instantly",
    gradient: gradients.secondary,
  },
  {
    id: '3',
    icon: 'bus-school',
    title: 'Safe Transport',
    subtitle: "Track your child's school bus live on the map. Get notifications when the bus is near your stop",
    gradient: gradients.orange,
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFinish();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.slideGradient}
        >
          {/* Background Shapes */}
          <View style={styles.shape1} />
          <View style={styles.shape2} />
          <View style={styles.shape3} />

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={80}
                color={item.gradient[0]}
              />
            </View>
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderDot = (index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const dotAnimatedStyle = useAnimatedStyle(() => {
      const dotWidth = interpolate(
        scrollX.value,
        inputRange,
        [8, 24, 8],
        Extrapolate.CLAMP
      );
      const dotOpacity = interpolate(
        scrollX.value,
        inputRange,
        [0.5, 1, 0.5],
        Extrapolate.CLAMP
      );

      return {
        width: dotWidth,
        opacity: dotOpacity,
      };
    });

    return (
      <Animated.View key={index} style={[styles.dot, dotAnimatedStyle]} />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Skip Button */}
      <SafeAreaView style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom Controls */}
      <SafeAreaView style={styles.bottomContainer}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => renderDot(index))}
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            icon={currentIndex === slides.length - 1 ? 'check' : 'arrow-right'}
            iconRight
            onPress={handleNext}
            size="large"
            fullWidth
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  skipContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.bodyBold,
    color: colors.text.white,
  },
  slide: {
    width,
    height,
  },
  slideGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  shape1: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  shape2: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: height * 0.2,
    left: -width * 0.15,
  },
  shape3: {
    position: 'absolute',
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: height * 0.3,
    left: width * 0.1,
  },
  iconContainer: {
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.white,
    marginHorizontal: spacing.xs,
  },
  buttonContainer: {
    width: '100%',
  },
});

export default OnboardingScreen;

