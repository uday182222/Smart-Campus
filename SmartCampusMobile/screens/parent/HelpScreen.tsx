/**
 * Help & Support — submit a concern to the school.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, HelpCircle, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { PD, cardShadow, darkenHex } from '../../constants/parentDesign';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;

export default function HelpScreen() {
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;
  const primaryDark = darkenHex(primary, 0.2);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter a subject and message.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.post('/support/concerns', {
        subject: subject.trim(),
        message: message.trim(),
      });
      if (res?.success !== false) {
        Alert.alert('Success', 'Your concern has been submitted. We will get back to you soon.');
        setSubject('');
        setMessage('');
      } else {
        Alert.alert('Error', res?.message ?? 'Failed to submit concern.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit concern.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {canGoBack ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            ) : null}
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', flex: 1 }}>Help & Support</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20, marginBottom: 20 }, cardShadow]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: T.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HelpCircle size={22} color={primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 16 }}>Submit a concern</Text>
                <Text style={{ color: T.textPlaceholder, fontSize: 12, marginTop: 4 }}>
                  Describe your issue and the school admin will follow up.
                </Text>
              </View>
            </View>
          </View>

          <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 14, marginBottom: 8 }}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of your concern"
            placeholderTextColor={T.textPlaceholder}
            style={{
              backgroundColor: T.card,
              borderRadius: T.radius.lg,
              borderWidth: 1.5,
              borderColor: T.inputBorder,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              color: T.textDark,
              marginBottom: 20,
              ...T.shadowSm,
            }}
          />

          <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 14, marginBottom: 8 }}>Message</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us more about your concern..."
            placeholderTextColor={T.textPlaceholder}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={{
              backgroundColor: T.card,
              borderRadius: T.radius.lg,
              borderWidth: 1.5,
              borderColor: T.inputBorder,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              color: T.textDark,
              minHeight: 140,
              marginBottom: 24,
              ...T.shadowSm,
            }}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
            style={{
              backgroundColor: T.primary,
              borderRadius: T.radius.lg,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
