// @ts-nocheck
/**
 * Smart Campus — Registration. Visual system matches ProductionLoginScreen (T + Lucide).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GraduationCap,
  CheckCircle,
  ChevronDown,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Home,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Calendar,
  Clock,
  X,
} from 'lucide-react-native';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../services/apiClient';
import { T } from '../constants/theme';

const API = apiClient as any;

function AppLogo() {
  return (
    <View style={{ alignItems: 'center', marginTop: 36 }}>
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
      <Text style={{ ...T.font.appTitle, color: T.primary, marginTop: 14 }}>Smart Campus</Text>
      <Text style={{ ...T.font.body, color: T.textMuted, marginTop: 5, letterSpacing: 0.1 }}>
        Connecting Schools, Empowering Education
      </Text>
    </View>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 18,
        justifyContent: 'center',
      }}
    >
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={{
            width: step === s ? 32 : 16,
            height: 6,
            borderRadius: 3,
            backgroundColor: s < step ? T.success : s === step ? T.primary : T.inputBorder,
          }}
        />
      ))}
      <Text style={{ ...T.font.step, color: T.textBody, marginLeft: 4 }}>Step {step} of 3</Text>
    </View>
  );
}

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

export default function RegistrationScreen() {
  const { theme, setSchoolTheme } = useSchoolTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolVerified, setSchoolVerified] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState<{
    id: string;
    name: string;
    section: string;
    roomNumber?: string;
  } | null>(null);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [statusResult, setStatusResult] = useState<{ status?: string; adminNote?: string } | null>(null);
  const [availableClasses, setAvailableClasses] = useState<
    Array<{ id: string; name: string; section: string; roomNumber?: string }>
  >([]);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!submitted) return;
    successScale.setValue(0);
    Animated.spring(successScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [submitted, successScale]);

  const verifySchool = async () => {
    setError('');
    const code = schoolCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter school code');
      return;
    }
    setLoading(true);
    try {
      const res = await API.get(`/schools/code/${encodeURIComponent(code)}`);
      const data = (res as any)?.data ?? res;
      if (data?.id) {
        await setSchoolTheme({
          schoolId: data.id,
          schoolName: data.name || 'School',
          logoUrl: data.logoUrl ?? null,
          primaryColor: data.primaryColor || T.primary,
          secondaryColor: data.secondaryColor || T.success,
        });
        try {
          const classesRes = await API.get(`/schools/code/${encodeURIComponent(code)}/classes`);
          const classesData = (classesRes as any)?.data ?? classesRes;
          setAvailableClasses(classesData?.data || []);
        } catch (_e) {
          setAvailableClasses([]);
        }
        setSchoolVerified(true);
        setStep(2);
      } else {
        setError('Invalid school code');
      }
    } catch (_e) {
      setError('Invalid school code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep2 = () => {
    setError('');
    if (!studentName.trim()) {
      setError('Please enter student name');
      return;
    }
    if (!selectedClass) {
      setError('Please select class/grade');
      return;
    }
    setStep(3);
  };

  const submitRequest = async () => {
    setError('');
    if (!parentName.trim()) {
      setError('Please enter parent/guardian name');
      return;
    }
    if (!parentEmail.trim()) {
      setError('Please enter email');
      return;
    }
    if (!parentPhone.trim()) {
      setError('Please enter phone number');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      setError('Please confirm the information is correct');
      return;
    }
    setLoading(true);
    try {
      await API.post('/registration/request', {
        schoolCode: schoolCode.trim().toUpperCase(),
        studentName: studentName.trim(),
        classId: selectedClass?.id,
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        parentPhone: parentPhone.trim(),
        password,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await API.get(
        `/registration/status/${encodeURIComponent(parentEmail.trim())}/${encodeURIComponent(schoolCode.trim().toUpperCase())}`
      );
      const data = (res as any)?.data ?? res;
      setStatusResult(data || null);
    } catch (_e) {
      setError('Could not fetch status');
    } finally {
      setLoading(false);
    }
  };

  const schoolInitial = theme.schoolName?.charAt(0)?.toUpperCase() || 'S';

  const statusTone = (s?: string) => {
    const u = (s || '').toUpperCase();
    if (u.includes('APPROV') || u.includes('ACCEPT')) return { bg: T.successTint, fg: T.success };
    if (u.includes('REJECT') || u.includes('DEN')) return { bg: T.dangerTint, fg: T.danger };
    return { bg: T.primaryTint, fg: T.primary };
  };

  if (submitted) {
    return (
      <LinearGradient
        colors={['#C7D2FE', '#EEF2FF', '#E0E7FF'] as const}
        locations={[0, 0.45, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="dark-content" />
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
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: 'rgba(30,63,160,0.05)',
          }}
        />

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: T.px,
            alignItems: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              transform: [{ scale: successScale }],
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: T.successTint,
              borderWidth: 2,
              borderColor: T.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={40} color={T.success} strokeWidth={2} />
          </Animated.View>

          <Text style={{ ...T.font.appTitle, color: T.textDark, textAlign: 'center', marginTop: 20 }}>
            Request Submitted!
          </Text>
          <Text
            style={{
              ...T.font.body,
              color: T.textMuted,
              textAlign: 'center',
              marginTop: 8,
              paddingHorizontal: 20,
            }}
          >
            We'll notify you once your account is approved by the school admin
          </Text>

          <View
            style={{
              ...T.shadowMd,
              marginHorizontal: 0,
              marginTop: 24,
              padding: 20,
              borderRadius: T.radius.xxl,
              backgroundColor: T.card,
              width: '100%',
              borderWidth: 1.5,
              borderColor: T.cardBorder,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: T.radius.md,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '900', color: T.textWhite }}>{schoolInitial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...T.font.schoolName, color: T.textDark }}>{theme.schoolName || 'School'}</Text>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 6,
                    backgroundColor: T.warningTint,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: T.radius.sm,
                  }}
                >
                  <Text style={{ ...T.font.badge, color: T.warning }}>Pending approval</Text>
                </View>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: T.inputBorder, marginVertical: 16 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Calendar size={18} color={T.textMuted} strokeWidth={1.8} />
              <Text style={{ ...T.font.body, color: T.textMuted, flex: 1 }}>
                Processing time: 1-2 business days
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 24, width: '100%', gap: 12 }}>
            <TouchableOpacity
              onPress={checkStatus}
              disabled={loading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 52,
                borderRadius: T.radius.lg,
                borderWidth: 2,
                borderColor: T.primary,
                backgroundColor: 'transparent',
              }}
            >
              {loading ? (
                <ActivityIndicator color={T.primary} />
              ) : (
                <>
                  <Clock size={18} color={T.primary} strokeWidth={2} />
                  <Text style={{ ...T.font.buttonLabel, color: T.primary }}>Check Status</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={{
                height: 52,
                borderRadius: T.radius.lg,
                backgroundColor: T.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...T.font.buttonLabel, color: T.primary }}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {statusResult?.status ? (
            <View
              style={{
                marginTop: 16,
                width: '100%',
                backgroundColor: T.card,
                borderRadius: T.radius.lg,
                padding: 16,
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: T.radius.sm,
                  backgroundColor: statusTone(statusResult.status).bg,
                }}
              >
                <Text style={{ ...T.font.badge, color: statusTone(statusResult.status).fg }}>
                  {statusResult.status}
                </Text>
              </View>
              {statusResult.adminNote ? (
                <Text style={{ ...T.font.body, color: T.textMuted, marginTop: 10 }}>Note: {statusResult.adminNote}</Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#C7D2FE', '#EEF2FF', '#E0E7FF'] as const}
      locations={[0, 0.45, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" />

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
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: 'rgba(30,63,160,0.05)',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AppLogo />
          <StepIndicator step={step} />

          <View
            style={{
              marginHorizontal: T.px,
              marginTop: 16,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: T.radius.xxl,
              padding: 22,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.95)',
              ...T.shadowLg,
            }}
          >
            {error ? (
              <Text style={{ ...T.font.body, color: T.danger, marginBottom: 12 }}>{error}</Text>
            ) : null}

            {step === 2 && (
              <TouchableOpacity
                onPress={() => {
                  setStep(1);
                  setError('');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
              >
                <ArrowLeft size={18} color={T.primary} strokeWidth={2} />
                <Text style={{ ...T.font.link, color: T.primary }}>Back</Text>
              </TouchableOpacity>
            )}

            {step === 3 && (
              <TouchableOpacity
                onPress={() => {
                  setStep(2);
                  setError('');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
              >
                <ArrowLeft size={18} color={T.primary} strokeWidth={2} />
                <Text style={{ ...T.font.link, color: T.primary }}>Back</Text>
              </TouchableOpacity>
            )}

            {step === 1 && (
              <>
                <Text style={{ ...T.font.cardTitle, color: T.textDark }}>Create Account</Text>
                <Text style={{ ...T.font.body, color: T.textMuted, marginTop: 4, marginBottom: 20 }}>
                  Enter your school code
                </Text>
                <LInput
                  label="School Code"
                  placeholder="e.g. SCH-DEMO-01"
                  value={schoolCode}
                  onChangeText={(t: string) => {
                    setSchoolCode(t);
                    setError('');
                  }}
                  icon={Home}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  onPress={verifySchool}
                  disabled={loading}
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
                  {loading ? (
                    <ActivityIndicator color={T.textWhite} />
                  ) : (
                    <Text style={{ ...T.font.buttonLabel, color: T.textWhite }}>Verify School</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={{ ...T.font.cardTitle, color: T.textDark }}>Student Details</Text>
                <Text style={{ ...T.font.body, color: T.textMuted, marginTop: 4, marginBottom: 20 }}>
                  Tell us about your child
                </Text>
                <LInput
                  label="Student Full Name"
                  placeholder="Enter student name"
                  value={studentName}
                  onChangeText={(t: string) => {
                    setStudentName(t);
                    setError('');
                  }}
                  icon={User}
                />
                <Text style={{ ...T.font.label, color: T.textDark, marginBottom: 8 }}>Select Class</Text>
                <TouchableOpacity
                  onPress={() => setShowClassPicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: T.card,
                    borderRadius: T.radius.lg,
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                    height: 52,
                    paddingHorizontal: 14,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      ...(selectedClass ? T.font.inputFilled : T.font.inputPlaceholder),
                      color: selectedClass ? T.textDark : T.textPlaceholder,
                      flex: 1,
                    }}
                  >
                    {selectedClass
                      ? `${selectedClass.name}${selectedClass.section ? ` - Section ${selectedClass.section}` : ''}`
                      : 'Select Class'}
                  </Text>
                  <ChevronDown size={18} color={T.textMuted} strokeWidth={1.8} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={nextStep2}
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
                  <Text style={{ ...T.font.buttonLabel, color: T.textWhite }}>Continue</Text>
                  <ArrowRight size={16} color={T.textWhite} strokeWidth={2.5} />
                </TouchableOpacity>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={{ ...T.font.cardTitle, color: T.textDark }}>Parent Details</Text>
                <Text style={{ ...T.font.body, color: T.textMuted, marginTop: 4, marginBottom: 20 }}>
                  Your contact information
                </Text>
                <LInput
                  label="Parent Full Name"
                  placeholder="Parent full name"
                  value={parentName}
                  onChangeText={(t: string) => {
                    setParentName(t);
                    setError('');
                  }}
                  icon={User}
                />
                <LInput
                  label="Email Address"
                  placeholder="Email"
                  value={parentEmail}
                  onChangeText={(t: string) => {
                    setParentEmail(t);
                    setError('');
                  }}
                  icon={Mail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <LInput
                  label="Phone Number"
                  placeholder="Phone"
                  value={parentPhone}
                  onChangeText={(t: string) => {
                    setParentPhone(t);
                    setError('');
                  }}
                  icon={Phone}
                  keyboardType="phone-pad"
                />
                <LInput
                  label="Password"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChangeText={(t: string) => {
                    setPassword(t);
                    setError('');
                  }}
                  icon={Lock}
                  isPassword
                />
                <LInput
                  label="Confirm Password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={(t: string) => {
                    setConfirmPassword(t);
                    setError('');
                  }}
                  icon={Lock}
                  isPassword
                />
                <TouchableOpacity
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      borderWidth: 1.5,
                      borderColor: termsAccepted ? T.primary : T.inputBorder,
                      backgroundColor: termsAccepted ? T.primary : T.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {termsAccepted ? (
                      <CheckCircle size={11} color={T.textWhite} strokeWidth={3} />
                    ) : null}
                  </View>
                  <Text style={{ ...T.font.body, color: T.textDark, flex: 1, fontWeight: '500' }}>
                    I confirm the information is correct
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitRequest}
                  disabled={loading}
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
                  {loading ? (
                    <ActivityIndicator color={T.textWhite} />
                  ) : (
                    <>
                      <UserPlus size={18} color={T.textWhite} strokeWidth={2} />
                      <Text style={{ ...T.font.buttonLabel, color: T.textWhite }}>Submit Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {step === 1 && (
            <Text style={{ ...T.font.helper, color: T.textMuted, textAlign: 'center', marginTop: 16 }}>
              Already have an account?{' '}
              <Text style={{ ...T.font.link, color: T.primary }} onPress={() => navigation.navigate('Login')}>
                Login
              </Text>
            </Text>
          )}
        </ScrollView>

        {showClassPicker && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowClassPicker(false)} />
            <View
              style={{
                backgroundColor: T.card,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: 420,
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 24,
                borderWidth: 1.5,
                borderColor: T.inputBorder,
              }}
            >
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: T.inputBorder,
                  marginBottom: 16,
                }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text style={{ ...T.font.cardTitle, color: T.textDark }}>Select Class</Text>
                <TouchableOpacity onPress={() => setShowClassPicker(false)} hitSlop={12}>
                  <X size={22} color={T.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {availableClasses.map((c) => {
                  const sel = selectedClass?.id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setSelectedClass(c);
                        setShowClassPicker(false);
                      }}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: T.inputBorder,
                        backgroundColor: sel ? T.primaryLight : 'transparent',
                        borderLeftWidth: sel ? 3 : 0,
                        borderLeftColor: sel ? T.primary : 'transparent',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ ...T.font.schoolName, color: T.textDark }}>{c.name}</Text>
                          {c.section ? (
                            <View
                              style={{
                                alignSelf: 'flex-start',
                                marginTop: 6,
                                backgroundColor: T.primaryLight,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: T.radius.sm,
                              }}
                            >
                              <Text style={{ ...T.font.badge, color: T.primary }}>Section {c.section}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          {c.roomNumber ? (
                            <Text style={{ ...T.font.body, color: T.textMuted }}>Room {c.roomNumber}</Text>
                          ) : null}
                          {sel ? (
                            <CheckCircle size={20} color={T.success} strokeWidth={2} style={{ marginTop: 4 }} />
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {availableClasses.length === 0 ? (
                  <Text
                    style={{ ...T.font.body, color: T.textMuted, fontStyle: 'italic', marginTop: 8, marginBottom: 12 }}
                  >
                    No classes found for this school.
                  </Text>
                ) : null}
              </ScrollView>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
