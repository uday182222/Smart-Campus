/**
 * Smart Campus - Production Theme System
 * Modern, professional design tokens
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const colors = {
  // Primary Colors
  primary: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    contrast: '#FFFFFF',
  },
  
  // Secondary Colors
  secondary: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    contrast: '#FFFFFF',
  },
  
  // Accent Colors
  accent: {
    orange: '#FF9800',
    orangeLight: '#FFB74D',
    orangeDark: '#F57C00',
    purple: '#9C27B0',
    purpleLight: '#BA68C8',
    pink: '#E91E63',
    teal: '#009688',
    indigo: '#3F51B5',
  },
  
  // Semantic Colors
  success: {
    main: '#4CAF50',
    light: '#E8F5E9',
    dark: '#2E7D32',
  },
  warning: {
    main: '#FF9800',
    light: '#FFF3E0',
    dark: '#F57C00',
  },
  error: {
    main: '#F44336',
    light: '#FFEBEE',
    dark: '#D32F2F',
  },
  info: {
    main: '#2196F3',
    light: '#E3F2FD',
    dark: '#1976D2',
  },
  
  // Neutral Colors
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Background Colors
  background: {
    default: '#F5F7FA',
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
    dark: '#121212',
    subtle: '#F0F0F0',
  },
  
  // Text Colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    disabled: '#BDBDBD',
    hint: '#9E9E9E',
    white: '#FFFFFF',
  },
  
  // Border Colors
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#9E9E9E',
  },
  
  // Role-based Colors
  roles: {
    teacher: '#2196F3',
    parent: '#4CAF50',
    admin: '#9C27B0',
    superAdmin: '#F44336',
    student: '#FF9800',
  },
  status: {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
  },
  
  // Gradients (for LinearGradient)
  gradients: {
    primary: ['#2196F3', '#1976D2'],
    secondary: ['#4CAF50', '#388E3C'],
    accent: ['#FF9800', '#F57C00'],
    purple: ['#9C27B0', '#7B1FA2'],
    dark: ['#424242', '#212121'],
    sunrise: ['#FF9800', '#F44336'],
    ocean: ['#2196F3', '#00BCD4'],
    forest: ['#4CAF50', '#009688'],
  },
};

// ============================================================================
// DESIGN SYSTEM (apply to every screen)
// ============================================================================
export const designSystem = {
  typography: {
    pageTitle: 28,
    sectionHeader: 22,
    cardTitle: 18,
    body: 14,
    caption: 12,
    fontWeight: {
      bigHeading: '800' as TextStyle['fontWeight'],
      cardTitle: '700' as TextStyle['fontWeight'],
      sectionHeader: '600' as TextStyle['fontWeight'],
      body: '400' as TextStyle['fontWeight'],
    },
    textColor: {
      primaryDark: '#1A1A2E',
      secondaryGray: '#6B7280',
      onDark: '#FFFFFF',
    },
  },
  colors: {
    background: '#F8F9FA',
    cardBg: '#FFFFFF',
    pastel: {
      orange: '#FFF3E0',
      green: '#E8F5E9',
      blue: '#E3F2FD',
      pink: '#FCE4EC',
      purple: '#F3E5F5',
    },
  },
  card: {
    borderRadius: 20,
    innerBorderRadius: 14,
    shadow: {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    padding: 20,
  },
  spacing: {
    screenHorizontal: 20,
    betweenSections: 24,
    betweenCards: 12,
  },
  iconContainer: {
    size: 36,
    borderRadius: 10,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
  },
  
  // Font Sizes (design system aligned)
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    pageTitle: 28,
    sectionHeader: 22,
    cardTitle: 18,
    body: 14,
    caption: 12,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extraBold: '800' as TextStyle['fontWeight'],
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Pre-defined Text Styles
  styles: (() => {
    const h1 = { fontSize: 32, fontWeight: '700' as TextStyle['fontWeight'], lineHeight: 40, color: '#212121' } as TextStyle;
    const h2 = { fontSize: 28, fontWeight: '700' as TextStyle['fontWeight'], lineHeight: 36, color: '#212121' } as TextStyle;
    const h3 = { fontSize: 24, fontWeight: '600' as TextStyle['fontWeight'], lineHeight: 32, color: '#212121' } as TextStyle;
    const h4 = { fontSize: 20, fontWeight: '600' as TextStyle['fontWeight'], lineHeight: 28, color: '#212121' } as TextStyle;
    const h5 = { fontSize: 18, fontWeight: '600' as TextStyle['fontWeight'], lineHeight: 26, color: '#212121' } as TextStyle;
    const body1 = { fontSize: 16, fontWeight: '400' as TextStyle['fontWeight'], lineHeight: 24, color: '#212121' } as TextStyle;
    const body2 = { fontSize: 14, fontWeight: '400' as TextStyle['fontWeight'], lineHeight: 22, color: '#757575' } as TextStyle;
    const caption = { fontSize: 12, fontWeight: '400' as TextStyle['fontWeight'], lineHeight: 18, color: '#9E9E9E' } as TextStyle;
    const button = { fontSize: 16, fontWeight: '600' as TextStyle['fontWeight'], lineHeight: 24, textTransform: 'none' } as TextStyle;
    const overline = { fontSize: 10, fontWeight: '500' as TextStyle['fontWeight'], lineHeight: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#757575' } as TextStyle;
    return { h1, h2, h3, h4, h5, body1, body2, caption, button, overline };
  })(),
  get h3() { return this.styles.h3; },
  get body() { return this.styles.body1; },
  get bodyBold() { return { ...this.styles.body1, fontWeight: '700' as TextStyle['fontWeight'] }; },
  get caption() { return this.styles.caption; },
  get button() { return this.styles.button; },
  get buttonSmall() { return { ...this.styles.button, fontSize: 14 }; },
  get captionBold() { return { ...this.styles.caption, fontWeight: '700' as TextStyle['fontWeight'] }; },
};

// ============================================================================
// SPACING
// ============================================================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  medium: 12,
  lg: 16,
  large: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
  button: 12,
};

// ============================================================================
// SHADOWS & ELEVATION
// ============================================================================
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
  
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
  
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  } as ViewStyle,
  small: {} as ViewStyle,
  large: {} as ViewStyle,
};
(shadows as any).small = shadows.sm;
(shadows as any).large = shadows.lg;

// ============================================================================
// COMPONENT SIZES
// ============================================================================
export const componentSizes = {
  button: {
    small: { height: 40, paddingHorizontal: 16, fontSize: 14 },
    medium: { height: 48, paddingHorizontal: 20, fontSize: 16 },
    large: { height: 56, paddingHorizontal: 24, fontSize: 18 },
  },
  input: {
    small: { height: 40, paddingHorizontal: 12, fontSize: 14 },
    medium: { height: 48, paddingHorizontal: 16, fontSize: 16 },
    large: { height: 56, paddingHorizontal: 20, fontSize: 18 },
  },
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  },
};

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};

// ============================================================================
// Z-INDEX
// ============================================================================
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
};

// ============================================================================
// THEME OBJECT
// ============================================================================
const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentSizes,
  animation,
  zIndex,
  designSystem,
};

export const gradients = colors.gradients;
export const cardStyles = shadows;
export type Theme = typeof theme;
export default theme;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
export const getRoleColor = (role: string): string => {
  const roleColors: Record<string, string> = {
    teacher: colors.roles.teacher,
    parent: colors.roles.parent,
    admin: colors.roles.admin,
    super_admin: colors.roles.superAdmin,
    student: colors.roles.student,
  };
  return roleColors[role.toLowerCase()] || colors.primary.main;
};

export const getRoleGradient = (role: string): string[] => {
  const roleGradients: Record<string, string[]> = {
    teacher: colors.gradients.primary,
    parent: colors.gradients.secondary,
    admin: colors.gradients.purple,
    super_admin: ['#F44336', '#D32F2F'],
    student: colors.gradients.accent,
  };
  return roleGradients[role.toLowerCase()] || colors.gradients.primary;
};
