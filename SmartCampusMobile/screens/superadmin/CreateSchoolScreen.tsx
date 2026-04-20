/**
 * Super Admin — Create School: DT theme, section headers, focus border, success modal.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSuperAdminAccent } from '../../hooks/useSuperAdminAccent';
import { DarkHeader, DarkButton } from '../../components/ui';
import { DT } from '../../constants/darkTheme';
import apiClient from '../../services/apiClient';

const COLOR_SWATCHES = ['#1E40AF', '#065F46', '#7C3AED', '#DC2626', '#D97706', '#0E7490'];

export default function CreateSchoolScreen() {
  const navigation = useNavigation<any>();
  const { accent } = useSuperAdminAccent();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1E40AF');
  const [secondaryColor, setSecondaryColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    schoolName: string;
    schoolCode: string;
    adminEmail: string;
    adminPassword: string;
  } | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'School name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: { school: any; adminCredentials: { email: string; password: string } } }>('/superadmin/schools', {
        name: name.trim(),
        address: address.trim() || undefined,
        primaryColor,
        secondaryColor,
      });
      const data = (res as any)?.data;
      if (data?.school && data?.adminCredentials) {
        setSuccessModal({
          schoolName: data.school.name,
          schoolCode: data.school.schoolCode ?? '',
          adminEmail: data.adminCredentials.email,
          adminPassword: data.adminCredentials.password,
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!successModal) return;
    const text = `School: ${successModal.schoolName}\nCode: ${successModal.schoolCode}\nAdmin Email: ${successModal.adminEmail}\nAdmin Password: ${successModal.adminPassword}`;
    try {
      await Share.share({ message: text, title: 'School credentials' });
    } catch (_e) {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
      <DarkHeader
        title="New School"
        showBack
        onBackPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
        accent={accent}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: DT.px, paddingBottom: 40 }} style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: DT.textPrimary, marginTop: 16 }}>School Details</Text>
        <Text style={{ fontSize: 14, color: DT.textMuted, fontStyle: 'italic', marginTop: 4, marginBottom: 16 }}>fill in the information below</Text>

        <Text style={{ fontSize: 12, color: DT.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>School name *</Text>
        <TextInput
          style={{
            backgroundColor: DT.input,
            borderRadius: DT.radius.md,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: DT.textPrimary,
            borderWidth: 1,
            borderColor: inputFocused === 'name' ? accent : DT.border,
            marginBottom: 16,
          }}
          placeholder="School name"
          placeholderTextColor={DT.textMuted}
          value={name}
          onChangeText={setName}
          onFocus={() => setInputFocused('name')}
          onBlur={() => setInputFocused(null)}
        />

        <Text style={{ fontSize: 12, color: DT.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Address (optional)</Text>
        <TextInput
          style={{
            backgroundColor: DT.input,
            borderRadius: DT.radius.md,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: DT.textPrimary,
            borderWidth: 1,
            borderColor: inputFocused === 'address' ? accent : DT.border,
            marginBottom: 24,
            minHeight: 80,
            textAlignVertical: 'top',
          }}
          placeholder="Address"
          placeholderTextColor={DT.textMuted}
          value={address}
          onChangeText={setAddress}
          multiline
          onFocus={() => setInputFocused('address')}
          onBlur={() => setInputFocused(null)}
        />

        <Text style={{ fontSize: 20, fontWeight: '900', color: DT.textPrimary }}>School Colors</Text>
        <Text style={{ fontSize: 14, color: DT.textMuted, fontStyle: 'italic', marginTop: 4, marginBottom: 12 }}>choose a theme for this school</Text>
        <Text style={{ fontSize: 12, color: DT.textMuted, marginBottom: 8 }}>Primary</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {COLOR_SWATCHES.map((c) => (
            <TouchableOpacity key={c} onPress={() => setPrimaryColor(c)} style={{ marginRight: 12, marginBottom: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c, borderWidth: primaryColor === c ? 3 : 0, borderColor: '#FFFFFF' }} />
              <Text style={{ fontSize: 10, color: DT.textMuted, marginTop: 4, textAlign: 'center' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 12, color: DT.textMuted, marginBottom: 8 }}>Secondary</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
          {COLOR_SWATCHES.map((c) => (
            <TouchableOpacity key={c} onPress={() => setSecondaryColor(c)} style={{ marginRight: 12, marginBottom: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c, borderWidth: secondaryColor === c ? 3 : 0, borderColor: '#FFFFFF' }} />
              <Text style={{ fontSize: 10, color: DT.textMuted, marginTop: 4, textAlign: 'center' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: DT.card, borderRadius: DT.radius.lg, padding: 16, marginTop: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 12, color: DT.textMuted, fontStyle: 'italic', marginBottom: 8 }}>Preview</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: primaryColor, marginRight: 12 }} />
            <Text style={{ flex: 1, color: DT.textPrimary, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>{name || 'School Name'}</Text>
            <View style={{ backgroundColor: DT.lime, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#1A1A1A', fontSize: 11, fontWeight: '800' }}>NEW</Text>
            </View>
          </View>
        </View>

        <DarkButton label="Create School" variant="accent" icon="checkmark-circle-outline" iconPosition="left" accent={accent} onPress={handleCreate} loading={loading} />
      </ScrollView>

      <Modal visible={!!successModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: DT.card, borderRadius: 24, padding: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: accent, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 }}>
              <Ionicons name="checkmark" size={36} color="#1A1A1A" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: DT.textPrimary, textAlign: 'center' }}>School Created!</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: DT.textPrimary, textAlign: 'center', marginTop: 8 }}>{successModal?.schoolName}</Text>
            <View style={{ backgroundColor: DT.input, borderRadius: 12, padding: 16, marginTop: 16 }}>
              <Text style={{ fontSize: 12, color: DT.textMuted, fontStyle: 'italic' }}>School Code</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: accent, fontVariant: ['tabular-nums'], marginTop: 4 }}>{successModal?.schoolCode}</Text>
            </View>
            <View style={{ backgroundColor: DT.input, borderRadius: 12, padding: 16, marginTop: 12 }}>
              <Text style={{ fontSize: 12, color: DT.textMuted }}>Admin Email</Text>
              <Text style={{ fontSize: 15, color: DT.textPrimary, marginTop: 2 }}>{successModal?.adminEmail}</Text>
              <Text style={{ fontSize: 12, color: DT.textMuted, marginTop: 8 }}>Password</Text>
              <Text style={{ fontSize: 15, color: DT.textPrimary, fontVariant: ['tabular-nums'], marginTop: 2 }}>{successModal?.adminPassword}</Text>
            </View>
            <Text style={{ fontSize: 11, color: DT.textMuted, fontStyle: 'italic', marginTop: 12, textAlign: 'center' }}>⚠️ Save this — shown only once</Text>
            <DarkButton label="Share Credentials" variant="outline-accent" icon="share-outline" iconPosition="left" accent={accent} onPress={copyAll} style={{ marginTop: 20 }} />
            <DarkButton label="Done" variant="accent" icon="checkmark" iconPosition="right" accent={accent} onPress={() => { setSuccessModal(null); navigation.navigate('SchoolManagement'); }} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
