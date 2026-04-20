/**
 * Admin — Pending registration requests. Premium gradient + PD cards.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Modal, Pressable, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, User, Mail, Phone, CheckCircle2, XCircle, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightInput } from '../../components/ui';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';

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
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PendingRequestsScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useSchoolTheme();
  const primary = T.primary;
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack?.() ?? false;
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

  const primaryLight = T.primaryLight;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header (flat) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => (canGoBack ? navigation.goBack() : null)}
            disabled={!canGoBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: T.card,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canGoBack ? 1 : 0,
              ...T.shadowSm,
            }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Pending Requests</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>
        <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 10 }}>
          {requests.length} awaiting your review
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingTop: 2, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={34} color={T.success} strokeWidth={1.8} />
              </View>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginTop: 16, textAlign: 'center' }}>All caught up!</Text>
              <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' }}>No pending requests</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginBottom: 12, ...T.shadowSm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16 }}>{getInitials(item.studentName)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>{item.studentName}</Text>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: primaryLight,
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: primary, fontSize: 11, fontWeight: '900' }}>{item.className}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={T.textPlaceholder} strokeWidth={1.8} />
            </View>
            <View style={{ marginTop: 16, backgroundColor: T.primaryLight, borderRadius: 16, padding: 12, borderWidth: 1.5, borderColor: T.inputBorder }}>
              {[
                { key: 'parent', Icon: User, text: item.parentName },
                { key: 'email', Icon: Mail, text: item.parentEmail },
                { key: 'phone', Icon: Phone, text: item.parentPhone },
              ].map((row, i) => (
                <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: T.inputBorder }}>
                  <row.Icon size={18} color={primary} strokeWidth={1.8} />
                  <Text style={{ color: T.textDark, fontSize: 14, marginLeft: 10, flex: 1 }} numberOfLines={2}>
                    {row.text || '—'}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 10 }}>submitted {formatTimeAgo(item.createdAt)}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <Pressable
                onPress={() => handleApprove(item.id)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 16,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  ...T.shadowSm,
                }}
              >
                <CheckCircle2 size={18} color={T.textWhite} strokeWidth={1.8} />
                <Text style={{ color: T.textWhite, fontWeight: '900' }}>Approve</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setRejectModal({ id: item.id });
                  setRejectReason('');
                }}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 16,
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <XCircle size={18} color={T.danger} strokeWidth={1.8} />
                <Text style={{ color: T.danger, fontWeight: '900' }}>Reject</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={!!rejectModal} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setRejectModal(null)}>
          <Pressable style={{ backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }} onPress={() => {}}>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginBottom: 16 }}>Reason for Rejection</Text>
            <LightInput label="" placeholder="Enter reason..." value={rejectReason} onChangeText={setRejectReason} multiline />
            <Pressable
              onPress={submitReject}
              style={{ marginTop: 16, height: 48, borderRadius: 16, backgroundColor: T.danger, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>Reject Request</Text>
            </Pressable>
            <Pressable
              onPress={() => setRejectModal(null)}
              style={{
                marginTop: 10,
                height: 48,
                borderRadius: 16,
                backgroundColor: T.card,
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                alignItems: 'center',
                justifyContent: 'center',
                ...T.shadowSm,
              }}
            >
              <Text style={{ color: T.textDark, fontWeight: '900' }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
