/**
 * Admin — School Profile. Gradient header, info + branding cards, save (PD).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Image, Share, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Copy, Building2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { LightButton } from '../../components/ui';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;
const COLOR_SWATCHES = ['#1E40AF', '#065F46', '#7C3AED', '#DC2626', '#D97706', '#0E7490', '#2B5CE6'];
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function SchoolProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme, setSchoolTheme } = useSchoolTheme();
  const { userData } = useAuth();
  const primary = T.primary;
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(theme.schoolName || '');
  const [address, setAddress] = useState('');
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor || '#1E40AF');
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor || '#3B82F6');
  const [logoUri, setLogoUri] = useState<string | null>(theme.logoUrl || null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [schoolCode, setSchoolCode] = useState<string>((theme as any).schoolCode ?? '—');
  const [schoolCodeChangedAt, setSchoolCodeChangedAt] = useState<string | null>(null);
  const [changeCodeModalVisible, setChangeCodeModalVisible] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [changingCode, setChangingCode] = useState(false);
  const canUploadLogo = userData?.role === 'ADMIN' || userData?.role === 'PRINCIPAL';

  const loadSchool = useCallback(async () => {
    try {
      const res = (await API.get('/admin/school/info')) as any;
      const school = res?.data?.school ?? res?.school ?? res;
      if (school?.schoolCode != null) setSchoolCode(school.schoolCode);
      if (school?.schoolCodeChangedAt != null) setSchoolCodeChangedAt(school.schoolCodeChangedAt);
    } catch (_e) {
      setSchoolCode((theme as any).schoolCode ?? '—');
    }
  }, [theme]);

  useEffect(() => {
    loadSchool();
  }, [loadSchool]);

  const nextChangeAllowedAt = schoolCodeChangedAt
    ? new Date(new Date(schoolCodeChangedAt).getTime() + ONE_WEEK_MS)
    : null;
  const canChangeCode = !nextChangeAllowedAt || Date.now() >= nextChangeAllowedAt.getTime();

  const pickLogo = async () => {
    if (!canUploadLogo) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Gallery access is required to change logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', {
        uri,
        type: 'image/jpeg',
        name: 'logo.jpg',
      } as any);
      // Prefer the dedicated endpoint once the server implements it:
      // PATCH /api/v1/schools/:schoolId/logo (multipart/form-data, field: 'logo')
      const schoolId = (userData as any)?.schoolId || theme.schoolId;
      const axios = (apiClient as any).getAxiosInstance?.();
      if (!axios || !schoolId) throw new Error('Missing schoolId');
      const res = await axios.patch(`/schools/${encodeURIComponent(String(schoolId))}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const logoUrl =
        res?.data?.data?.logoUrl ??
        res?.data?.logoUrl ??
        res?.data?.data?.school?.logoUrl ??
        res?.data?.school?.logoUrl ??
        null;

      if (logoUrl) {
        setLogoUri(logoUrl);
        await setSchoolTheme({ ...theme, logoUrl });
        Alert.alert('Success', 'Logo updated successfully');
      } else {
        throw new Error('Upload did not return logoUrl');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await API.patch('/admin/school/profile', {
        name: name.trim() || undefined,
        primaryColor,
        secondaryColor,
      });
      setSchoolTheme({
        ...theme,
        schoolName: name.trim() || theme.schoolName,
        primaryColor,
        secondaryColor,
        logoUrl: theme.logoUrl,
        schoolId: theme.schoolId,
      });
      Alert.alert('Saved', 'School profile updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const copyCode = () => {
    if (schoolCode !== '—') {
      Share.share({ message: schoolCode, title: 'School code' }).catch(() => {});
    }
  };

  const handleChangeCode = async () => {
    const trimmed = newCodeInput.trim().toUpperCase();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 20) {
      Alert.alert('Invalid code', 'School code must be 3–20 characters (letters, numbers, hyphens).');
      return;
    }
    if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
      Alert.alert('Invalid code', 'School code can only contain letters, numbers, and hyphens.');
      return;
    }
    setChangingCode(true);
    try {
      const res = await API.patch('/admin/school/code', { newCode: trimmed }) as any;
      const updated = res?.data?.school ?? res?.school ?? res;
      if (updated?.schoolCode) {
        setSchoolCode(updated.schoolCode);
        setSchoolCodeChangedAt(updated.schoolCodeChangedAt ?? new Date().toISOString());
        setSchoolTheme({ ...theme, schoolCode: updated.schoolCode } as any);
      }
      setChangeCodeModalVisible(false);
      setNewCodeInput('');
      Alert.alert('Success', 'School code updated. You can change it again in 7 days.');
    } catch (e: any) {
      const msg = e?.message ?? e?.response?.data?.message ?? 'Failed to update school code';
      Alert.alert('Error', msg);
    } finally {
      setChangingCode(false);
    }
  };

  const initial = name.charAt(0).toUpperCase() || 'S';

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header (flat) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }} numberOfLines={1}>
              {theme.schoolName || 'Admin'}
            </Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>School Profile</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => {
                try {
                  navigation.navigate('Notifications');
                } catch (_e) {}
              }}
            >
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </Pressable>
            <Pressable
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => {
                try {
                  navigation.navigate('AdminProfile');
                } catch (_e) {}
              }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>{initial}</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <View style={{ width: 100, alignItems: 'center' }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: T.card,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                ...T.shadowSm,
              }}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={{ width: 100, height: 100, borderRadius: 50 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={34} color={T.primary} strokeWidth={1.8} />
                </View>
              )}
              {uploadingLogo ? (
                <View style={{ position: 'absolute', inset: 0 as any, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={T.primary} />
                </View>
              ) : null}
            </View>
            {canUploadLogo ? (
              <TouchableOpacity activeOpacity={0.85} onPress={pickLogo} style={{ marginTop: 10 }}>
                <Text style={{ color: T.primary, fontSize: 13, fontWeight: '800' }}>Change Logo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18 }} numberOfLines={1}>
              {name || 'School'}
            </Text>
            <Text style={{ color: T.textMuted, fontFamily: 'monospace', fontSize: 13, marginTop: 6 }}>{schoolCode}</Text>
            {!canUploadLogo ? (
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 10 }}>
                Logo updates are restricted to Admin/Principal.
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}>
        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 4, ...T.shadowSm }}>
          <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', marginBottom: 16 }}>School Information</Text>

          <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '900', marginBottom: 6 }}>School name</Text>
          <TextInput
            style={{
              backgroundColor: T.primaryLight,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: T.textDark,
              borderWidth: 1.5,
              borderColor: T.inputBorder,
              marginBottom: 12,
            }}
            placeholder="School name"
            placeholderTextColor={T.textPlaceholder}
            value={name}
            onChangeText={setName}
          />

          <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '900', marginBottom: 6 }}>Address</Text>
          <TextInput
            style={{
              backgroundColor: T.primaryLight,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: T.textDark,
              borderWidth: 1.5,
              borderColor: T.inputBorder,
              minHeight: 80,
              textAlignVertical: 'top',
              marginBottom: 12,
            }}
            placeholder="Address"
            placeholderTextColor={T.textPlaceholder}
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '900', marginBottom: 6 }}>School code</Text>
          <Pressable onPress={copyCode} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.primaryLight, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1.5, borderColor: T.inputBorder }}>
            <Text style={{ flex: 1, color: primary, fontVariant: ['tabular-nums'], fontSize: 16, fontWeight: '800' }}>{schoolCode}</Text>
            <Copy size={18} color={primary} strokeWidth={1.8} />
          </Pressable>
          {canChangeCode ? (
            <LightButton label="Change school code" variant="outline" icon="create-outline" iconPosition="left" onPress={() => setChangeCodeModalVisible(true)} fullWidth={false} style={{ marginBottom: 12 }} />
          ) : (
            <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginBottom: 12 }}>
              You can change the code again on {nextChangeAllowedAt?.toISOString().split('T')[0] ?? '—'} (once per week).
            </Text>
          )}
        </View>

        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 12, ...T.shadowSm }}>
          <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', marginBottom: 4 }}>Branding Colors</Text>
          <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginBottom: 16 }}>customize your school theme</Text>

          <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '900', marginBottom: 8 }}>PRIMARY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {COLOR_SWATCHES.map((c) => (
              <Pressable key={c} onPress={() => setPrimaryColor(c)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c, marginRight: 10, marginBottom: 8, borderWidth: primaryColor === c ? 3 : 0, borderColor: '#FFFFFF' }} />
            ))}
          </View>

          <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '900', marginBottom: 8 }}>SECONDARY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {COLOR_SWATCHES.map((c) => (
              <Pressable key={`s-${c}`} onPress={() => setSecondaryColor(c)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c, marginRight: 10, marginBottom: 8, borderWidth: secondaryColor === c ? 3 : 0, borderColor: '#FFFFFF' }} />
            ))}
          </View>

          <View style={{ backgroundColor: T.primaryLight, borderRadius: 14, padding: 12, marginTop: 12, borderWidth: 1.5, borderColor: T.inputBorder }}>
            <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginBottom: 8 }}>Preview</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: secondaryColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>S</Text>
              </View>
              <Text style={{ color: T.textDark, fontWeight: '900' }}>School theme</Text>
            </View>
          </View>
        </View>

        <LightButton label="Save Changes" variant="primary" icon="checkmark-circle-outline" iconPosition="left" onPress={save} loading={saving} style={{ marginTop: 20, marginBottom: 40 }} />
      </ScrollView>

      <Modal visible={changeCodeModalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setChangeCodeModalVisible(false)}>
          <Pressable style={{ backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }} onPress={(e) => e.stopPropagation()}>
            <Text style={{ color: T.textDark, fontSize: 20, fontWeight: '900', marginBottom: 4 }}>Change school code</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginBottom: 16 }}>3–20 characters, letters, numbers, hyphens. You can change once per week.</Text>
            <TextInput
              style={{
                backgroundColor: T.card,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: T.textDark,
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                marginBottom: 16,
              }}
              placeholder="e.g. MY-SCHOOL-01"
              placeholderTextColor={T.textPlaceholder}
              value={newCodeInput}
              onChangeText={(t) => setNewCodeInput(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={20}
            />
            <LightButton label="Update code" variant="primary" icon="checkmark-circle-outline" onPress={handleChangeCode} loading={changingCode} style={{ marginBottom: 8 }} />
            <LightButton label="Cancel" variant="ghost" onPress={() => { setChangeCodeModalVisible(false); setNewCodeInput(''); }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
