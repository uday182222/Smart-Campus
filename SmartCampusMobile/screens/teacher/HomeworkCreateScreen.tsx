/**
 * Teacher New Homework — dark + accent: class chips, subject/title/description, due date, attach file.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon, ChevronLeft, Paperclip, Send, FileText, XCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import { ClassService } from '../../services/ClassService';
import { T } from '../../constants/theme';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

const API = apiClient as any;

export default function HomeworkCreateScreen() {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<Array<{ id: string; name: string; section?: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await ClassService.getTeacherClasses();
      if (res.success && res.data?.length) {
        const list = (res.data as any[]).map((c: any) => ({
          id: c.id,
          name: `${c.name || ''} ${c.section || ''}`.trim() || c.id,
        }));
        setClasses(list);
        if (list.length > 0 && !selectedClassId) setSelectedClassId(list[0].id);
      }
    })();
  }, []);

  const pickFile = async () => {
    try {
      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      setFileUri(file.uri);
      setFileName(file.name || 'File');
    } catch (_e) {
      Alert.alert('Info', 'File attachment requires expo-document-picker.');
    }
  };

  const save = async () => {
    if (!selectedClassId || !subject.trim() || !title.trim()) {
      Alert.alert('Error', 'Please select class, enter subject and title.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/homework', {
        classId: selectedClassId,
        subject: subject.trim(),
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.toISOString(),
        attachments: fileUri ? [fileUri] : undefined,
      });
      Alert.alert('Success', 'Homework assigned.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to assign homework');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: T.card,
    borderRadius: T.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: T.textDark,
    fontSize: 16,
    borderWidth: 1,
    borderColor: T.inputBorder,
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
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
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>New Homework</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 8, ...T.shadowMd }}>
        <Text style={{ color: T.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Class</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: T.px, gap: 8, paddingVertical: 4 }}
        >
          {classes.map((c) => {
            const isActive = selectedClassId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedClassId(c.id)}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: isActive ? T.primary : T.card,
                  borderWidth: 1.5,
                  borderColor: isActive ? T.primary : T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#FFFFFF' : T.textDark }}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={{ color: T.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 }}>Subject</Text>
        <TextInput
          style={inputStyle}
          placeholder="e.g. Mathematics"
          placeholderTextColor={T.textPlaceholder}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={{ color: T.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>Title</Text>
        <TextInput
          style={inputStyle}
          placeholder="Homework title"
          placeholderTextColor={T.textPlaceholder}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={{ color: T.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>Description</Text>
        <TextInput
          style={[inputStyle, { minHeight: 100, textAlignVertical: 'top', paddingTop: 14 }]}
          placeholder="Instructions for students..."
          placeholderTextColor={T.textPlaceholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={{ color: T.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>Due Date</Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={{ backgroundColor: T.card, borderRadius: T.radius.lg, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.inputBorder }}
        >
          <CalendarIcon size={20} color={T.primary} strokeWidth={1.8} style={{ marginRight: 12 }} />
          <Text style={{ color: T.textDark, fontSize: 16, flex: 1 }}>{dueDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}</Text>
          <Text style={{ color: T.textMuted, fontWeight: '800' }}>▾</Text>
        </Pressable>
        {showDatePicker && (
          <Modal transparent animationType="fade">
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setShowDatePicker(false)}>
              <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                {(() => {
                  try {
                    const DateTimePicker = require('@react-native-community/datetimepicker').default;
                    return (
                      <DateTimePicker
                        value={dueDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_: any, d?: Date) => {
                          setShowDatePicker(Platform.OS !== 'ios');
                          if (d) setDueDate(d);
                        }}
                        textColor={T.textDark}
                      />
                    );
                  } catch (_e) {
                    return <Text style={{ color: '#94A3B8', marginBottom: 12 }}>{dueDate.toLocaleDateString()}</Text>;
                  }
                })()}
                <LightButton label="Done" onPress={() => setShowDatePicker(false)} variant="primary" />
              </View>
            </Pressable>
          </Modal>
        )}

        <Text style={{ color: T.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>Attach File</Text>
        <LightButton label="Attach File" onPress={pickFile} variant="outline" icon="attach-outline" iconPosition="left" />
        {fileUri && fileName ? (
          <View style={{ backgroundColor: T.primaryLight, borderRadius: 12, padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.inputBorder }}>
            <FileText size={18} color={T.primary} strokeWidth={1.8} style={{ marginRight: 10 }} />
            <Text style={{ color: T.textDark, fontSize: 14, flex: 1 }} numberOfLines={1}>{fileName}</Text>
            <TouchableOpacity onPress={() => { setFileUri(null); setFileName(''); }}>
              <XCircle size={22} color={T.textPlaceholder} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        ) : null}

        <LightButton
          label="Assign Homework"
          onPress={save}
          variant="primary"
          icon="send-outline"
          iconPosition="left"
          style={{ marginTop: 24 }}
          loading={saving}
        />
        </View>
      </ScrollView>
      <TeacherFloatingNav navigation={navigation} activeTab="TeacherHomework" />
    </View>
  );
}
