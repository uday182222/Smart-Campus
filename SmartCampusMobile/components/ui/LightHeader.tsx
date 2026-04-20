import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { LT } from '../../constants/lightTheme';

interface LightHeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  rightComponent?: React.ReactNode;
  /** If set, overrides default navigation.goBack() */
  onBackPress?: () => void;
}

export function LightHeader({ title, showBack, showMenu, rightComponent, onBackPress }: LightHeaderProps) {
  const navigation = useNavigation<any>();
  const { openDrawer } = useDrawer();
  const { userData } = useAuth();

  const initials =
    userData?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={LT.primaryDark} />
      <View
        style={{
          backgroundColor: LT.primaryDark,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left */}
        {showBack ? (
          <TouchableOpacity
            onPress={() => (onBackPress ? onBackPress() : navigation.goBack())}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : showMenu ? (
          <TouchableOpacity
            onPress={openDrawer}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="menu" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        {/* Title */}
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: '700',
            flex: 1,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Right */}
        {rightComponent || (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: LT.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{initials}</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

