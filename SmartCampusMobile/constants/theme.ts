/**
 * App UI tokens — colors, typography, shadows (login + parent surfaces).
 */
export const T = {
  // Colors
  bg: '#EEF2FF',
  bgGradient: ['#C7D2FE', '#EEF2FF', '#E0E7FF'] as string[],
  primary: '#1E3FA0',
  primaryTint: 'rgba(30,63,160,0.08)',
  primaryLight: '#EEF2FF',
  success: '#22C55E',
  successTint: 'rgba(34,197,94,0.12)',
  danger: '#EF4444',
  dangerTint: 'rgba(239,68,68,0.1)',
  warning: '#F59E0B',
  warningTint: 'rgba(245,158,11,0.1)',

  // Text
  textDark: '#1A1A2E',
  textBody: '#475569',
  textMuted: '#64748B',
  textPlaceholder: '#94A3B8',
  textWhite: '#FFFFFF',

  // Cards
  card: '#FFFFFF',
  cardBg: 'rgba(255,255,255,0.92)',
  cardBorder: 'rgba(255,255,255,0.95)',
  inputBorder: '#DDE3F0',
  inputBorderActive: '#1E3FA0',

  // Shadows
  shadowSm: {
    shadowColor: '#1E3FA0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shadowMd: {
    shadowColor: '#1E3FA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  shadowLg: {
    shadowColor: '#1E3FA0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },

  // Spacing
  px: 20,
  radius: { sm: 8, md: 12, lg: 14, xl: 20, xxl: 24, full: 999 },

  // Typography — locked system
  font: {
    appTitle: { fontSize: 26, fontWeight: '900' as const, letterSpacing: -1, lineHeight: 30 },
    cardTitle: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 26 },
    schoolName: { fontSize: 14, fontWeight: '800' as const },
    label: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.1 },
    body: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
    inputFilled: { fontSize: 15, fontWeight: '700' as const },
    inputPlaceholder: { fontSize: 14, fontWeight: '400' as const },
    code: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 1.5 },
    helper: { fontSize: 13, fontWeight: '400' as const },
    link: { fontSize: 13, fontWeight: '700' as const },
    badge: { fontSize: 12, fontWeight: '700' as const },
    step: { fontSize: 12, fontWeight: '600' as const },
    buttonLabel: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.3 },
  },
};
