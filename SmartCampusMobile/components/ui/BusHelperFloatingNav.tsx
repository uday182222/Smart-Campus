import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { House, Clock, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/theme';

const TABS: { name: string; Icon: LucideIcon; label: string }[] = [
  { name: 'ConductorPortal', Icon: House, label: 'Home' },
  { name: 'TripHistory', Icon: Clock, label: 'History' },
  { name: 'Profile', Icon: User, label: 'Profile' },
];

export interface BusHelperFloatingNavProps {
  navigation: { navigate: (name: string, params?: object) => void };
  activeTab: string;
}

export function BusHelperFloatingNav({ navigation, activeTab }: BusHelperFloatingNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: 16,
        right: 16,
        backgroundColor: T.card,
        borderRadius: T.radius.full,
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        gap: 4,
        ...T.shadowLg,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        const Icon = tab.Icon;
        if (isActive) {
          return (
            <View
              key={tab.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: T.primary,
                borderRadius: T.radius.full,
                paddingHorizontal: 18,
                paddingVertical: 10,
                flexShrink: 0,
              }}
            >
              <Icon size={17} color={T.textWhite} strokeWidth={1.8} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: T.textWhite }}>{tab.label}</Text>
            </View>
          );
        }
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            style={{
              flex: 1,
              height: 50,
              borderRadius: T.radius.full,
              backgroundColor: T.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} color={T.textPlaceholder} strokeWidth={1.8} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

