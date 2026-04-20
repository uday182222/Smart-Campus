/**
 * Teacher — More tab: profile card, shortcuts, logout.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, User, Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { T } from '../../constants/theme';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

const MENU: Array<{ key: string; label: string; Icon: any; screen: string }> = [
  { key: 'Calendar', label: 'Calendar', Icon: Calendar, screen: 'Calendar' },
  { key: 'Profile', label: 'Profile', Icon: User, screen: 'Profile' },
  { key: 'Settings', label: 'Settings', Icon: Settings, screen: 'Settings' },
  { key: 'Help', label: 'Help', Icon: HelpCircle, screen: 'Settings' },
];

export default function TeacherMoreScreen() {
  const navigation = useNavigation<any>();
  const { userData, logout } = useAuth();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;
  const insets = useSafeAreaInsets();
  const name = userData?.name ?? 'Teacher';

  const initials =
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'T';

  const safeNavigate = (fn: () => void) => {
    try {
      fn();
    } catch (_e) {
      // no-op: route may not exist in this navigator
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 16 }}>
        <Text style={{ ...T.font.appTitle, color: T.textDark }}>More</Text>
        <Text style={{ color: T.textMuted, fontSize: 14, marginTop: 8 }}>{name}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 120, paddingTop: 8 }}>
        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, flexDirection: 'row', alignItems: 'center', ...T.shadowMd }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 22 }}>{initials}</Text>
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18 }}>{name}</Text>
            <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }} numberOfLines={1}>
              {userData?.email ?? ''}
            </Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: T.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: T.inputBorder }}>
              <Text style={{ color: T.primary, fontWeight: '800', fontSize: 11 }}>TEACHER</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ padding: 8 }}>
            <ChevronRight size={20} color={T.primary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16, marginTop: 24, marginBottom: 12 }}>Menu</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => {
                if (item.screen === 'Calendar') {
                  safeNavigate(() => navigation.getParent()?.navigate('TeacherClasses' as any, { screen: 'Calendar' } as any));
                  return;
                }
                if (item.screen === 'Profile') {
                  safeNavigate(() => navigation.navigate('Profile'));
                  return;
                }
                if (item.screen === 'Settings') {
                  safeNavigate(() => navigation.navigate('Settings'));
                  return;
                }
                safeNavigate(() => navigation.navigate(item.screen as any));
              }}
              style={{ width: '48%', backgroundColor: T.card, borderRadius: 16, padding: 18, marginBottom: 12, alignItems: 'center', ...T.shadowSm }}
              activeOpacity={0.8}
            >
              <item.Icon size={26} color={T.primary} strokeWidth={1.8} />
              <Text style={{ color: T.textDark, fontWeight: '800', marginTop: 10, fontSize: 14 }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={logout}
          style={{
            marginTop: 16,
            backgroundColor: T.dangerTint,
            borderRadius: T.radius.xxl,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.25)',
          }}
        >
          <LogOut size={20} color={T.danger} strokeWidth={1.8} />
          <Text style={{ color: T.danger, fontWeight: '900', fontSize: 16, marginLeft: 10 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      <TeacherFloatingNav navigation={navigation} activeTab="TeacherMore" />
    </View>
  );
}
