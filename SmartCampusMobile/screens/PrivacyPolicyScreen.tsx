/**
 * In-app Privacy Policy — readable scroll view for all roles.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { T } from '../constants/theme';
import {
  PRIVACY_POLICY_UPDATED,
  PRIVACY_POLICY_EMAIL,
  PRIVACY_POLICY_SECTIONS,
} from '../constants/privacyPolicy';

function renderParagraph(text: string, key: string) {
  if (text === PRIVACY_POLICY_EMAIL) {
    return (
      <TouchableOpacity key={key} onPress={() => Linking.openURL(`mailto:${PRIVACY_POLICY_EMAIL}`)} activeOpacity={0.7}>
        <Text style={{ fontSize: 14, color: T.primary, fontWeight: '700', lineHeight: 21, marginBottom: 10 }}>
          Email: {PRIVACY_POLICY_EMAIL}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Text key={key} style={{ fontSize: 14, color: T.textBody, lineHeight: 21, marginBottom: 10 }}>
      {text}
    </Text>
  );
}

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const showBack = navigation.canGoBack();

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: T.card,
                alignItems: 'center',
                justifyContent: 'center',
                ...T.shadowSm,
              }}
            >
              <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Privacy Policy</Text>
          <View style={{ width: 44 }} />
        </View>
        <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 8, textAlign: 'center' }}>
          Last updated: {PRIVACY_POLICY_UPDATED}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <View key={section.heading}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: T.textDark,
                marginTop: 24,
                marginBottom: 8,
              }}
            >
              {section.heading}
            </Text>
            {section.body.map((paragraph, idx) => renderParagraph(paragraph, `${section.heading}-${idx}`))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
