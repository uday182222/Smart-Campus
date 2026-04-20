/**
 * Admin — Fee Management. Dark + accent: summary, actions (Add/Class Fee, Remind, Export),
 * filter, class sections, student cards with fee pills and Mark Paid/Pending/Overdue/Remind.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  Pressable,
  ScrollView as RNScrollView,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, Search, School, Download, Megaphone, Plus, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAccentColor } from '../../hooks/useAccentColor';
import { LightHeader, LightButton, Pressable3D } from '../../components/ui';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string | null;
  status: string;
  paidDate: string | null;
}

interface StudentWithFees {
  studentId: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  fees: FeeItem[];
}

interface ClassSection {
  classId: string;
  className: string;
  studentCount: number;
  students: StudentWithFees[];
}

interface FeeManagementData {
  summary: { totalDue: number; totalPaid: number; totalOverdue: number; totalStudents: number };
  byClass: ClassSection[];
}

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Overdue'];

export default function FeeReportScreen() {
  const navigation = useNavigation<any>();
  const accent = useAccentColor();
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const [data, setData] = useState<FeeManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [historyModalStudent, setHistoryModalStudent] = useState<StudentWithFees | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [classSubmitting, setClassSubmitting] = useState(false);
  const [addFeeName, setAddFeeName] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addDueDate, setAddDueDate] = useState('');
  const [addStudentId, setAddStudentId] = useState('');
  const [classFeeName, setClassFeeName] = useState('');
  const [classAmount, setClassAmount] = useState('');
  const [classDueDate, setClassDueDate] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [updatingFeeId, setUpdatingFeeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/admin/fees/management');
      const raw = (res?.data?.data ?? res?.data) as FeeManagementData | null;
      setData(raw || { summary: { totalDue: 0, totalPaid: 0, totalOverdue: 0, totalStudents: 0 }, byClass: [] });
    } catch (_e) {
      setData({ summary: { totalDue: 0, totalPaid: 0, totalOverdue: 0, totalStudents: 0 }, byClass: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const summary = data?.summary ?? { totalDue: 0, totalPaid: 0, totalOverdue: 0, totalStudents: 0 };
  const total = summary.totalPaid + summary.totalDue;
  const collectionPct = total > 0 ? Math.round((summary.totalPaid / total) * 100) : 0;

  const paidCount = data?.byClass?.reduce((s, c) => s + c.students.reduce((t, st) => t + st.fees.filter((f) => f.status === 'PAID').length, 0), 0) ?? 0;
  const pendingCount = data?.byClass?.reduce((s, c) => s + c.students.reduce((t, st) => t + st.fees.filter((f) => f.status === 'PENDING').length, 0), 0) ?? 0;
  const overdueCount = data?.byClass?.reduce((s, c) => s + c.students.reduce((t, st) => t + st.fees.filter((f) => f.status === 'OVERDUE').length, 0), 0) ?? 0;

  const handleMarkStatus = async (feeId: string, status: 'PAID' | 'PENDING' | 'OVERDUE') => {
    setUpdatingFeeId(feeId);
    try {
      await API.patch(`/admin/fees/${encodeURIComponent(feeId)}`, { status });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update');
    } finally {
      setUpdatingFeeId(null);
    }
  };

  const handleRemind = async (studentIds: string[]) => {
    try {
      await API.post('/admin/fees/reminders', { studentIds });
      Alert.alert('Done', 'Reminders sent.');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send reminders');
    }
  };

  const handleRemindAll = () => {
    Alert.alert('Remind All', 'Send fee reminders to all parents with PENDING fees?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: () => API.post('/admin/fees/reminders', { status: 'PENDING' }).then(() => { Alert.alert('Done', 'Reminders sent.'); load(); }).catch((e: any) => Alert.alert('Error', e?.message || 'Failed')) },
    ]);
  };

  const handleExport = async () => {
    try {
      const res = await API.get('/admin/fees/export?format=csv', { responseType: 'text' });
      const csv = typeof res?.data === 'string' ? res.data : JSON.stringify(res?.data);
      await Share.share({ message: csv, title: 'Fee Report CSV' });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Export failed');
    }
  };

  const handleAddFee = async () => {
    if (!addFeeName.trim() || !addAmount.trim()) {
      Alert.alert('Required', 'Fee name and amount are required.');
      return;
    }
    setAddSubmitting(true);
    try {
      await API.post('/admin/fees', { name: addFeeName.trim(), amount: Number(addAmount), dueDate: addDueDate || undefined });
      setAddModalVisible(false);
      setAddFeeName('');
      setAddAmount('');
      setAddDueDate('');
      setAddStudentId('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add fee');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleClassFee = async () => {
    if (!selectedClassId || selectedClassId === '_unclassed' || !classFeeName.trim() || !classAmount.trim()) {
      Alert.alert('Required', 'Select a class, fee name and amount.');
      return;
    }
    setClassSubmitting(true);
    try {
      await API.post('/admin/fees/class', { classId: selectedClassId, name: classFeeName.trim(), amount: Number(classAmount), dueDate: classDueDate || undefined });
      setClassModalVisible(false);
      setClassFeeName('');
      setClassAmount('');
      setClassDueDate('');
      setSelectedClassId('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to set class fee');
    } finally {
      setClassSubmitting(false);
    }
  };

  const filterStudent = (st: StudentWithFees) => {
    const q = search.toLowerCase();
    if (q && !st.studentName.toLowerCase().includes(q) && !st.parentName?.toLowerCase().includes(q)) return false;
    if (statusFilter === 0) return true;
    const statusKey = STATUS_FILTERS[statusFilter];
    if (statusKey === 'Paid') return st.fees.some((f) => f.status === 'PAID');
    if (statusKey === 'Pending') return st.fees.some((f) => f.status === 'PENDING');
    if (statusKey === 'Overdue') return st.fees.some((f) => f.status === 'OVERDUE');
    return true;
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={T.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      {/* Flat header (Parent-style) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => (canGoBack ? navigation.goBack() : null)}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </Pressable>
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Fee Management</Text>
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
            <View style={{ width: 44, height: 44 }} />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
      >
        {/* Summary */}
        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 4, ...T.shadowSm }}>
          <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900' }}>Fee Overview</Text>
          <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>this academic year</Text>
          <View style={{ flexDirection: 'row', marginTop: 16, marginHorizontal: -4 }}>
            <View style={{ flex: 1, backgroundColor: T.primaryLight, borderRadius: 14, padding: 12, marginHorizontal: 4, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ color: T.success, fontSize: 22, fontWeight: '900' }}>{data?.byClass?.flatMap((c) => c.students).filter((s) => s.fees.some((f) => f.status === 'PAID')).length ?? 0}</Text>
              <Text style={{ color: T.textMuted, fontSize: 11, fontStyle: 'italic' }}>Paid</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: T.primaryLight, borderRadius: 14, padding: 12, marginHorizontal: 4, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ color: T.warning, fontSize: 22, fontWeight: '900' }}>{pendingCount}</Text>
              <Text style={{ color: T.textMuted, fontSize: 11, fontStyle: 'italic' }}>Pending</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: T.primaryLight, borderRadius: 14, padding: 12, marginHorizontal: 4, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ color: T.danger, fontSize: 22, fontWeight: '900' }}>{overdueCount}</Text>
              <Text style={{ color: T.textMuted, fontSize: 11, fontStyle: 'italic' }}>Overdue</Text>
            </View>
          </View>
          <View style={{ height: 6, backgroundColor: T.primaryTint, borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
            <View style={{ height: 6, backgroundColor: T.primary, borderRadius: 3, width: `${collectionPct}%` }} />
          </View>
          <Text style={{ color: T.primary, fontSize: 14, fontWeight: '900', marginTop: 6 }}>{collectionPct}% collected</Text>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, marginHorizontal: -4 }}>
          <View style={{ width: '48%', marginHorizontal: '1%', marginBottom: 8 }}>
            <LightButton label="Add Fee" variant="primary" icon="add-circle-outline" onPress={() => setAddModalVisible(true)} fullWidth />
          </View>
          <View style={{ width: '48%', marginHorizontal: '1%', marginBottom: 8 }}>
            <LightButton label="Class Fee" variant="outline" icon="people-outline" onPress={() => setClassModalVisible(true)} fullWidth />
          </View>
          <View style={{ width: '48%', marginHorizontal: '1%', marginBottom: 8 }}>
            <LightButton label="Remind All" variant="ghost" icon="notifications-outline" onPress={handleRemindAll} fullWidth />
          </View>
          <View style={{ width: '48%', marginHorizontal: '1%', marginBottom: 8 }}>
            <LightButton label="Export CSV" variant="ghost" icon="download-outline" onPress={handleExport} fullWidth />
          </View>
        </View>

        {/* Filter */}
        <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }} contentContainerStyle={{ paddingRight: 20 }}>
          {STATUS_FILTERS.map((label, i) => (
            <Pressable
              key={label}
              onPress={() => setStatusFilter(i)}
              style={{
                backgroundColor: statusFilter === i ? T.primary : T.card,
                borderRadius: 18,
                paddingHorizontal: 16,
                height: 36,
                marginRight: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: statusFilter === i ? T.primary : T.inputBorder,
                ...T.shadowSm,
              }}
            >
              <Text style={{ color: statusFilter === i ? T.textWhite : T.textDark, fontWeight: '900', fontSize: 13 }}>{label}</Text>
            </Pressable>
          ))}
        </RNScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: T.radius.xxl, height: 48, paddingHorizontal: 14, marginTop: 8, borderWidth: 1.5, borderColor: T.inputBorder, ...T.shadowSm }}>
          <Search size={20} color={T.textPlaceholder} strokeWidth={1.8} />
          <TextInput style={{ flex: 1, color: T.textDark, fontSize: 15, marginLeft: 10 }} placeholder="Search student..." placeholderTextColor={T.textPlaceholder} value={search} onChangeText={setSearch} />
        </View>

        {/* Class sections */}
        {(data?.byClass ?? []).map((section) => (
          <View key={section.classId} style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <School size={20} color={T.primary} strokeWidth={1.8} />
              <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', marginLeft: 8 }}>{section.className}</Text>
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginLeft: 8 }}>{section.studentCount} students</Text>
            </View>
            {section.students.filter(filterStudent).map((st) => {
              const totalAmount = st.fees.reduce((s, f) => s + f.amount, 0);
              return (
                <Pressable3D key={st.studentId} onPress={() => setHistoryModalStudent(st)}>
                  <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, marginBottom: 8, ...T.shadowSm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>{(st.studentName || '?').slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>{st.studentName}</Text>
                        <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{st.parentName}</Text>
                      </View>
                      <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18 }}>₹{totalAmount.toLocaleString()}</Text>
                    </View>
                    <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ paddingRight: 8 }}>
                      {st.fees.map((f) => (
                        <View key={f.id} style={{ backgroundColor: T.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.inputBorder }}>
                          <Text style={{ color: T.textDark, fontSize: 12 }} numberOfLines={1}>{f.name}</Text>
                          <Text style={{ color: T.textMuted, fontSize: 11, marginLeft: 6 }}>₹{f.amount}</Text>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: f.status === 'PAID' ? T.success : f.status === 'OVERDUE' ? T.danger : T.warning, marginLeft: 6 }} />
                        </View>
                      ))}
                    </RNScrollView>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                      {st.fees.map((f) => (
                        <View key={f.id} style={{ marginRight: 8, marginBottom: 6 }}>
                          {updatingFeeId === f.id ? (
                            <ActivityIndicator size="small" color={T.primary} />
                          ) : f.status !== 'PAID' ? (
                            <Pressable onPress={() => handleMarkStatus(f.id, 'PAID')} style={{ backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                              <Text style={{ color: T.primary, fontSize: 11, fontWeight: '900' }}>Mark Paid</Text>
                            </Pressable>
                          ) : (
                            <Pressable onPress={() => handleMarkStatus(f.id, 'PENDING')} style={{ backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                              <Text style={{ color: T.warning, fontSize: 11, fontWeight: '900' }}>Mark Pending</Text>
                            </Pressable>
                          )}
                        </View>
                      ))}
                      <Pressable onPress={() => handleRemind([st.studentId])} style={{ backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Megaphone size={12} color={T.primary} strokeWidth={1.8} />
                        <Text style={{ color: T.textDark, fontSize: 11, marginLeft: 6, fontWeight: '800' }}>Remind</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable3D>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Add Fee Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setAddModalVisible(false)}>
          <Pressable style={{ backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }} onPress={(e) => e.stopPropagation()}>
            <Text style={{ color: T.textDark, fontSize: 22, fontWeight: '900' }}>Add Fee Entry</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>for individual student</Text>
            <TextInput style={{ backgroundColor: T.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.textDark, marginTop: 16, borderWidth: 1.5, borderColor: T.inputBorder }} placeholder="Fee name (e.g. Term 1 Fee)" placeholderTextColor={T.textPlaceholder} value={addFeeName} onChangeText={setAddFeeName} />
            <TextInput style={{ backgroundColor: T.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.textDark, marginTop: 8, borderWidth: 1.5, borderColor: T.inputBorder }} placeholder="Amount" placeholderTextColor={T.textPlaceholder} value={addAmount} onChangeText={setAddAmount} keyboardType="numeric" />
            <TextInput style={{ backgroundColor: T.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.textDark, marginTop: 8, borderWidth: 1.5, borderColor: T.inputBorder }} placeholder="Due date (YYYY-MM-DD)" placeholderTextColor={T.textPlaceholder} value={addDueDate} onChangeText={setAddDueDate} />
            <LightButton label="Add Fee" variant="primary" icon="add-circle-outline" onPress={handleAddFee} loading={addSubmitting} style={{ marginTop: 20 }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Class Fee Modal */}
      <Modal visible={classModalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setClassModalVisible(false)}>
          <Pressable style={{ backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }} onPress={(e) => e.stopPropagation()}>
            <Text style={{ color: T.textDark, fontSize: 22, fontWeight: '900' }}>Set Class Fee</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>apply to all students in a class</Text>
            <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }} contentContainerStyle={{ paddingRight: 16 }}>
              {(data?.byClass ?? []).filter((c) => c.classId !== '_unclassed').map((c) => (
                <Pressable key={c.classId} onPress={() => setSelectedClassId(c.classId)} style={{ backgroundColor: selectedClassId === c.classId ? T.primary : T.card, borderRadius: 18, paddingHorizontal: 14, height: 36, marginRight: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: selectedClassId === c.classId ? T.primary : T.inputBorder }}>
                  <Text style={{ color: selectedClassId === c.classId ? T.textWhite : T.textDark, fontWeight: '900' }}>{c.className}</Text>
                </Pressable>
              ))}
            </RNScrollView>
            <TextInput style={{ backgroundColor: T.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.textDark, marginTop: 16, borderWidth: 1.5, borderColor: T.inputBorder }} placeholder="Fee name" placeholderTextColor={T.textPlaceholder} value={classFeeName} onChangeText={setClassFeeName} />
            <TextInput style={{ backgroundColor: T.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.textDark, marginTop: 8, borderWidth: 1.5, borderColor: T.inputBorder }} placeholder="Amount" placeholderTextColor={T.textPlaceholder} value={classAmount} onChangeText={setClassAmount} keyboardType="numeric" />
            <TextInput style={{ backgroundColor: T.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T.textDark, marginTop: 8, borderWidth: 1.5, borderColor: T.inputBorder }} placeholder="Due date (YYYY-MM-DD)" placeholderTextColor={T.textPlaceholder} value={classDueDate} onChangeText={setClassDueDate} />
            <Text style={{ color: T.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 12, textAlign: 'center' }}>This will create fee entries for ALL students in the selected class</Text>
            <LightButton label="Apply to Class" variant="primary" icon="people-outline" onPress={handleClassFee} loading={classSubmitting} style={{ marginTop: 16 }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Payment history modal */}
      <Modal visible={!!historyModalStudent} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setHistoryModalStudent(null)}>
          <Pressable style={{ backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' }} onPress={(e) => e.stopPropagation()}>
            {historyModalStudent && (
              <>
                <Text style={{ color: T.textDark, fontSize: 20, fontWeight: '900' }}>{historyModalStudent.studentName}</Text>
                <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>payment history</Text>
                <RNScrollView style={{ marginTop: 16, maxHeight: 300 }}>
                  {historyModalStudent.fees.map((f) => (
                    <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.inputBorder }}>
                      <View>
                        <Text style={{ color: T.textDark, fontWeight: '800' }}>{f.name}</Text>
                        <Text style={{ color: T.textMuted, fontSize: 12 }}>₹{f.amount} · {f.paidDate || f.dueDate || '—'}</Text>
                      </View>
                      <View style={{ backgroundColor: T.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5, borderColor: T.inputBorder }}>
                        <Text style={{ color: f.status === 'PAID' ? T.success : f.status === 'OVERDUE' ? T.danger : T.warning, fontSize: 11, fontWeight: '900' }}>{f.status}</Text>
                      </View>
                    </View>
                  ))}
                </RNScrollView>
                <LightButton label="Close" variant="ghost" onPress={() => setHistoryModalStudent(null)} style={{ marginTop: 16 }} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
