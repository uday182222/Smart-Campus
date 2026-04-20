/**
 * More — hub for gallery, appointments, settings, help.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FloatingNav } from '../../components/ui/FloatingNav';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { PD, cardShadow, darkenHex } from '../../constants/parentDesign';

type GridItem =
  | { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; color: string; action: 'nav'; target: string }
  | { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; color: string; action: 'home'; target: string }
  | { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; color: string; action: 'soon' };

const GRID: GridItem[] = [
  { icon: 'camera', label: 'Gallery', color: '#A855F7', action: 'nav', target: 'Gallery' },
  { icon: 'calendar-clock', label: 'Appointments', color: '#3B82F6', action: 'nav', target: 'Appointments' },
  { icon: 'bell-ring', label: 'Notifications', color: '#F97316', action: 'home', target: 'Notifications' },
  { icon: 'cog-outline', label: 'Settings', color: '#6B7280', action: 'nav', target: 'Settings' },
  { icon: 'help-circle', label: 'Help', color: '#14B8A6', action: 'soon' },
  { icon: 'shield-check', label: 'Privacy', color: '#22C55E', action: 'soon' },
];

export default function MoreHomeScreen() {
  const navigation = useNavigation<any>();
  const { userData, logout } = useAuth();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);

  const initials =
    userData?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'P';

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900' }}>More</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18 }}>{initials}</Text>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 17 }} numberOfLines={1}>
                {userData?.name ?? 'Parent'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {userData?.email}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20 }, cardShadow]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>{initials}</Text>
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 17 }} numberOfLines={1}>
                {userData?.name}
              </Text>
              <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                {userData?.email}
              </Text>
              <Text style={{ color: primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Parent</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginTop: 16 }}>
            <Text style={{ color: primary, fontWeight: '800', fontSize: 14 }}>Edit Profile →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 }}>
          {GRID.map((g) => (
            <TouchableOpacity
              key={g.label}
              onPress={() => {
                if (g.action === 'soon') {
                  Alert.alert('Coming soon', `${g.label} will be available in a future update.`);
                  return;
                }
                if (g.action === 'home') {
                  navigation.getParent()?.navigate('ParentHome', { screen: g.target });
                  return;
                }
                navigation.navigate(g.target as never);
              }}
              style={[{ width: '48%', backgroundColor: PD.card, borderRadius: 20, padding: 16, marginBottom: 12 }, cardShadow]}
            >
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: g.color + '28', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={g.icon} size={26} color={g.color} />
              </View>
              <Text style={{ color: PD.textDark, fontWeight: '800', fontSize: 13, marginTop: 10 }}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={logout}
          style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 8 }, cardShadow]}
        >
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: PD.danger + '22', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="logout" size={22} color={PD.danger} />
          </View>
          <Text style={{ color: PD.danger, fontWeight: '900', fontSize: 16, marginLeft: 12, flex: 1 }}>Logout</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={PD.danger} />
        </TouchableOpacity>
      </ScrollView>
      {/* ParentMore tab removed; keep component safe if still reachable */}
      <FloatingNav navigation={navigation} activeTab="ParentGallery" />
    </View>
  );
}
