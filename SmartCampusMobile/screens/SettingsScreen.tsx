/**
 * Smart Campus — Settings (light theme).
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../services/AuthService';
import { LightHeader, LightInput, LightButton } from '../components/ui';
import { LT } from '../constants/lightTheme';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const getStrength = (p: string): 0 | 1 | 2 | 3 | 4 => {
    if (!p) return 0;
    if (p.length < 4) return 1;
    if (p.length < 6) return 2;
    if (p.length < 10) return 3;
    return 4;
  };
  const strength = getStrength(newPassword);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  /** weak | fair | good | strong — matches bar segments */
  const strengthColor = [LT.cardBorder, '#EF4444', '#F59E0B', '#22C55E', LT.primary][strength];

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setChanging(true);
    try {
      await AuthService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LT.bg }} edges={['top']}>
      <LightHeader title="Settings" showBack onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: LT.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 24 }}>Change Password</Text>
        <Text style={{ color: LT.textMuted, fontSize: 14, fontStyle: 'italic', marginTop: 4, marginBottom: 16 }}>
          Update your credentials
        </Text>

        <LightInput
          label="Current password"
          icon="lock-closed-outline"
          placeholder="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          isPassword
          autoCapitalize="none"
        />
        <LightInput
          label="New password"
          icon="lock-closed-outline"
          placeholder="New password (min 8 characters)"
          value={newPassword}
          onChangeText={setNewPassword}
          isPassword
          autoCapitalize="none"
        />
        {newPassword.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    marginRight: i < 4 ? 4 : 0,
                    backgroundColor: i <= strength ? strengthColor : LT.cardBorder,
                  }}
                />
              ))}
            </View>
            <Text style={{ color: LT.textMuted, fontSize: 12, marginBottom: 12 }}>{strengthLabel}</Text>
          </>
        )}
        <LightInput
          label="Confirm password"
          icon="lock-closed-outline"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          autoCapitalize="none"
        />

        <View style={{ marginTop: 8 }}>
          <LightButton
            label="Update Password"
            variant="primary"
            icon="checkmark-circle-outline"
            iconPosition="left"
            onPress={handleChangePassword}
            loading={changing}
          />
        </View>

        <Text style={{ color: LT.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 32 }}>About</Text>
        <Text style={{ color: LT.textMuted, fontSize: 12, marginTop: 4, marginBottom: 12 }}>App info and policies</Text>
        <View
          style={{
            backgroundColor: LT.card,
            borderRadius: 20,
            marginTop: 0,
            borderWidth: 1,
            borderColor: LT.cardBorder,
            ...LT.shadow,
          }}
        >
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: LT.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="information-circle-outline" size={18} color={LT.primary} />
            </View>
            <Text style={{ color: LT.textPrimary, fontSize: 15, flex: 1 }}>Version</Text>
            <Text style={{ color: LT.textMuted, fontSize: 14 }}>1.0.0</Text>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: LT.cardBorder, marginHorizontal: 16 }} />
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}
            onPress={() => Linking.openURL('https://example.com/terms').catch(() => {})}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: LT.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="document-text-outline" size={18} color={LT.primary} />
            </View>
            <Text style={{ color: LT.textPrimary, fontSize: 15, flex: 1 }}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={LT.primary} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: LT.cardBorder, marginHorizontal: 16 }} />
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}
            onPress={() => Linking.openURL('https://example.com/privacy').catch(() => {})}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: LT.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="shield-outline" size={18} color={LT.primary} />
            </View>
            <Text style={{ color: LT.textPrimary, fontSize: 15, flex: 1 }}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={LT.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
