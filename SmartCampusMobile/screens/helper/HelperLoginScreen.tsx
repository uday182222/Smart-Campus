/**
 * Bus Helper Login Screen
 * Secure authentication for bus helpers with offline support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import HelperService from '../../services/HelperService';

interface HelperCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

const HelperLoginScreen: React.FC = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    checkSavedCredentials();
    checkOfflineMode();
  }, []);

  const checkSavedCredentials = async () => {
    try {
      const savedCredentials = await AsyncStorage.getItem('helperCredentials');
      if (savedCredentials) {
        const { email: savedEmail, rememberMe: saved } = JSON.parse(savedCredentials);
        if (saved) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const checkOfflineMode = async () => {
    try {
      const offlineData = await AsyncStorage.getItem('helperOfflineData');
      if (offlineData) {
        setOfflineMode(true);
      }
    } catch (error) {
      console.error('Error checking offline mode:', error);
    }
  };

  const validateInput = (): boolean => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateInput()) return;

    try {
      setLoading(true);

      // Authenticate with Cognito
      const response = await HelperService.login(email, password);

      // Check if user has BusHelper role
      if (response.role !== 'bus_helper') {
        Alert.alert('Error', 'Access denied. This login is for bus helpers only.');
        return;
      }

      // Load assigned route
      const routeData = await HelperService.getAssignedRoute(response.helperId);

      if (!routeData) {
        Alert.alert('Error', 'No route assigned. Please contact administration.');
        return;
      }

      // Save credentials if remember me is checked
      if (rememberMe) {
        await AsyncStorage.setItem(
          'helperCredentials',
          JSON.stringify({ email, rememberMe: true })
        );
      }

      // Save session data
      await AsyncStorage.setItem('helperToken', response.token);
      await AsyncStorage.setItem('helperData', JSON.stringify(response));
      
      // Save offline data for poor connectivity
      await AsyncStorage.setItem('helperOfflineData', JSON.stringify({
        helper: response,
        route: routeData,
        lastSync: new Date().toISOString(),
      }));

      // Navigate to helper dashboard
      navigation.replace('HelperDashboard', { helper: response, route: routeData });
    } catch (error) {
      console.error('Login error:', error);
      
      // Try offline login if available
      if (offlineMode) {
        await handleOfflineLogin();
      } else {
        Alert.alert('Error', 'Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineLogin = async () => {
    try {
      const offlineData = await AsyncStorage.getItem('helperOfflineData');
      if (offlineData) {
        const { helper, route } = JSON.parse(offlineData);
        
        // Basic offline validation
        if (helper.email === email) {
          Alert.alert(
            'Offline Mode',
            'You are working in offline mode. Some features may be limited.',
            [
              {
                text: 'Continue',
                onPress: () => navigation.replace('HelperDashboard', { 
                  helper, 
                  route,
                  offlineMode: true,
                }),
              },
            ]
          );
        } else {
          Alert.alert('Error', 'Email does not match offline data. Please connect to internet.');
        }
      } else {
        Alert.alert('Error', 'No offline data available. Please connect to internet.');
      }
    } catch (error) {
      Alert.alert('Error', 'Offline login failed.');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact your school administration to reset your password.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#F39C12', '#E67E22']}
        style={styles.background}
      >
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="directions-bus" size={64} color="#FFF" />
            </View>
            <Text style={styles.title}>Bus Helper Login</Text>
            <Text style={styles.subtitle}>Smart Campus Transport System</Text>
            {offlineMode && (
              <View style={styles.offlineBadge}>
                <MaterialIcons name="cloud-off" size={16} color="#FFF" />
                <Text style={styles.offlineText}>Offline Mode Available</Text>
              </View>
            )}
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#FFF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#FFF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <MaterialIcons
                name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#FFF"
              />
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#F39C12" />
              ) : (
                <>
                  <MaterialIcons name="login" size={20} color="#F39C12" />
                  <Text style={styles.loginButtonText}>Login</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <MaterialIcons name="info" size={16} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.footerText}>
              For technical support, contact your school administration
            </Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    gap: 8,
  },
  rememberMeText: {
    color: '#FFF',
    fontSize: 14,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#F39C12',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPassword: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
});

export default HelperLoginScreen;



