/**
 * Super Admin — Create School: light theme (T tokens), section headers, success modal.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check, Share2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { T } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { SuperAdminFloatingNav } from '../../components/ui/SuperAdminFloatingNav';

const COLOR_SWATCHES = ['#1E40AF', '#065F46', '#7C3AED', '#DC2626', '#D97706', '#0E7490'];

export default function CreateSchoolScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12, backgroundColor: T.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>Create School</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: T.textDark, marginTop: 16 }}>School Details</Text>
        <Text style={{ fontSize: 14, color: T.textMuted, marginTop: 6, marginBottom: 16 }}>Fill in the information below</Text>

        <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', marginBottom: 6, letterSpacing: 0.8 }}>SCHOOL NAME *</Text>
        <TextInput
          style={{
            backgroundColor: T.card,
            borderRadius: T.radius.lg,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: T.textDark,
            borderWidth: 1.5,
            borderColor: inputFocused === 'name' ? T.primary : T.inputBorder,
            marginBottom: 16,
            ...T.shadowSm,
          }}
          placeholder="School name"
          placeholderTextColor={T.textPlaceholder}
          value={name}
          onChangeText={setName}
          onFocus={() => setInputFocused('name')}
          onBlur={() => setInputFocused(null)}
        />

        <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', marginBottom: 6, letterSpacing: 0.8 }}>ADDRESS (OPTIONAL)</Text>
        <TextInput
          style={{
            backgroundColor: T.card,
            borderRadius: T.radius.lg,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            color: T.textDark,
            borderWidth: 1.5,
            borderColor: inputFocused === 'address' ? T.primary : T.inputBorder,
            marginBottom: 24,
            minHeight: 80,
            textAlignVertical: 'top',
            ...T.shadowSm,
          }}
          placeholder="Address"
          placeholderTextColor={T.textPlaceholder}
          value={address}
          onChangeText={setAddress}
          multiline
          onFocus={() => setInputFocused('address')}
          onBlur={() => setInputFocused(null)}
        />

        <Text style={{ fontSize: 20, fontWeight: '900', color: T.textDark }}>School Colors</Text>
        <Text style={{ fontSize: 14, color: T.textMuted, marginTop: 6, marginBottom: 12 }}>Choose a theme for this school</Text>
        <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', marginBottom: 8, letterSpacing: 0.8 }}>PRIMARY</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {COLOR_SWATCHES.map((c) => (
            <TouchableOpacity key={c} onPress={() => setPrimaryColor(c)} style={{ marginRight: 12, marginBottom: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c, borderWidth: primaryColor === c ? 3 : 0, borderColor: '#FFFFFF' }} />
              <Text style={{ fontSize: 10, color: T.textMuted, marginTop: 4, textAlign: 'center' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', marginBottom: 8, letterSpacing: 0.8 }}>SECONDARY</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
          {COLOR_SWATCHES.map((c) => (
            <TouchableOpacity key={c} onPress={() => setSecondaryColor(c)} style={{ marginRight: 12, marginBottom: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c, borderWidth: secondaryColor === c ? 3 : 0, borderColor: '#FFFFFF' }} />
              <Text style={{ fontSize: 10, color: T.textMuted, marginTop: 4, textAlign: 'center' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, marginTop: 8, marginBottom: 24, ...T.shadowSm }}>
          <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 }}>PREVIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: primaryColor, marginRight: 12 }} />
            <Text style={{ flex: 1, color: T.textDark, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>{name || 'School Name'}</Text>
            <View style={{ backgroundColor: T.primaryLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderColor: T.primary }}>
              <Text style={{ color: T.primary, fontSize: 11, fontWeight: '900' }}>NEW</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={loading}
          onPress={handleCreate}
          style={{
            height: 52,
            borderRadius: T.radius.full,
            backgroundColor: T.primary,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            opacity: loading ? 0.7 : 1,
            ...T.shadowSm,
          }}
        >
          <Check size={20} color={T.textWhite} strokeWidth={1.8} />
          <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 16 }}>{loading ? 'Creating…' : 'Create School'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!successModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, ...T.shadowLg }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 }}>
              <Check size={32} color={T.textWhite} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: T.textDark, textAlign: 'center' }}>School Created</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: T.textDark, textAlign: 'center', marginTop: 8 }}>{successModal?.schoolName}</Text>
            <View style={{ backgroundColor: T.bg, borderRadius: T.radius.xxl, padding: 16, marginTop: 16, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', letterSpacing: 0.8 }}>SCHOOL CODE</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: T.primary, fontVariant: ['tabular-nums'], marginTop: 6 }}>{successModal?.schoolCode}</Text>
            </View>
            <View style={{ backgroundColor: T.bg, borderRadius: T.radius.xxl, padding: 16, marginTop: 12, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', letterSpacing: 0.8 }}>ADMIN EMAIL</Text>
              <Text style={{ fontSize: 15, color: T.textDark, marginTop: 6, fontWeight: '700' }}>{successModal?.adminEmail}</Text>
              <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', letterSpacing: 0.8, marginTop: 12 }}>PASSWORD</Text>
              <Text style={{ fontSize: 15, color: T.textDark, fontVariant: ['tabular-nums'], marginTop: 6, fontWeight: '700' }}>{successModal?.adminPassword}</Text>
            </View>
            <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 12, textAlign: 'center' }}>Save this — shown only once</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={copyAll}
              style={{ marginTop: 18, height: 48, borderRadius: T.radius.full, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, ...T.shadowSm }}
            >
              <Share2 size={18} color={T.primary} strokeWidth={1.8} />
              <Text style={{ color: T.primary, fontWeight: '900' }}>Share Credentials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setSuccessModal(null);
                navigation.navigate('SchoolManagement');
              }}
              style={{ marginTop: 10, height: 48, borderRadius: T.radius.full, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, ...T.shadowSm }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>Done</Text>
              <Check size={18} color={T.textWhite} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SuperAdminFloatingNav navigation={navigation} activeTab="CreateSchool" />
    </SafeAreaView>
  );
}
