// @ts-nocheck
/**
 * Modern Login Screen - Beautiful authentication screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { GradientButton, ModernCard } from '../components/ui';
import { colors, typography, spacing, gradients, borderRadius, shadows } from '../theme';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    { id: 'teacher', label: 'Teacher', icon: 'human-male-board', color: colors.primary.main },
    { id: 'parent', label: 'Parent', icon: 'account-child', color: colors.secondary.main },
    { id: 'admin', label: 'Admin', icon: 'shield-account', color: colors.accent.purple },
  ];

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Reset Password', 'Password reset link will be sent to your email');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background Shapes */}
        <View style={styles.shape1} />
        <View style={styles.shape2} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Logo */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons
                  name="school"
                  size={48}
                  color={colors.primary.main}
                />
              </View>
              <Text style={styles.logoText}>Smart Campus</Text>
              <Text style={styles.logoSubtext}>Sign in to continue</Text>
            </Animated.View>

            {/* Login Card */}
            <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.cardContainer}>
              <ModernCard variant="elevated" style={styles.card}>
                {/* Role Selector */}
                <View style={styles.roleSelector}>
                  {roles.map(role => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleButton,
                        selectedRole === role.id && {
                          backgroundColor: role.color + '15',
                          borderColor: role.color,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedRole(role.id);
                      }}
                    >
                      <MaterialCommunityIcons
                        name={role.icon as any}
                        size={24}
                        color={selectedRole === role.id ? role.color : colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.roleText,
                          selectedRole === role.id && { color: role.color },
                        ]}
                      >
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={colors.text.disabled}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={colors.text.tertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.text.disabled}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotButton}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <GradientButton
                  title="Sign In"
                  icon="login"
                  onPress={handleLogin}
                  loading={loading}
                  fullWidth
                  size="large"
                  gradient={selectedRole ? roles.find(r => r.id === selectedRole)?.color 
                    ? [roles.find(r => r.id === selectedRole)!.color, colors.accent.indigo]
                    : gradients.primary
                    : gradients.primary}
                />
              </ModernCard>
            </Animated.View>

            {/* Demo Credentials */}
            <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Accounts</Text>
              <View style={styles.demoCredentials}>
                <Text style={styles.demoText}>👨‍🏫 teacher@demo.com</Text>
                <Text style={styles.demoText}>👨‍👩‍👧 parent@demo.com</Text>
                <Text style={styles.demoText}>👔 admin@demo.com</Text>
              </View>
              <Text style={styles.demoPassword}>Password: demo123</Text>
            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  shape1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  shape2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: -width * 0.1,
    left: -width * 0.2,
  },
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.text.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.white,
  },
  logoSubtext: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  cardContainer: {
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  roleText: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.subtle,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    ...typography.captionBold,
    color: colors.primary.main,
  },
  demoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  demoTitle: {
    ...typography.captionBold,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing.sm,
  },
  demoCredentials: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  demoText: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  demoPassword: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: spacing.sm,
  },
});

export default LoginScreen;

