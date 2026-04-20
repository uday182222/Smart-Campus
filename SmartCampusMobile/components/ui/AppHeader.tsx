import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  onAvatarPress?: () => void;
}

export function AppHeader({
  title,
  showBack,
  showMenu = true,
  onMenuPress,
  onBackPress,
  onAvatarPress,
}: AppHeaderProps) {
  const { theme } = useSchoolTheme();
  const { userData } = useAuth();
  const initials =
    userData?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  const displayTitle = title ?? theme.schoolName ?? 'Smart Campus';

  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-2 bg-background">
      <TouchableOpacity
        onPress={showBack ? onBackPress : onMenuPress}
        className="w-11 h-11 rounded-full bg-card items-center justify-center shadow-sm"
        style={{ elevation: 2 }}
      >
        <Ionicons
          name={showBack ? 'arrow-back' : 'menu'}
          size={22}
          color="#1A1A2E"
        />
      </TouchableOpacity>

      <Text className="text-lg font-bold text-dark flex-1 text-center mx-2" numberOfLines={1}>
        {displayTitle}
      </Text>

      <TouchableOpacity
        onPress={onAvatarPress}
        className="w-11 h-11 rounded-full overflow-hidden items-center justify-center"
        style={{ backgroundColor: theme.primaryColor }}
      >
        {theme.logoUrl ? (
          <Image source={{ uri: theme.logoUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (userData as any)?.avatarUrl ? (
          <Image source={{ uri: (userData as any).avatarUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-white font-bold text-sm">{initials}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default AppHeader;
