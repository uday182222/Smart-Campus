import React, { useEffect, useMemo, useRef } from 'react';
import { View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';

const { width } = Dimensions.get('window');

const TABS = [
  { name: 'ParentHome', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  { name: 'ParentAcademic', icon: 'book-open-outline', activeIcon: 'book-open' },
  { name: 'ParentFees', icon: 'wallet-outline', activeIcon: 'wallet' },
  { name: 'ParentBus', icon: 'bus-outline', activeIcon: 'bus' },
  { name: 'ParentGallery', icon: 'image-outline', activeIcon: 'image' },
] as const;

export function FloatingTabBar({ state, navigation }: any) {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#7C3AED';
  const insets = useSafeAreaInsets();

  const tabWidth = useMemo(() => (width - 32) / TABS.length, []);
  const pillX = useRef(new Animated.Value((state?.index ?? 0) * tabWidth)).current;

  useEffect(() => {
    Animated.spring(pillX, {
      toValue: (state?.index ?? 0) * tabWidth,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [pillX, state?.index, tabWidth]);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: 16,
        right: 16,
        height: 64,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 16,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: tabWidth - 8,
          height: 48,
          borderRadius: 24,
          backgroundColor: `${primary}15`,
          left: 4,
          transform: [{ translateX: pillX }],
        }}
      />

      {TABS.map((tab, index) => {
        const isFocused = state?.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            style={{ flex: 1, height: 64, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={(isFocused ? tab.activeIcon : tab.icon) as any}
              size={24}
              color={isFocused ? primary : '#9CA3AF'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

