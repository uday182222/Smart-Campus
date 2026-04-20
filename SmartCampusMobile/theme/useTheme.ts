/**
 * useTheme Hook - Easy access to theme values
 * Inspired by Edumate and Modern iOS Apps
 */

import { 
  colors, 
  spacing, 
  borderRadius, 
  shadows, 
  typography,
  cardStyles,
  buttonStyles,
  inputStyles,
  gradients,
  animation,
  iconSizes,
} from './theme';

export const useTheme = () => {
  return {
    // Design Tokens
    colors,
    spacing,
    borderRadius,
    shadows,
    typography,

    // Component Styles
    cardStyles,
    buttonStyles,
    inputStyles,

    // Gradients
    gradients,

    // Animation
    animation,

    // Icon sizes
    iconSizes,

    // Helper functions
    getSpacing: (size: keyof typeof spacing) => spacing[size],
    getRadius: (size: keyof typeof borderRadius) => borderRadius[size],
    getShadow: (size: keyof typeof shadows) => shadows[size],
    getTypography: (style: keyof typeof typography) => typography[style],
    getGradient: (name: keyof typeof gradients) => gradients[name],
    getCardStyle: (variant: keyof typeof cardStyles) => cardStyles[variant],
    getButtonStyle: (variant: keyof typeof buttonStyles) => buttonStyles[variant],
    
    // Role-based helpers
    getRoleColor: (role: 'teacher' | 'parent' | 'admin' | 'student') => colors.roles[role],
    getRoleGradient: (role: 'teacher' | 'parent' | 'admin' | 'student') => colors.roles[role].gradient,
  };
};

export default useTheme;

// Type for the hook return value
export type Theme = ReturnType<typeof useTheme>;
