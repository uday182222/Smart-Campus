/**
 * Super Admin Login — light theme, gradient background, shield icon.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { T } from '../../constants/theme';

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
    <LinearGradient colors={T.bgGradient as any} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: T.px, paddingTop: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: T.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
                ...T.shadowSm,
              }}
            >
              <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <View style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}>
                <ShieldCheck size={42} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ color: T.textDark, fontSize: 32, fontWeight: '900', marginTop: 18, letterSpacing: -1.4 }}>Super Admin Portal</Text>
              <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 10 }}>Authorized access only</Text>
            </View>

            <View style={{ marginTop: 36 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: T.radius.lg, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1.5, borderColor: T.inputBorder, ...T.shadowSm }}>
                <Mail size={20} color={T.textPlaceholder} strokeWidth={1.8} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: T.textDark, paddingVertical: 0, marginLeft: 12 }}
                  placeholder="Admin email address"
                  placeholderTextColor={T.textPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: T.radius.lg, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1.5, borderColor: T.inputBorder, ...T.shadowSm }}>
                <Lock size={20} color={T.textPlaceholder} strokeWidth={1.8} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: T.textDark, paddingVertical: 0, marginLeft: 12 }}
                  placeholder="Password"
                  placeholderTextColor={T.textPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPassword ? <EyeOff size={20} color={T.textPlaceholder} strokeWidth={1.8} /> : <Eye size={20} color={T.textPlaceholder} strokeWidth={1.8} />}
                </TouchableOpacity>
              </View>

              {error ? <Text style={{ color: T.danger, fontSize: 13, marginBottom: 14 }}>{error}</Text> : null}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={loading}
                style={{
                  height: 52,
                  borderRadius: T.radius.full,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loading ? 0.7 : 1,
                  ...T.shadowSm,
                }}
              >
                <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 16 }}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SuperAdminLoginScreen;
