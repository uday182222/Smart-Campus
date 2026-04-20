/**
 * Admin role — shared tokens with parent + role colors for user badges.
 */
export { PD, cardShadow, darkenHex } from './parentDesign';

export const AD = {
  roleColors: {
    ADMIN: { bg: '#EEF2FF', text: '#2B5CE6', icon: 'shield-account' as const },
    TEACHER: { bg: '#F0FDF4', text: '#22C55E', icon: 'school' as const },
    PARENT: { bg: '#FEF3C7', text: '#F59E0B', icon: 'account-child' as const },
    STUDENT: { bg: '#F3E8FF', text: '#A855F7', icon: 'school-outline' as const },
    BUS_HELPER: { bg: '#FFF7ED', text: '#EA580C', icon: 'bus-school' as const },
  },
};
