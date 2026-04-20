/**
 * Shared dark theme constants for Super Admin and consistent dark UI.
 */

export const DT = {
  // Backgrounds
  bg: '#0D0D0D',       // screen background
  card: '#1A1A1A',     // card background
  card2: '#242424',    // elevated card
  input: '#1E1E1E',    // input background
  border: '#2A2A2A',   // subtle borders

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textMuted: '#666666',

  // Accent
  lime: '#CBFF00',
  limeDark: '#A8D400',

  // Status
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',

  // Border radius
  radius: { sm: 10, md: 14, lg: 20, xl: 24 },

  // Spacing
  px: 20,
} as const;
