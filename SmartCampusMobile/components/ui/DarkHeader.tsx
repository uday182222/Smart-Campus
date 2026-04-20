import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { useAccentColor } from '../../hooks/useAccentColor';
import { useDrawer } from '../../contexts/DrawerContext';

interface DarkHeaderProps {
  showMenu?: boolean;
  showBack?: boolean;
  title?: string;
  onBackPress?: () => void;
  accent?: string;
}

export function DarkHeader({
  showMenu,
  showBack,
  title,
  onBackPress,
  accent: accentProp,
}: DarkHeaderProps) {
  const navigation = useNavigation<any>();
  const { userData } = useAuth();
  const { theme } = useSchoolTheme();
  const accentFromHook = useAccentColor();
  const { openDrawer } = useDrawer();
  const accent = accentProp ?? accentFromHook;

  const initials =
    userData?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <View
      style={{
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {showBack ? (
        <TouchableOpacity
          onPress={onBackPress ?? (() => navigation.goBack())}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#2A2A2A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ) : showMenu ? (
        <TouchableOpacity
          onPress={() => openDrawer()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#2A2A2A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="menu" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}

      {title ? (
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{title}</Text>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: accent,
              marginRight: 6,
            }}
          />
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
            {theme?.schoolName || 'Smart Campus'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#1A1A1A', fontWeight: '900', fontSize: 14 }}>{initials}</Text>
      </TouchableOpacity>
    </View>
  );
}
