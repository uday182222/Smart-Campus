/**
 * Shown once after super admin first login. Light theme, color grid, preview.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSuperAdminAccent } from '../../hooks/useSuperAdminAccent';
import { T } from '../../constants/theme';

const ACCENT_OPTIONS = [
  { color: '#CBFF00', name: 'Lime' },
  { color: '#00FF94', name: 'Mint' },
  { color: '#FF6B35', name: 'Orange' },
  { color: '#00D4FF', name: 'Cyan' },
  { color: '#FF3CAC', name: 'Pink' },
  { color: '#A855F7', name: 'Purple' },
  { color: '#FFFFFF', name: 'White' },
  { color: '#FFD700', name: 'Gold' },
];

export default function AccentColorPickerScreen() {
  const navigation = useNavigation<any>();
  const { userData } = useAuth();
  const { accent, saveAccent, loaded } = useSuperAdminAccent();
  const [chosen, setChosen] = useState(loaded ? accent : T.primary);

  React.useEffect(() => {
    if (loaded) setChosen(accent);
  }, [loaded, accent]);

  const handleContinue = async () => {
    await saveAccent(chosen);
    navigation.replace('SuperAdminDashboard');
  };

  const adminName = userData?.name ?? 'Admin';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: T.px, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 14, color: T.textMuted }}>Welcome,</Text>
        <Text style={{ fontSize: 28, color: T.textDark, fontWeight: '900', letterSpacing: -1, marginTop: 6 }}>{adminName}</Text>
        <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>Choose your accent color</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 32, marginHorizontal: -6 }}>
          {ACCENT_OPTIONS.map((opt) => {
            const selected = chosen === opt.color;
            return (
              <TouchableOpacity key={opt.color} activeOpacity={0.85} onPress={() => setChosen(opt.color)} style={{ width: '25%', alignItems: 'center', marginBottom: 24 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ padding: 3, borderRadius: 40, borderWidth: selected ? 3 : 1.5, borderColor: selected ? T.primary : T.inputBorder, backgroundColor: T.card, ...T.shadowSm }}>
                    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: opt.color }} />
                  </View>
                  <Text style={{ fontSize: 12, color: T.textDark, fontWeight: '800', marginTop: 10, textAlign: 'center' }}>{opt.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 12, ...T.shadowSm }}>
          <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 }}>PREVIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: T.bg, borderRadius: T.radius.lg, padding: 16, minWidth: 100, marginRight: 12, marginBottom: 8, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: chosen, letterSpacing: -1 }}>42</Text>
              <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Sample</Text>
            </View>
            <View style={{ backgroundColor: chosen, borderRadius: T.radius.lg, paddingHorizontal: 12, paddingVertical: 8, marginRight: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#1A1A1A' }}>BADGE</Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: chosen, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ color: '#1A1A1A', fontWeight: '900', fontSize: 14 }}>Go →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          style={{ marginTop: 24, height: 52, borderRadius: T.radius.full, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
        >
          <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 16 }}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
