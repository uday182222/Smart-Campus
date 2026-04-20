import { StyleSheet, TextStyle } from 'react-native';

// SchoolRide-inspired color palette
export const SchoolRideColors = {
  // Primary gradients
  primary: {
    start: '#6C63FF',
    end: '#7B2FF7',
    light: '#8B5CF6',
    dark: '#5B21B6',
  },
  
  // Neutral whites
  white: '#FFFFFF',
  offWhite: '#F9FAFB',
  lightGray: '#F3F4F6',
  
  // Dark accents
  dark: '#0F0F1A',
  darkGray: '#374151',
  mediumGray: '#6B7280',
  
  // Accent colors
  emerald: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  
  // Glassmorphism
  glass: {
    white: 'rgba(255, 255, 255, 0.15)',
    whiteBorder: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Shadows
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },
};

// Typography
export const SchoolRideTypography = {
  fontFamily: 'Inter', // or 'Poppins' if available
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
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
  },
};

// Common styles
export const SchoolRideStyles = StyleSheet.create({
  // Gradients
  primaryGradient: {
    backgroundColor: SchoolRideColors.primary.start,
  },
  
  // Glassmorphism cards
  glassCard: {
    backgroundColor: SchoolRideColors.white,
    borderRadius: 24,
    shadowColor: SchoolRideColors.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  
  glassCardInner: {
    backgroundColor: SchoolRideColors.glass.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SchoolRideColors.glass.whiteBorder,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: SchoolRideColors.primary.start,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: SchoolRideColors.primary.start,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  
  secondaryButton: {
    backgroundColor: SchoolRideColors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: SchoolRideColors.glass.whiteBorder,
    shadowColor: SchoolRideColors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // Text styles
  heading: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.semibold,
    fontSize: SchoolRideTypography.sizes['2xl'],
    color: SchoolRideColors.dark,
  },
  
  subheading: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.medium,
    fontSize: SchoolRideTypography.sizes.lg,
    color: SchoolRideColors.darkGray,
  },
  
  body: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.regular,
    fontSize: SchoolRideTypography.sizes.base,
    color: SchoolRideColors.darkGray,
  },
  
  caption: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.regular,
    fontSize: SchoolRideTypography.sizes.sm,
    color: SchoolRideColors.mediumGray,
  },
  
  // Layout
  container: {
    flex: 1,
    backgroundColor: SchoolRideColors.primary.start,
  },
  
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SchoolRideColors.glass.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: SchoolRideColors.glass.whiteBorder,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  
  // Quick actions
  quickActionsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  
  quickActionCard: {
    backgroundColor: SchoolRideColors.white,
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: SchoolRideColors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // Calendar
  calendarCard: {
    backgroundColor: SchoolRideColors.white,
    borderRadius: 24,
    padding: 24,
    marginVertical: 16,
    shadowColor: SchoolRideColors.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
});

// Gradient helper function
export const createGradient = (startColor: string, endColor: string) => ({
  colors: [startColor, endColor],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

// Glassmorphism helper
export const createGlassEffect = (opacity: number = 0.15) => ({
  backgroundColor: `rgba(255, 255, 255, ${opacity})`,
  borderWidth: 1,
  borderColor: `rgba(255, 255, 255, ${opacity * 1.3})`,
});

export default SchoolRideStyles;
