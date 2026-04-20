import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LT } from '../../constants/lightTheme';

interface AccentBadgeProps {
  label: string;
  small?: boolean;
}

export function AccentBadge({ label, small }: AccentBadgeProps) {
  const { userData } = useAuth();
  const isSuperAdmin =
    userData?.role === 'SUPER_ADMIN' ||
    userData?.role === 'super_admin' ||
    (userData?.role as string)?.toUpperCase() === 'SUPER_ADMIN';

  const bg = isSuperAdmin ? '#CBFF00' : LT.primary;
  const fg = isSuperAdmin ? '#1A1A1A' : '#FFFFFF';

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        paddingHorizontal: small ? 8 : 12,
        paddingVertical: small ? 2 : 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: small ? 10 : 12,
          fontWeight: '800',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
