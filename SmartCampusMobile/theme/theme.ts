/**
 * Smart Campus - Modern Theme System
 * Inspired by Edumate and Modern iOS Apps
 * 
 * A vibrant, friendly, and professional color palette
 * designed for educational applications.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ColorShade {
  main: string;
  light: string;
  dark: string;
  gradient: string[];
}

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface TextStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  lineHeight: number;
}

export interface CardStyle {
  backgroundColor?: string;
  borderRadius: number;
  padding: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary - Bright Blue (Trust, Intelligence, Clarity)
  primary: {
    main: '#4A90E2',
    light: '#6BA3E8',
    dark: '#3A7BC8',
    gradient: ['#4A90E2', '#667EEA'],
    50: '#EBF4FC',
    100: '#D6E9F9',
    200: '#ADD3F3',
    300: '#85BDED',
    400: '#5CA7E7',
    500: '#4A90E2',
    600: '#3A7BC8',
    700: '#2D66AE',
    800: '#1F5294',
    900: '#123D7A',
  } as unknown as ColorShade & Record<string, string>,

  // Secondary - Emerald Green (Growth, Success, Nature)
  secondary: {
    main: '#50C878',
    light: '#6FD89B',
    dark: '#3FAF63',
    gradient: ['#50C878', '#48BB78'],
    50: '#EEFBF3',
    100: '#DCF7E7',
    200: '#B9EFCF',
    300: '#96E7B7',
    400: '#73DF9F',
    500: '#50C878',
    600: '#3FAF63',
    700: '#2E964E',
    800: '#1D7D39',
    900: '#0C6424',
  } as unknown as ColorShade & Record<string, string>,

  // Accent Colors - Vibrant highlights
  accent: {
    orange: '#FF9F43',
    orangeLight: '#FFB76B',
    orangeDark: '#E8891F',
    orangeGradient: ['#FF9F43', '#FF6B35'],

    pink: '#EE5A6F',
    pinkLight: '#F47C8D',
    pinkDark: '#D43F53',
    pinkGradient: ['#EE5A6F', '#E91E63'],

    purple: '#A55EEA',
    purpleLight: '#B87DEF',
    purpleDark: '#8E3FD5',
    purpleGradient: ['#A55EEA', '#7C3AED'],

    yellow: '#FFC107',
    yellowLight: '#FFD54F',
    yellowDark: '#FFA000',
    yellowGradient: ['#FFC107', '#FF9800'],

    teal: '#20C997',
    tealLight: '#4DD9AC',
    tealDark: '#17A882',
    tealGradient: ['#20C997', '#14B8A6'],

    indigo: '#667EEA',
    indigoLight: '#8598EF',
    indigoDark: '#4C64D5',
    indigoGradient: ['#667EEA', '#5A67D8'],
  },

  // Background Colors
  background: {
    main: '#F8F9FD',
    white: '#FFFFFF',
    card: '#FFFFFF',
    gradient: ['#F8F9FD', '#E8EAF6'],
    subtle: '#F0F4F8',
    overlay: 'rgba(0, 0, 0, 0.5)',
    dark: '#1A1A2E',
  },

  // Text Colors
  text: {
    primary: '#2C3E50',
    secondary: '#6C7A89',
    tertiary: '#8899A6',
    disabled: '#95A5A6',
    white: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    link: '#4A90E2',
  },

  // Status Colors
  status: {
    success: '#50C878',
    successLight: '#E8F8EF',
    successDark: '#3FAF63',
    
    warning: '#FF9F43',
    warningLight: '#FFF4E5',
    warningDark: '#E8891F',
    
    error: '#EE5A6F',
    errorLight: '#FDECEF',
    errorDark: '#D43F53',
    
    info: '#4A90E2',
    infoLight: '#EBF4FC',
    infoDark: '#3A7BC8',
  },

  // Border Colors
  border: {
    default: '#E1E8ED',
    light: '#F0F4F8',
    dark: '#CCD6DD',
    focus: '#4A90E2',
  },

  // Role-specific Colors (for dashboards)
  roles: {
    teacher: {
      primary: '#4A90E2',
      gradient: ['#4A90E2', '#667EEA'],
      light: '#EBF4FC',
    },
    parent: {
      primary: '#50C878',
      gradient: ['#50C878', '#48BB78'],
      light: '#EEFBF3',
    },
    admin: {
      primary: '#A55EEA',
      gradient: ['#A55EEA', '#7C3AED'],
      light: '#F3EEFA',
    },
    student: {
      primary: '#FF9F43',
      gradient: ['#FF9F43', '#FF6B35'],
      light: '#FFF4E5',
    },
  },
};

// ============================================================================
// SHADOWS (iOS Style)
// ============================================================================

export const shadows: Record<string, ShadowStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  xlarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
  },
  // Colored shadows
  primary: {
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    shadowColor: colors.secondary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  accent: {
    shadowColor: colors.accent.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  xs: 4,
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  xxlarge: 32,
  full: 999,
  
  // Component specific
  button: 12,
  card: 16,
  modal: 24,
  input: 12,
  chip: 20,
  avatar: 999,
  fab: 16,
  bottomSheet: 24,
};

// ============================================================================
// SPACING (4px base unit)
// ============================================================================

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Semantic
  gutter: 16,
  cardPadding: 16,
  screenPadding: 20,
  sectionGap: 24,
  listItemPadding: 12,
  inputPadding: 12,
  buttonPaddingH: 24,
  buttonPaddingV: 14,
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography: Record<string, TextStyle> = {
  // Headlines
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  // Caption & Labels
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  tiny: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },

  // Special
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  stat: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
};

// ============================================================================
// CARD STYLES
// ============================================================================

export const cardStyles: Record<string, CardStyle> = {
  default: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  flat: {
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 12,
  },
  outlined: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  compact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  stat: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
};

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.buttonPaddingV,
    paddingHorizontal: spacing.buttonPaddingH,
    ...shadows.small,
  },
  primaryGradient: {
    borderRadius: borderRadius.button,
    paddingVertical: spacing.buttonPaddingV,
    paddingHorizontal: spacing.buttonPaddingH,
    ...shadows.primary,
  },
  secondary: {
    backgroundColor: colors.secondary.main,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.buttonPaddingV,
    paddingHorizontal: spacing.buttonPaddingH,
    ...shadows.small,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.button,
    borderWidth: 2,
    borderColor: colors.primary.main,
    paddingVertical: spacing.buttonPaddingV - 2,
    paddingHorizontal: spacing.buttonPaddingH,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.button,
    paddingVertical: spacing.buttonPaddingV,
    paddingHorizontal: spacing.buttonPaddingH,
  },
  soft: {
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.button,
    paddingVertical: spacing.buttonPaddingV,
    paddingHorizontal: spacing.buttonPaddingH,
  },
};

// ============================================================================
// INPUT STYLES
// ============================================================================

export const inputStyles = {
  default: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.inputPadding,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  focused: {
    borderColor: colors.primary.main,
    borderWidth: 2,
    ...shadows.small,
  },
  error: {
    borderColor: colors.status.error,
    borderWidth: 2,
    backgroundColor: colors.status.errorLight,
  },
  filled: {
    backgroundColor: colors.background.subtle,
    borderRadius: borderRadius.input,
    borderWidth: 0,
    paddingVertical: spacing.inputPadding,
    paddingHorizontal: spacing.md,
  },
};

// ============================================================================
// GRADIENTS (for LinearGradient)
// ============================================================================

export const gradients = {
  primary: colors.primary.gradient,
  secondary: colors.secondary.gradient,
  orange: colors.accent.orangeGradient,
  pink: colors.accent.pinkGradient,
  purple: colors.accent.purpleGradient,
  yellow: colors.accent.yellowGradient,
  teal: colors.accent.tealGradient,
  indigo: colors.accent.indigoGradient,
  background: colors.background.gradient,
  
  // Role gradients
  teacher: colors.roles.teacher.gradient,
  parent: colors.roles.parent.gradient,
  admin: colors.roles.admin.gradient,
  student: colors.roles.student.gradient,

  // Special gradients
  sunset: ['#FF9F43', '#EE5A6F'],
  ocean: ['#4A90E2', '#20C997'],
  forest: ['#50C878', '#20C997'],
  berry: ['#A55EEA', '#EE5A6F'],
  dawn: ['#667EEA', '#A55EEA'],
  warm: ['#FF9F43', '#FFC107'],
};

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  spring: {
    default: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    bouncy: {
      damping: 10,
      stiffness: 180,
      mass: 1,
    },
    smooth: {
      damping: 20,
      stiffness: 120,
      mass: 1,
    },
    gentle: {
      damping: 25,
      stiffness: 100,
      mass: 1,
    },
  },
};

// ============================================================================
// ICON SIZES
// ============================================================================

export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  toast: 1600,
};

// ============================================================================
// THEME EXPORT
// ============================================================================

export const theme = {
  colors,
  shadows,
  borderRadius,
  spacing,
  typography,
  cardStyles,
  buttonStyles,
  inputStyles,
  gradients,
  animation,
  iconSizes,
  zIndex,
};

export default theme;
