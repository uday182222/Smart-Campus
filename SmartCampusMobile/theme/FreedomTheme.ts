import { StyleSheet, TextStyle } from 'react-native';

// Freedom Job Finder inspired color palette
export const FreedomColors = {
  // Primary gradients
  primary: {
    start: '#FF7E29',
    end: '#FF4F18',
    light: '#FF9A56',
    dark: '#E63E00',
  },
  
  // Background gradients
  background: {
    start: '#FF7E29',
    end: '#2B1A0E',
    radial: 'radial-gradient(circle at center, #FF7E29 0%, #2B1A0E 100%)',
  },
  
  // Neutral colors
  white: '#FFFFFF',
  offWhite: '#FEFEFE',
  lightGray: '#F5F5F5',
  mediumGray: '#8E8E93',
  darkGray: '#3A3A3C',
  black: '#000000',
  
  // Text colors
  text: {
    primary: '#1D1D1F',
    secondary: '#6E6E73',
    tertiary: '#8E8E93',
    white: '#FFFFFF',
  },
  
  // Shadows and effects
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
    dark: 'rgba(0, 0, 0, 0.25)',
    glow: 'rgba(255, 126, 41, 0.4)',
  },
  
  // Glassmorphism
  glass: {
    white: 'rgba(255, 255, 255, 0.25)',
    whiteBorder: 'rgba(255, 255, 255, 0.3)',
    dark: 'rgba(0, 0, 0, 0.1)',
  },
};

// Typography (SF Pro / Inter inspired)
export const FreedomTypography = {
  fontFamily: 'Inter', // or 'SF Pro Display' if available
  weights: {
    light: '300' as TextStyle['fontWeight'],
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    heavy: '800' as TextStyle['fontWeight'],
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Common styles (spacing/radius are design tokens, not RN styles - cast for StyleSheet)
export const FreedomStyles = StyleSheet.create({
  // Gradients
  primaryGradient: {
    backgroundColor: FreedomColors.primary.start,
  },
  
  backgroundGradient: {
    backgroundColor: FreedomColors.background.start,
  },
  
  // Glassmorphism cards
  glassCard: {
    backgroundColor: FreedomColors.glass.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: FreedomColors.glass.whiteBorder,
    shadowColor: FreedomColors.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: FreedomColors.primary.start,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    shadowColor: FreedomColors.primary.start,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: FreedomColors.white,
  },
  
  // Text styles
  heading: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.bold,
    fontSize: FreedomTypography.sizes['4xl'],
    color: FreedomColors.text.white,
    lineHeight: FreedomTypography.sizes['4xl'] * FreedomTypography.lineHeights.tight,
  },
  
  subheading: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.medium,
    fontSize: FreedomTypography.sizes.lg,
    color: FreedomColors.text.white,
    opacity: 0.9,
    lineHeight: FreedomTypography.sizes.lg * FreedomTypography.lineHeights.normal,
  },
  
  body: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.regular,
    fontSize: FreedomTypography.sizes.base,
    color: FreedomColors.text.primary,
    lineHeight: FreedomTypography.sizes.base * FreedomTypography.lineHeights.normal,
  },
  
  caption: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.regular,
    fontSize: FreedomTypography.sizes.sm,
    color: FreedomColors.text.secondary,
    lineHeight: FreedomTypography.sizes.sm * FreedomTypography.lineHeights.normal,
  },
  
  // Layout
  container: {
    flex: 1,
  },
  
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  
  // Input fields
  input: {
    backgroundColor: FreedomColors.white,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: FreedomTypography.sizes.base,
    fontFamily: FreedomTypography.fontFamily,
    color: FreedomColors.text.primary,
    shadowColor: FreedomColors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // Spacing (design tokens, not ViewStyle - cast for StyleSheet)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // Border radius (design tokens)
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 999,
  },
} as Record<string, any>);

// Animation variants for Framer Motion
export const FreedomAnimations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: 'easeOut' },
  },
  
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: 'easeOut' },
  },
  
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.7, ease: 'easeOut' },
  },
  
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.7, ease: 'easeOut' },
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, ease: 'easeOut' },
  },
  
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};

export default FreedomStyles;

