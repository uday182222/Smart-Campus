// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GraduationCap,
  ArrowRight,
  User,
  Lock,
  Eye,
  EyeOff,
  Home,
  CheckCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { apiClient } from '../services/apiClient';
import { T } from '../constants/theme';

const { width } = Dimensions.get('window');

// ── LOGO COMPONENT ──────────────────────────────────────────────────
function AppLogo() {
  return (
    <View style={{ alignItems: 'center', marginTop: 36 }}>
      {/* Frosted circle */}
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: 'rgba(255,255,255,0.65)',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.95)',
          alignItems: 'center',
          justifyContent: 'center',
          ...T.shadowMd,
        }}
      >
        <GraduationCap size={46} color={T.primary} strokeWidth={1.8} />
      </View>
      {/* App name */}
      <Text
        style={{
          ...T.font.appTitle,
          color: T.primary,
          marginTop: 14,
        }}
      >
        Smart Campus
      </Text>
      {/* Tagline */}
      <Text
        style={{
          ...T.font.body,
          color: T.textMuted,
          marginTop: 5,
          letterSpacing: 0.1,
        }}
      >
        Connecting Schools, Empowering Education
      </Text>
    </View>
  );
}

// ── STEP INDICATOR ──────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 }}>
      <View
        style={{
          width: step === 1 ? 32 : 16,
          height: 6,
          borderRadius: 3,
          backgroundColor: step === 1 ? T.primary : T.success,
        }}
      />
      <View
        style={{
          width: step === 2 ? 32 : 16,
          height: 6,
          borderRadius: 3,
          backgroundColor: step === 2 ? T.primary : T.inputBorder,
        }}
      />
      <Text style={{ ...T.font.step, color: T.textBody, marginLeft: 4 }}>Step {step} of 2</Text>
    </View>
  );
}

// ── INPUT COMPONENT ─────────────────────────────────────────────────
function LInput({
  label,
  placeholder,
  value,
  onChangeText,
  icon: Icon,
  isPassword,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: any) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ ...T.font.label, color: T.textDark, marginBottom: 8 }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: T.card,
          borderRadius: T.radius.lg,
          borderWidth: 1.5,
          borderColor: focused ? T.inputBorderActive : T.inputBorder,
          height: 52,
          paddingHorizontal: 14,
        }}
      >
        {Icon && (
          <Icon
            size={18}
            color={focused ? T.primary : T.textPlaceholder}
            strokeWidth={1.8}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.textPlaceholder}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            ...T.font.inputFilled,
            color: T.textDark,
          }}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={18} color={T.textPlaceholder} strokeWidth={1.8} />
            ) : (
              <Eye size={18} color={T.textPlaceholder} strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── MAIN SCREEN ─────────────────────────────────────────────────────
export default function ProductionLoginScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { setSchoolTheme } = useSchoolTheme();

  // Step 1 state
  const [step, setStep] = useState<1 | 2>(1);
  const [schoolCode, setSchoolCode] = useState('');
  const [school, setSchool] = useState<any>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolError, setSchoolError] = useState('');

  // Step 2 state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Super admin tap counter
  const tapCount = useRef(0);
  const tapTimer = useRef<any>(null);

  // Card slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleTitleTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 2000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      navigation.navigate('SuperAdminLogin');
    }
  };

  // ── STEP 1: Verify school ────────────────────────────────────────
  const handleVerifySchool = async () => {
    if (!schoolCode.trim()) {
      setSchoolError('Please enter a school code');
      return;
    }
    setSchoolLoading(true);
    setSchoolError('');
    try {
      const code = schoolCode.trim().toUpperCase();
      const payload = await apiClient.get(`/schools/code/${encodeURIComponent(code)}`);
      const schoolData = payload?.data ?? payload;
      if (!schoolData?.id) throw new Error('School not found');
      setSchool(schoolData);
      await setSchoolTheme({
        schoolId: schoolData.id,
        schoolName: schoolData.name || 'School',
        logoUrl: schoolData.logoUrl ?? null,
        primaryColor: schoolData.primaryColor || T.primary,
        secondaryColor: schoolData.secondaryColor || T.success,
      });
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setStep(2);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } catch (e: any) {
      setSchoolError(e?.message || e?.response?.data?.message || 'Invalid school code. Please check and try again.');
    } finally {
      setSchoolLoading(false);
    }
  };

  // ── STEP 2: Login ────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter your email and password');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(email.trim(), password, school?.id);
    } catch (e: any) {
      setLoginError(e?.message || e?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const schoolInitial = school?.name?.charAt(0)?.toUpperCase() || 'S';

  return (
    <LinearGradient
      colors={T.bgGradient}
      locations={[0, 0.45, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Decorative blob */}
      <View
        style={{
          position: 'absolute',
          top: -60,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: 'rgba(30,63,160,0.07)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 80,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: 'rgba(30,63,160,0.05)',
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo — tappable for super admin */}
          <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
            <AppLogo />
          </TouchableOpacity>

          {/* Step indicator */}
          <View style={{ alignItems: 'center' }}>
            <StepIndicator step={step} />
          </View>

          {/* Animated card */}
          <Animated.View
            style={{
              transform: [{ translateX: slideAnim }],
              marginHorizontal: T.px,
              marginTop: 16,
              backgroundColor: T.cardBg,
              borderRadius: T.radius.xxl,
              padding: 22,
              borderWidth: 1.5,
              borderColor: T.cardBorder,
              ...T.shadowLg,
            }}
          >
            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                <Text style={{ ...T.font.cardTitle, color: T.textDark }}>Find Your School</Text>
                <Text style={{ ...T.font.body, color: T.textMuted, marginTop: 4, marginBottom: 20 }}>
                  Enter the code provided by your school admin
                </Text>

                <LInput
                  label="School Code"
                  placeholder="e.g. SCH-DEMO-01"
                  value={schoolCode}
                  onChangeText={(t: string) => {
                    setSchoolCode(t);
                    setSchoolError('');
                  }}
                  icon={Home}
                  autoCapitalize="characters"
                />

                {/* Error */}
                {schoolError ? (
                  <Text style={{ ...T.font.body, color: T.danger, marginTop: -8, marginBottom: 12 }}>{schoolError}</Text>
                ) : null}

                {/* Verified school card */}
                {school && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: T.primaryLight,
                      borderRadius: T.radius.lg,
                      padding: 14,
                      marginBottom: 16,
                      borderWidth: 1.5,
                      borderColor: T.inputBorder,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: T.radius.md,
                        backgroundColor: T.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '900', color: T.textWhite }}>{schoolInitial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...T.font.schoolName, color: T.textDark }}>{school.name}</Text>
                      <Text style={{ ...T.font.badge, color: T.textMuted, marginTop: 3 }}>Verified · Active</Text>
                    </View>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: T.successTint,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle size={14} color={T.success} strokeWidth={2.5} />
                    </View>
                  </View>
                )}

                {/* Continue button */}
                <TouchableOpacity
                  onPress={handleVerifySchool}
                  disabled={schoolLoading}
                  style={{
                    backgroundColor: T.primary,
                    borderRadius: T.radius.lg,
                    height: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    ...T.shadowMd,
                  }}
                >
                  {schoolLoading ? (
                    <ActivityIndicator color={T.textWhite} />
                  ) : (
                    <>
                      <Text style={{ ...T.font.buttonLabel, color: T.textWhite }}>
                        {school ? 'Continue' : 'Find School'}
                      </Text>
                      <ArrowRight size={16} color={T.textWhite} strokeWidth={2.5} />
                    </>
                  )}
                </TouchableOpacity>

                <Text style={{ ...T.font.helper, color: T.textMuted, textAlign: 'center', marginTop: 16 }}>
                  Don't have an account?{' '}
                  <Text style={{ ...T.font.link, color: T.primary }} onPress={() => navigation.navigate('Registration')}>
                    Register here
                  </Text>
                </Text>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                {/* School confirmed pill */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: T.primaryLight,
                    borderRadius: T.radius.lg,
                    padding: 12,
                    paddingHorizontal: 14,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: T.inputBorder,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: T.radius.md,
                      backgroundColor: T.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '900', color: T.textWhite }}>{schoolInitial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...T.font.schoolName, color: T.textDark }}>{school?.name}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: T.textMuted, marginTop: 2 }}>
                      {schoolCode.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setStep(1);
                      setLoginError('');
                    }}
                  >
                    <Text style={{ ...T.font.link, color: T.primary, textDecorationLine: 'underline' }}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ ...T.font.cardTitle, color: T.textDark }}>Welcome Back</Text>
                <Text style={{ ...T.font.body, color: T.textMuted, marginTop: 4, marginBottom: 20 }}>
                  Enter your credentials to continue
                </Text>

                <LInput
                  label="Email / User ID"
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={(t: string) => {
                    setEmail(t);
                    setLoginError('');
                  }}
                  icon={User}
                  keyboardType="email-address"
                />

                <LInput
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(t: string) => {
                    setPassword(t);
                    setLoginError('');
                  }}
                  icon={Lock}
                  isPassword
                />

                {/* Error */}
                {loginError ? (
                  <Text style={{ ...T.font.body, color: T.danger, marginTop: -8, marginBottom: 12 }}>{loginError}</Text>
                ) : null}

                {/* Remember + Forgot */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setRememberMe(!rememberMe)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        borderWidth: 1.5,
                        borderColor: rememberMe ? T.primary : T.inputBorder,
                        backgroundColor: rememberMe ? T.primary : T.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {rememberMe && <CheckCircle size={11} color={T.textWhite} strokeWidth={3} />}
                    </View>
                    <Text style={{ ...T.font.body, color: T.textDark, fontWeight: '500' }}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={{ ...T.font.link, color: T.danger }}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Login button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loginLoading}
                  style={{
                    backgroundColor: T.primary,
                    borderRadius: T.radius.lg,
                    height: 52,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...T.shadowMd,
                  }}
                >
                  {loginLoading ? (
                    <ActivityIndicator color={T.textWhite} />
                  ) : (
                    <Text style={{ ...T.font.buttonLabel, color: T.textWhite }}>Login Into Your Account</Text>
                  )}
                </TouchableOpacity>

                <Text style={{ ...T.font.helper, color: T.textMuted, textAlign: 'center', marginTop: 16 }}>
                  Don't have an account?{' '}
                  <Text style={{ ...T.font.link, color: T.primary }} onPress={() => navigation.navigate('Registration')}>
                    Sign Up
                  </Text>
                </Text>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
