/**
 * Parent Notifications — gradient header, filters, detail sheet, mark read.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { PD, cardShadow, darkenHex } from '../../constants/parentDesign';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;
const FILTERS = ['All', 'Unread', 'Homework', 'Attendance', 'Fees', 'Announcements'];

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function getCategoryStyle(key: string, primary: string): { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; bg: string } {
  const k = key.toLowerCase();
  if (k.includes('homework')) return { bg: primary + '26', icon: 'book-open-variant', color: primary };
  if (k.includes('attendance')) return { bg: '#22C55E26', icon: 'check-circle', color: PD.success };
  if (k.includes('fee')) return { bg: '#F59E0B26', icon: 'wallet', color: PD.warning };
  if (k.includes('announcement')) return { bg: '#A855F726', icon: 'bullhorn', color: '#A855F7' };
  if (k.includes('marks')) return { bg: '#0EA5E926', icon: 'chart-line', color: '#0EA5E9' };
  if (k.includes('message')) return { bg: primary + '26', icon: 'email-outline', color: primary };
  return { bg: PD.bg, icon: 'bell-ring', color: PD.textMuted };
}

export default function ParentNotificationsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const stackIndex = useNavigationState((s) => (s && typeof s.index === 'number' ? s.index : 0));
  const fromCrossTab = !!route.params?.fromCrossTab;
  const showBack = navigation.canGoBack() || stackIndex > 0 || fromCrossTab;
  const onBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (stackIndex > 0) {
      navigation.goBack();
      return;
    }
    if (fromCrossTab) {
      navigation.navigate('ParentHome' as never, { screen: 'ParentDashboard' } as never);
    }
  };
  const insets = useSafeAreaInsets();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/parent/notifications');
      const data = (res as any)?.data ?? res;
      setList(Array.isArray(data) ? data : data?.notifications ?? []);
    } catch (_e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markRead = async (id: string) => {
    try {
      await API.put(`/parent/notifications/${id}/read`);
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n)));
    } catch (_e) {}
  };

  const markAllRead = async () => {
    const unread = list.filter((n) => !n.isRead && !n.read);
    for (const n of unread) {
      try {
        await API.put(`/parent/notifications/${n.id}/read`);
      } catch (_e) {}
    }
    setList((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
  };

  const openNotif = async (notif: any) => {
    setSelectedNotif(notif);
    const read = notif.isRead || notif.read;
    if (!read) await markRead(notif.id);
  };

  const filtered =
    filter === 'Unread'
      ? list.filter((n) => !n.isRead && !n.read)
      : filter !== 'All'
        ? list.filter((n) => (n.type || n.category || '').toLowerCase().includes(filter.toLowerCase()))
        : list;

  const unreadCount = list.filter((n) => !n.isRead && !n.read).length;

  const detailStyle = selectedNotif
    ? getCategoryStyle((selectedNotif.type || selectedNotif.category || 'default') as string, primary)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showBack ? (
              <TouchableOpacity
                onPress={onBackPress}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: T.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <ArrowLeft size={20} color={T.primary} strokeWidth={2} />
              </TouchableOpacity>
            ) : null}
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', flex: 1 }}>Notifications</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
              <Text style={{ color: primary, fontWeight: '900', fontSize: 14 }}>{unreadCount} unread</Text>
            </View>
            <Pressable
              onPress={markAllRead}
              style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Mark all read</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }} contentContainerStyle={{ paddingRight: 8 }}>
            {FILTERS.map((f) => {
              const isActive = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    marginRight: 8,
                    shadowColor: isActive ? '#000' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isActive ? 0.12 : 0,
                    shadowRadius: 4,
                    elevation: isActive ? 3 : 0,
                  }}
                >
                  <Text style={{ color: isActive ? primary : '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: PD.textMuted, fontStyle: 'italic' }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <MaterialCommunityIcons name="bell-off-outline" size={64} color={PD.textMuted} />
              <Text style={{ color: PD.textDark, fontWeight: '800', fontSize: 18, marginTop: 16 }}>You're all caught up!</Text>
              <Text style={{ color: PD.textMuted, fontSize: 14, marginTop: 8 }}>No notifications</Text>
            </View>
          }
          renderItem={({ item }) => {
            const read = item.isRead || item.read;
            const st = getCategoryStyle((item.type || item.category || 'default') as string, primary);
            return (
              <TouchableOpacity
                onPress={() => openNotif(item)}
                activeOpacity={0.75}
                style={[
                  { backgroundColor: PD.card, borderRadius: 16, padding: 16, marginBottom: 10 },
                  cardShadow,
                  !read && { borderLeftWidth: 4, borderLeftColor: primary },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: st.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={st.icon} size={24} color={st.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: PD.textDark, fontWeight: read ? '700' : '900', fontSize: 15 }} numberOfLines={2}>
                      {item.title ?? 'Notification'}
                    </Text>
                    <Text style={{ color: PD.textMuted, fontSize: 14, marginTop: 4 }} numberOfLines={3}>
                      {item.message ?? item.body ?? ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: PD.textMuted, fontSize: 11 }}>{timeAgo(item.createdAt ?? item.date)}</Text>
                    {!read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primary, marginTop: 8 }} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={!!selectedNotif} transparent animationType="slide" onRequestClose={() => setSelectedNotif(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setSelectedNotif(null)} />
          <View
            style={{
              backgroundColor: T.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.inputBorder, alignSelf: 'center', marginBottom: 20 }} />
            {detailStyle ? (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: T.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <MaterialCommunityIcons name={detailStyle.icon} size={28} color={detailStyle.color} />
              </View>
            ) : null}
            <Text style={{ ...T.font.cardTitle, color: T.textDark, marginBottom: 8 }}>{selectedNotif?.title}</Text>
            <Text style={{ ...T.font.body, color: T.textBody, lineHeight: 22 }}>
              {selectedNotif?.message ?? selectedNotif?.body ?? ''}
            </Text>
            <Text style={{ ...T.font.badge, color: T.textMuted, marginTop: 16 }}>
              {selectedNotif?.createdAt
                ? new Date(selectedNotif.createdAt).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : ''}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedNotif(null)}
              style={{
                marginTop: 20,
                backgroundColor: T.primaryLight,
                borderRadius: T.radius.lg,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...T.font.label, color: T.primary }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
