/**
 * Super Admin Login — DT theme, lime accent, shield icon.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { DarkButton } from '../../components/ui';
import { DT } from '../../constants/darkTheme';

const SuperAdminLoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { clearSchoolTheme } = useSchoolTheme();
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await clearSchoolTheme();
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: DT.px, paddingTop: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: DT.card,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={DT.textPrimary} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="shield-checkmark" size={72} color={DT.lime} />
            <Text style={{ color: DT.textPrimary, fontSize: 36, fontWeight: '900', marginTop: 16, letterSpacing: -2 }}>Super Admin Portal</Text>
            <Text style={{ color: DT.textMuted, fontSize: 14, marginTop: 8, fontStyle: 'italic' }}>Authorized access only</Text>
          </View>

          <View style={{ marginTop: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DT.input, borderRadius: DT.radius.md, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: DT.border }}>
              <Ionicons name="mail-outline" size={20} color={DT.textMuted} style={{ marginRight: 12 }} />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: DT.textPrimary, paddingVertical: 0 }}
                placeholder="Admin email address"
                placeholderTextColor={DT.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DT.input, borderRadius: DT.radius.md, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: DT.border }}>
              <Ionicons name="lock-closed-outline" size={20} color={DT.textMuted} style={{ marginRight: 12 }} />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: DT.textPrimary, paddingVertical: 0 }}
                placeholder="Password"
                placeholderTextColor={DT.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={DT.textMuted} />
              </TouchableOpacity>
            </View>

            {error ? (
              <Text style={{ color: DT.danger, fontSize: 14, fontStyle: 'italic', marginBottom: 16 }}>{error}</Text>
            ) : null}

            <DarkButton label="Sign In" variant="accent" icon="arrow-forward" iconPosition="right" accent={DT.lime} onPress={handleLogin} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SuperAdminLoginScreen;
