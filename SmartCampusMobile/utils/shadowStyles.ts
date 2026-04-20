import { Platform } from 'react-native';

/**
 * Shadow options for cross-platform use.
 * On web, use boxShadow to avoid "shadow* style props are deprecated" warning.
 */
export type ShadowOptions = {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
};

/**
 * Returns style object with boxShadow on web and shadow* props on native.
 * Use this to avoid the "shadow* style props are deprecated. Use boxShadow" warning on web.
 */
export function getShadowStyle(options: ShadowOptions): Record<string, unknown> {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.1,
    shadowRadius = 8,
    elevation = 3,
  } = options;

  if (Platform.OS === 'web') {
    const { width: x, height: y } = shadowOffset;
    if (shadowColor === 'transparent' || shadowOpacity === 0) {
      return { boxShadow: 'none', elevation };
    }
    const cssColor = `rgba(0,0,0,${shadowOpacity})`;
    return {
      boxShadow: `${x}px ${y}px ${shadowRadius}px 0px ${cssColor}`,
      elevation,
    };
  }

  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };
}
