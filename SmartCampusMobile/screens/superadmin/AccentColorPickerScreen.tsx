/**
 * Shown once after super admin first login. DT theme, color grid, preview.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSuperAdminAccent } from '../../hooks/useSuperAdminAccent';
import { Pressable3D, DarkButton } from '../../components/ui';
import { DT } from '../../constants/darkTheme';

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
  const [chosen, setChosen] = useState(loaded ? accent : '#CBFF00');

  React.useEffect(() => {
    if (loaded) setChosen(accent);
  }, [loaded, accent]);

  const handleContinue = async () => {
    await saveAccent(chosen);
    navigation.replace('SuperAdminDashboard');
  };

  const adminName = userData?.name ?? 'Admin';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: DT.px, paddingTop: 60, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 18, color: DT.textMuted, fontStyle: 'italic' }}>Welcome,</Text>
        <Text style={{ fontSize: 36, color: DT.textPrimary, fontWeight: '900', letterSpacing: -2, marginTop: 4 }}>{adminName}</Text>
        <Text style={{ fontSize: 14, color: DT.textMuted, marginTop: 8, fontStyle: 'italic' }}>Choose your accent color</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 32, marginHorizontal: -6 }}>
          {ACCENT_OPTIONS.map((opt) => {
            const selected = chosen === opt.color;
            return (
              <Pressable3D key={opt.color} onPress={() => setChosen(opt.color)} style={{ width: '25%', alignItems: 'center', marginBottom: 24 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ padding: 3, borderRadius: 40, borderWidth: selected ? 3 : 0, borderColor: '#FFFFFF' }}>
                    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: opt.color }} />
                  </View>
                  <Text style={{ fontSize: 12, color: DT.textPrimary, fontWeight: '700', marginTop: 8, textAlign: 'center' }}>{opt.name}</Text>
                </View>
              </Pressable3D>
            );
          })}
        </View>

        <View style={{ backgroundColor: DT.card, borderRadius: DT.radius.lg, padding: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 12, color: DT.textMuted, fontStyle: 'italic', marginBottom: 12 }}>Preview</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: DT.input, borderRadius: DT.radius.md, padding: 16, minWidth: 100, marginRight: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: chosen, letterSpacing: -1 }}>42</Text>
              <Text style={{ fontSize: 12, color: DT.textMuted, marginTop: 4 }}>Sample</Text>
            </View>
            <View style={{ backgroundColor: chosen, borderRadius: DT.radius.md, paddingHorizontal: 12, paddingVertical: 6, marginRight: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#1A1A1A' }}>BADGE</Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: chosen, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ color: '#1A1A1A', fontWeight: '900', fontSize: 14 }}>Go →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <DarkButton label="Let's Go" variant="accent" icon="arrow-forward" iconPosition="right" accent={chosen} onPress={handleContinue} style={{ marginTop: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
