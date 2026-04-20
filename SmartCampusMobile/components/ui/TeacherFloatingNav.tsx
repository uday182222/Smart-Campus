import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Home, Calendar, BookOpen, Users, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/theme';

const TABS: { name: string; Icon: LucideIcon; label: string }[] = [
  { name: 'TeacherHome', Icon: Home, label: 'Home' },
  { name: 'TeacherClasses', Icon: Calendar, label: 'Classes' },
  { name: 'TeacherHomework', Icon: BookOpen, label: 'Homework' },
  { name: 'TeacherStudents', Icon: Users, label: 'Students' },
  { name: 'TeacherMore', Icon: MoreHorizontal, label: 'More' },
];

export interface TeacherFloatingNavProps {
  navigation: { navigate: (name: string, params?: object) => void };
  activeTab: string;
}

export function TeacherFloatingNav({ navigation, activeTab }: TeacherFloatingNavProps) {
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

