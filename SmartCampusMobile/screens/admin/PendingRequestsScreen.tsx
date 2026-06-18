/**
 * Admin — Pending registration requests (parent-style stack header + cards).
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Modal, Pressable, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, Phone, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LightInput } from '../../components/ui';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';
import { AdminFloatingNav } from '../../components/ui/AdminFloatingNav';

const API = apiClient as any;

interface RequestItem {
  id: string;
  studentName: string;
  className: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  createdAt: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isNewRequest(createdAt: string): boolean {
  const t = new Date(createdAt).getTime();
  return Date.now() - t < 24 * 60 * 60 * 1000;
}

export default function PendingRequestsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      const res = await API.get('/registration/requests');
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      setRequests(Array.isArray(data) ? data : []);
    } catch (_e) {
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleApprove = (id: string) => {
    (async () => {
      try {
        await API.post(`/registration/requests/${id}/approve`);
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.message || 'Failed to approve');
      }
    })();
  };

  const submitReject = async () => {
    if (!rejectModal) return;
    try {
      await API.post(`/registration/requests/${rejectModal.id}/reject`, { reason: rejectReason });
      setRequests((prev) => prev.filter((r) => r.id !== rejectModal.id));
      setRejectModal(null);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to reject');
    }
  };

  const n = requests.length;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12, backgroundColor: T.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
              ...T.shadowSm,
            }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>Pending Requests</Text>
        </View>
        <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6, marginLeft: 56 }}>
          {n} awaiting review
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingTop: 2, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: T.primaryLight,
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={34} color={T.success} strokeWidth={1.8} />
              </View>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginTop: 16, textAlign: 'center' }}>All caught up!</Text>
              <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' }}>No pending requests</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const showNew = isNewRequest(item.createdAt);
          return (
            <Pressable
              onPress={() => {
                Alert.alert(
                  item.studentName,
                  `Parent: ${item.parentName}\nEmail: ${item.parentEmail}\nPhone: ${item.parentPhone}\nGrade: ${item.className}\nSubmitted: ${
                    (item as any).submittedAt
                      ? new Date((item as any).submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'
                  }`,
                  [{ text: 'Close' }],
                );
              }}
              style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginBottom: 12, ...T.shadowSm }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: T.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 16 }}>{getInitials(item.studentName)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>{item.studentName}</Text>
                    {showNew ? (
                      <View style={{ backgroundColor: T.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ color: T.primary, fontSize: 10, fontWeight: '800' }}>NEW</Text>
                      </View>
                    ) : null}
                  </View>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: T.primaryLight,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ color: T.primary, fontSize: 11, fontWeight: '800' }}>{item.className}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={T.textPlaceholder} strokeWidth={1.8} />
              </View>
              <View
                style={{
                  marginTop: 16,
                  backgroundColor: T.primaryLight,
                  borderRadius: T.radius.lg,
                  padding: 12,
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                }}
              >
                {[
                  { key: 'parent', Icon: User, text: item.parentName },
                  { key: 'email', Icon: Mail, text: item.parentEmail },
                  { key: 'phone', Icon: Phone, text: item.parentPhone },
                ].map((row, i) => (
                  <View
                    key={row.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: i < 2 ? 1 : 0,
                      borderBottomColor: T.inputBorder,
                    }}
                  >
                    <row.Icon size={18} color={T.primary} strokeWidth={1.8} />
                    <Text style={{ color: T.textBody, fontSize: 14, marginLeft: 10, flex: 1 }} numberOfLines={2}>
                      {row.text || '—'}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 10 }}>Submitted {formatTimeAgo(item.createdAt)}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Pressable
                  onPress={() => handleApprove(item.id)}
                  style={{
                    flex: 1,
                    minHeight: 46,
                    borderRadius: T.radius.full,
                    backgroundColor: T.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    ...T.shadowSm,
                  }}
                >
                  <CheckCircle2 size={18} color={T.textWhite} strokeWidth={1.8} />
                  <Text style={{ color: T.textWhite, fontWeight: '800' }}>Approve</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setRejectModal({ id: item.id });
                    setRejectReason('');
                  }}
                  style={{
                    flex: 1,
                    minHeight: 46,
                    borderRadius: T.radius.full,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: T.danger, fontWeight: '800' }}>Reject</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />

      <Modal visible={!!rejectModal} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setRejectModal(null)}>
          <Pressable style={{ backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }} onPress={() => {}}>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginBottom: 16 }}>Reason for rejection</Text>
            <LightInput label="" placeholder="Enter reason…" value={rejectReason} onChangeText={setRejectReason} multiline />
            <Pressable
              onPress={submitReject}
              style={{
                marginTop: 16,
                minHeight: 48,
                borderRadius: T.radius.full,
                backgroundColor: T.danger,
                alignItems: 'center',
                justifyContent: 'center',
                ...T.shadowSm,
              }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '800' }}>Reject request</Text>
            </Pressable>
            <Pressable
              onPress={() => setRejectModal(null)}
              style={{
                marginTop: 10,
                minHeight: 48,
                borderRadius: T.radius.full,
                backgroundColor: T.card,
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                alignItems: 'center',
                justifyContent: 'center',
                ...T.shadowSm,
              }}
            >
              <Text style={{ color: T.textDark, fontWeight: '800' }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <AdminFloatingNav navigation={navigation} activeTab="PendingRequests" />
    </View>
  );
}
