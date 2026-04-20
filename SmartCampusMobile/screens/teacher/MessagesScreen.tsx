/**
 * Teacher Messages — gradient header, compose card, inbox with unread styling.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton, LightInput } from '../../components/ui';
import { TD, cardShadow, darkenHex } from '../../constants/teacherDesign';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;

interface MessageItem {
  id: string;
  fromName: string;
  fromId?: string;
  fromRole?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

function getInitials(name: string) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
}

export default function MessagesScreen() {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const preSelectedToUserId = route.params?.toUserId;
  const [toUserId, setToUserId] = useState(preSelectedToUserId ?? '');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [parents, setParents] = useState<any[]>([]);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState<any>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await API.get('/teacher/messages');
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? data?.messages ?? [];
      setMessages(
        list.map((m: any) => ({
          id: m.id,
          fromName: m.fromName ?? m.senderName ?? 'Unknown',
          fromId: m.fromId ?? m.senderId,
          fromRole: m.fromRole ?? 'USER',
          message: m.message ?? m.body ?? '',
          createdAt: m.createdAt ?? '',
          isRead: !!m.isRead,
        }))
      );
    } catch (_e) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const loadParents = useCallback(async () => {
    setParentsLoading(true);
    try {
      const res = await API.get('/teacher/parents');
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setParents(Array.isArray(list) ? list : []);
    } catch (_e) {
      setParents([]);
    } finally {
      setParentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  useEffect(() => {
    if (!preSelectedToUserId || parents.length === 0) return;
    const match = parents.find((p) => p?.id === preSelectedToUserId);
    if (match) {
      setSelectedParent(match);
      setToUserId(match.id);
    } else {
      setSelectedParent(null);
      setToUserId(preSelectedToUserId);
    }
  }, [preSelectedToUserId, parents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const send = async () => {
    if (!toUserId.trim() || !messageText.trim()) return;
    setSending(true);
    try {
      await API.post('/teacher/messages', { toUserId: toUserId.trim(), message: messageText.trim() });
      setMessageText('');
      loadMessages();
    } catch (_e) {
    } finally {
      setSending(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await API.put(`/teacher/messages/${id}/read`);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    } catch (_e) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  };

  const primaryLight = `${primary}33`;
  const filteredParents = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) => {
      const name = String(p?.name ?? '').toLowerCase();
      const studentName = String(p?.studentName ?? '').toLowerCase();
      return name.includes(q) || studentName.includes(q);
    });
  }, [parents, parentSearch]);

  const header = (
    <>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 26 }}>Messages</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{unreadCount} unread</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={[{ backgroundColor: TD.card, borderRadius: 20, padding: 20, marginBottom: 20 }, cardShadow]}>
          <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 20, marginBottom: 16 }}>New Message</Text>
          <Text style={{ color: TD.textMuted, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            To
          </Text>
          <TouchableOpacity
            onPress={() => setShowParentPicker(true)}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 14,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: selectedParent ? primary : TD.cardBorder,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="people-outline" size={20} color={selectedParent ? primary : TD.textMuted} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                color: selectedParent ? TD.textDark : TD.textMuted,
                fontWeight: selectedParent ? '800' : '600',
                fontSize: 14,
              }}
            >
              {selectedParent ? `${selectedParent.name} (${selectedParent.studentName})` : 'Select parent...'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={TD.textMuted} />
          </TouchableOpacity>
          <LightInput
            label="Message"
            placeholder="Type your message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' } as any}
          />
          <LightButton
            label="Send Message"
            onPress={send}
            variant="primary"
            icon="send"
            iconPosition="right"
            style={{ marginTop: 12, backgroundColor: primary } as any}
            loading={sending}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 20 }}>Inbox</Text>
          <Text style={{ color: TD.textMuted, fontSize: 13 }}>unread: {unreadCount}</Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: TD.bg }}>
      <Modal visible={showParentPicker} transparent animationType="slide" onRequestClose={() => setShowParentPicker(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setShowParentPicker(false)} />
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 18, maxHeight: '70%' }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: '#E5E7EB' }} />
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 18 }}>Select Parent</Text>
            <View style={{ marginTop: 12, borderWidth: 1, borderColor: TD.cardBorder, borderRadius: 14, paddingHorizontal: 12, height: 46, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="search" size={18} color={TD.textMuted} />
              <TextInput
                placeholder="Search by parent or student..."
                placeholderTextColor={TD.textMuted}
                value={parentSearch}
                onChangeText={setParentSearch}
                style={{ flex: 1, marginLeft: 10, color: TD.textDark, fontSize: 14 }}
              />
              {parentSearch ? (
                <TouchableOpacity onPress={() => setParentSearch('')} style={{ padding: 6 }}>
                  <Ionicons name="close" size={18} color={TD.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {parentsLoading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={primary} />
              <Text style={{ marginTop: 10, color: TD.textMuted, fontSize: 13 }}>Loading parents…</Text>
            </View>
          ) : (
            <FlatList
              data={filteredParents}
              keyExtractor={(item, idx) => `${item?.id ?? 'p'}:${item?.studentId ?? idx}`}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 }}
              renderItem={({ item }) => {
                const isActive = selectedParent?.id === item?.id && selectedParent?.studentId === item?.studentId;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedParent(item);
                      setToUserId(String(item?.id ?? ''));
                      setShowParentPicker(false);
                    }}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: isActive ? primaryLight : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isActive ? primary : TD.cardBorder,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{getInitials(String(item?.name ?? 'P'))}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 14 }} numberOfLines={1}>
                        {item?.name ?? 'Parent'}
                      </Text>
                      <Text style={{ color: TD.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                        Child: {item?.studentName ?? '—'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={TD.textMuted} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ color: TD.textMuted, fontSize: 13 }}>No parents found.</Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chatbubbles-outline" size={32} color={primary} />
              </View>
              <Text style={{ color: TD.textDark, fontWeight: '800', fontSize: 20, marginTop: 12, textAlign: 'center' }}>No messages yet</Text>
              <Text style={{ color: TD.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center' }}>Send a message to a parent above</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => !item.isRead && markRead(item.id)}
            style={[
              { backgroundColor: TD.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
              cardShadow,
              !item.isRead && { borderLeftWidth: 4, borderLeftColor: primary },
            ]}
          >
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>{getInitials(item.fromName)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: TD.textDark, fontWeight: item.isRead ? '700' : '900', fontSize: 16 }}>{item.fromName}</Text>
                <Text style={{ color: TD.textMuted, fontSize: 13, marginTop: 4, fontStyle: 'italic' }} numberOfLines={1}>
                  {item.message}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: TD.textMuted, fontSize: 11, fontStyle: 'italic' }}>{timeAgo(item.createdAt)}</Text>
                {!item.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primary, marginTop: 6 }} />}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
