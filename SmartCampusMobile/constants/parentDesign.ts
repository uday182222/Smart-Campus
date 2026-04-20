/**
 * Premium parent-role design tokens (school-branded via useSchoolTheme).
 */
import { ViewStyle, TextStyle, Platform } from 'react-native';

export const PD = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  textDark: '#0F0F1A',
  textMuted: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  cardBorder: '#E5E7EB',
};

/** Strong card shadow (premium) */
export const cardShadow: ViewStyle = {
  shadowColor: '#6B7280',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: Platform.OS === 'android' ? 6 : 8,
};

/** Tab bar upward shadow */
export const tabBarShadow: ViewStyle = {
  shadowColor: '#6B7280',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 20,
};

export function darkenHex(hex: string, amount = 0.18): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '#1E3A5F';
  const r = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount))));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount))));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount))));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** 52px circular icon container */
export function iconCircleStyle(primary: string): ViewStyle {
  return {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  };
}

export const statNumber: TextStyle = {
  fontSize: 42,
  fontWeight: '800',
  letterSpacing: -1.5,
};
