/**
 * Parent Appointments — premium gradient header, Upcoming | Past, FAB + bottom sheet booking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton, LightInput } from '../../components/ui';
import { PD, cardShadow, darkenHex } from '../../constants/parentDesign';
import { T } from '../../constants/theme';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;
const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
const DURATIONS = [15, 30, 45];

function getInitials(name: string) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
}

export default function AppointmentsScreen() {
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const { activeChild, children } = useActiveChild();
  const [tab, setTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string; subject?: string } | null>(null);
  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);
  const [form, setForm] = useState({
    studentId: activeChild?.studentId ?? children[0]?.studentId ?? '',
    time: '09:00',
    duration: 30,
    reason: '',
  });

  const load = useCallback(async () => {
    try {
      const res = await API.get('/parent/appointments');
      const data = (res as any)?.data ?? res;
      setList(Array.isArray(data) ? data : data?.appointments ?? []);
    } catch (_e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiClient
      .get('/parent/teachers')
      .then((res: any) => {
        const inner = res?.data ?? res;
        const list = Array.isArray(inner) ? inner : [];
        setTeachers(list);
      })
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    setForm((f) => ({ ...f, studentId: activeChild?.studentId ?? children[0]?.studentId ?? f.studentId }));
  }, [activeChild?.studentId, children]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const book = async () => {
    if (!form.studentId || !form.time || !form.reason.trim()) {
      Alert.alert('Error', 'Please choose time and enter a reason.');
      return;
    }
    if (!selectedTeacher?.id) {
      Alert.alert('Error', 'Please select a teacher or staff member.');
      return;
    }
    const dateStr = selectedDate.toISOString().split('T')[0];
    setSaving(true);
    try {
      await API.post('/parent/appointments', {
        studentId: form.studentId,
        date: dateStr,
        time: form.time,
        duration: form.duration,
        reason: form.reason.trim(),
        teacherId: selectedTeacher.id,
      });
      setModalVisible(false);
      setForm((f) => ({ ...f, time: '09:00', duration: 30, reason: '' }));
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to book.');
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const upcoming = list.filter((a) => new Date((a.requestedDate ?? a.date) + 'T' + (a.requestedTime ?? a.time ?? '00:00')) >= now);
  const past = list.filter((a) => new Date((a.requestedDate ?? a.date) + 'T' + (a.requestedTime ?? a.time ?? '00:00')) < now);
  const displayList = tab === 'Upcoming' ? upcoming : past;

  const statusColor = (s: string) => {
    const t = (s || '').toLowerCase();
    if (t === 'confirmed') return PD.success;
    if (t === 'cancelled') return PD.danger;
    return primary;
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
                <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', flex: 1 }}>Appointments</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: 4, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => setTab('Upcoming')}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: tab === 'Upcoming' ? '#FFFFFF' : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ color: tab === 'Upcoming' ? primary : '#FFFFFF', fontWeight: '900', fontSize: 14 }}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('Past')}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: tab === 'Past' ? '#FFFFFF' : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ color: tab === 'Past' ? primary : '#FFFFFF', fontWeight: '900', fontSize: 14 }}>Past</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: PD.textMuted, fontStyle: 'italic' }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={PD.textMuted} />
              <Text style={{ color: PD.textDark, fontWeight: '800', marginTop: 16 }}>{tab === 'Upcoming' ? 'No upcoming appointments' : 'No past appointments'}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const sc = statusColor(item.status);
            return (
              <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20, marginBottom: 12 }, cardShadow]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: primary + '33', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: primary, fontWeight: '900', fontSize: 14 }}>{getInitials(item.assignedTo ?? item.teacherName ?? 'S')}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: PD.textDark, fontWeight: '800', fontSize: 16 }}>{item.assignedTo ?? item.teacherName ?? 'Staff'}</Text>
                    <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 2 }}>for {activeChild?.name ?? children[0]?.name ?? 'child'}</Text>
                  </View>
                  <View style={{ backgroundColor: sc + '26', borderWidth: 1, borderColor: sc, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: sc, fontSize: 11, fontWeight: '800' }}>{(item.status || 'PENDING').toUpperCase()}</Text>
                  </View>
                </View>
                {item.reason ? <Text style={{ color: PD.textMuted, fontSize: 14, marginTop: 10 }} numberOfLines={3}>{item.reason}</Text> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <MaterialCommunityIcons name="calendar" size={16} color={primary} />
                  <Text style={{ color: PD.textDark, fontSize: 14, marginLeft: 6 }}>{item.requestedDate ?? item.date ?? '—'}</Text>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={primary} style={{ marginLeft: 16 }} />
                  <Text style={{ color: PD.textDark, fontSize: 14, marginLeft: 6 }}>{item.requestedTime ?? item.time ?? '—'}</Text>
                </View>
                {item.duration ? <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 6 }}>{item.duration} min</Text> : null}
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          position: 'absolute',
          bottom: 28,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setModalVisible(false)}>
          <Pressable style={{ backgroundColor: PD.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' }} onPress={() => {}}>
            <View style={{ width: 40, height: 4, backgroundColor: PD.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 22 }}>Book Appointment</Text>
            <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 4, marginBottom: 16 }}>Schedule a meeting with a teacher</Text>
            <Text style={{ color: PD.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1.5,
                borderColor: PD.cardBorder,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 14,
                backgroundColor: PD.bg,
                marginBottom: 4,
              }}
            >
              <Calendar size={18} color={T.primary} strokeWidth={1.8} />
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: PD.textDark }}>
                {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <ChevronDown size={16} color={T.textPlaceholder} strokeWidth={1.8} />
            </TouchableOpacity>
            {showDatePicker && Platform.OS === 'android' ? (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (event.type === 'dismissed') return;
                  if (date) setSelectedDate(date);
                }}
              />
            ) : null}

            <Text style={{ color: PD.textMuted, fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 8 }}>Teacher / faculty</Text>
            <TouchableOpacity
              onPress={() => setTeacherPickerVisible(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1.5,
                borderColor: PD.cardBorder,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 14,
                backgroundColor: PD.bg,
                marginBottom: 8,
              }}
            >
              <MaterialCommunityIcons name="school-outline" size={20} color={T.primary} />
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: PD.textDark }} numberOfLines={2}>
                {selectedTeacher ? `${selectedTeacher.name} · ${selectedTeacher.subject ?? 'Teacher'}` : 'Select teacher'}
              </Text>
              <ChevronDown size={16} color={T.textPlaceholder} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={{ color: PD.textMuted, fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 8 }}>Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setForm((f) => ({ ...f, time: slot }))}
                  style={{
                    backgroundColor: form.time === slot ? primary : PD.bg,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    marginRight: 8,
                    borderWidth: form.time === slot ? 0 : 1,
                    borderColor: PD.cardBorder,
                  }}
                >
                  <Text style={{ color: form.time === slot ? '#FFFFFF' : PD.textDark, fontWeight: form.time === slot ? '900' : '600', fontSize: 13 }}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ color: PD.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>Duration</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setForm((f) => ({ ...f, duration: d }))}
                  style={{
                    backgroundColor: form.duration === d ? primary : PD.bg,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    borderWidth: form.duration === d ? 0 : 1,
                    borderColor: PD.cardBorder,
                  }}
                >
                  <Text style={{ color: form.duration === d ? '#FFFFFF' : PD.textDark, fontWeight: '900' }}>{d} min</Text>
                </TouchableOpacity>
              ))}
            </View>
            <LightInput label="Reason" placeholder="Reason for appointment..." value={form.reason} onChangeText={(t) => setForm((f) => ({ ...f, reason: t }))} multiline />
            <LightButton label="Book Appointment" onPress={book} variant="primary" icon="calendar-outline" iconPosition="left" style={{ marginTop: 16 }} loading={saving} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showDatePicker && Platform.OS === 'ios'} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setShowDatePicker(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: PD.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 }}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_, date) => {
                if (date) setSelectedDate(date);
              }}
            />
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={{ marginHorizontal: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: primary, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={teacherPickerVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setTeacherPickerVisible(false)}>
          <Pressable style={{ backgroundColor: PD.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' }} onPress={() => {}}>
            <View style={{ width: 40, height: 4, backgroundColor: PD.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>Select teacher</Text>
            <FlatList
              data={teachers}
              keyExtractor={(t) => t.id}
              ListEmptyComponent={<Text style={{ color: PD.textMuted, paddingVertical: 24 }}>No teachers available.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTeacher({ id: item.id, name: item.name, subject: item.subject });
                    setTeacherPickerVisible(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: PD.cardBorder,
                  }}
                >
                  <Text style={{ color: PD.textDark, fontWeight: '800' }}>{item.name}</Text>
                  <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 4 }}>{item.subject ?? 'Teacher'}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
