export const PRINCIPAL_HIDDEN_FEATURES = [
  'UserManagement',
  'ClassManagement',
  'TransportManagement',
  'GalleryManagement',
] as const;

export const canAccess = (role: string, feature: string): boolean => {
  if (role === 'ADMIN') return true;
  if (role === 'PRINCIPAL') {
    return !PRINCIPAL_HIDDEN_FEATURES.includes(feature as any);
  }
  return false;
};

export const isAdminOnly = (role: string): boolean => {
  return role === 'ADMIN';
};

