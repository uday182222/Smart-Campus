/**
 * Admin — Announcements. Gradient header, compose card, target chips, history (PD).
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Megaphone, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton, LightInput } from '../../components/ui';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;
const TARGET_OPTIONS = ['All', 'Teachers', 'Parents', 'Students', 'Bus Helpers'];

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  targetAudience: string | string[];
  createdAt: string;
  deliveryCount?: number;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function AnnouncementsScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useSchoolTheme();
  const primary = T.primary;
  const primaryTint = T.primaryLight;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>(['All']);
  const [sending, setSending] = useState(false);
  const [list, setList] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const res = await API.get('/admin/announcements');
      const data = (res?.data?.data ?? res?.data) as { announcements?: AnnouncementItem[] } | AnnouncementItem[];
      const announcements = Array.isArray(data) ? data : (data?.announcements ?? []);
      setList(announcements);
    } catch (_e) {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadList();
  }, [loadList]);

  const toggleTarget = (role: string) => {
    if (role === 'All') {
      setTargetRoles(targetRoles.includes('All') ? [] : ['All']);
      return;
    }
    setTargetRoles((prev) => {
      const next = prev.filter((r) => r !== 'All');
      if (next.includes(role)) return next.filter((r) => r !== role);
      return [...next, role];
    });
  };

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Required', 'Title and message are required.');
      return;
    }
    const roles = targetRoles.length === 0 ? ['All'] : targetRoles;
    setSending(true);
    try {
      await API.post('/admin/announcements', {
        title: title.trim(),
        message: message.trim(),
        targetRoles: roles,
      });
      setTitle('');
      setMessage('');
      setTargetRoles(['All']);
      loadList();
      Alert.alert('Sent', 'Announcement sent successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header (flat) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }} numberOfLines={1}>
              {theme.schoolName || 'Admin'}
            </Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Announcements</Text>
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
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>{(theme.schoolName || 'A').charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadList(); }} tintColor={primary} />}
      >
        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 4, ...T.shadowSm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={20} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900' }}>New Announcement</Text>
          </View>

          <LightInput label="Title" placeholder="Title" value={title} onChangeText={setTitle} />
          <LightInput
            label="Message"
            placeholder="Message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />

          <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 4, marginBottom: 8 }}>SEND TO:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TARGET_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => toggleTarget(opt)}
                style={{
                  height: 36,
                  backgroundColor: targetRoles.includes(opt) ? primary : T.card,
                  paddingHorizontal: 14,
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: targetRoles.includes(opt) ? primary : T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: targetRoles.includes(opt) ? T.textWhite : T.textDark,
                    fontWeight: '900',
                    fontSize: 13,
                  }}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>

          <LightButton label="Send Announcement" variant="primary" icon="send-outline" iconPosition="left" onPress={send} loading={sending} style={{ marginTop: 16 }} />
        </View>

        <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', marginTop: 18, marginBottom: 12 }}>Sent</Text>

        {loading ? (
          <Text style={{ color: T.textMuted, marginTop: 8 }}>Loading...</Text>
        ) : list.length === 0 ? (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 24, alignItems: 'center', marginTop: 4, ...T.shadowSm }}>
            <Text style={{ color: T.textMuted }}>No announcements yet</Text>
          </View>
        ) : (
          list.map((item) => (
            <View key={item.id} style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, marginBottom: 12, ...T.shadowSm }}>
              <Text style={{ color: T.textDark, fontSize: 16, fontWeight: '900' }}>{item.title}</Text>
              <Text style={{ color: T.textMuted, fontSize: 14, marginTop: 8 }} numberOfLines={2}>
                {item.message}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
                {(Array.isArray(item.targetAudience) ? item.targetAudience : [item.targetAudience]).map((a) => (
                  <View
                    key={String(a)}
                    style={{
                      backgroundColor: primaryTint,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      marginRight: 6,
                      marginBottom: 4,
                      borderWidth: 1.5,
                      borderColor: T.inputBorder,
                    }}
                  >
                    <Text style={{ color: primary, fontSize: 11, fontWeight: '900' }}>{a}</Text>
                  </View>
                ))}
                <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginLeft: 'auto' }}>{formatTimeAgo(item.createdAt)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
