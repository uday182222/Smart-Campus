// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Save,
  X,
  Upload,
  Calendar,
  Book,
  Users,
  FileText,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { Homework, HomeworkAttachment, validateHomework } from '../models/HomeworkModel';
import DateTimePicker from '@react-native-community/datetimepicker';

interface HomeworkCreateScreenProps {
  navigation: any;
  route?: any;
}

const HomeworkCreateScreen: React.FC<HomeworkCreateScreenProps> = ({ navigation, route }) => {
  const { userData } = useAuth();
  const editingHomework = route?.params?.homework as Homework | undefined;

  const [title, setTitle] = useState(editingHomework?.title || '');
  const [description, setDescription] = useState(editingHomework?.description || '');
  const [selectedSubject, setSelectedSubject] = useState(editingHomework?.subjectId || '');
  const [selectedClass, setSelectedClass] = useState(editingHomework?.classId || '');
  const [dueDate, setDueDate] = useState(editingHomework?.dueDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attachments, setAttachments] = useState<HomeworkAttachment[]>(editingHomework?.attachments || []);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  const subjects = [
    { id: 'sub_1', name: 'Mathematics' },
    { id: 'sub_2', name: 'Science' },
    { id: 'sub_3', name: 'English' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<{ data: { classes: Array<{ id: string; name: string; section?: string }> } }>('/classes/today');
        const list = (res as any).data?.classes ?? [];
        setClasses(list.map((c: any) => ({ id: c.id, name: c.section ? `${c.name} ${c.section}` : c.name })));
      } catch (e) {
        console.error('Load classes:', e);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Prepare homework data
      const className = classes.find(c => c.id === selectedClass)?.name || '';
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name || '';

      const validation = validateHomework({
        title,
        description,
        subjectId: selectedSubject,
        subjectName,
        classId: selectedClass,
        className,
        dueDate,
        attachments,
      });
      if (!validation.valid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        setSaving(false);
        return;
      }

      const dueDateStr = dueDate.toISOString().split('T')[0];
      const attachmentUrls = attachments.map(a => a.url);

      if (editingHomework) {
        await apiClient.put(`/homework/${editingHomework.id}`, {
          subject: subjectName || selectedSubject,
          title,
          description,
          dueDate: dueDate.toISOString(),
          attachments: attachmentUrls,
        });
        Alert.alert('Success', 'Homework updated successfully!');
        navigation.goBack();
      } else {
        await apiClient.post('/homework', {
          classId: selectedClass,
          subject: subjectName || selectedSubject,
          title,
          description,
          dueDate: dueDate.toISOString(),
          attachments: attachmentUrls,
        });
        Alert.alert('Success', 'Homework created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('❌ Error saving homework:', error);
      Alert.alert('Error', 'Failed to save homework. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async () => {
    // Mock file picker - in production would use DocumentPicker
    Alert.alert('File Upload', 'File picker would open here', [
      {
        text: 'Simulate PDF Upload',
        onPress: () => {
          const mockFile: HomeworkAttachment = {
            id: Date.now().toString(),
            name: 'Assignment.pdf',
            url: 'https://example.com/file.pdf',
            type: 'pdf',
            mimeType: 'application/pdf',
            size: 1024 * 500, // 500KB
            uploadedAt: new Date(),
          };
          setAttachments([...attachments, mockFile]);
        },
      },
      {
        text: 'Simulate Image Upload',
        onPress: () => {
          const mockFile: HomeworkAttachment = {
            id: Date.now().toString(),
            name: 'Diagram.jpg',
            url: 'https://example.com/image.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            size: 1024 * 300, // 300KB
            uploadedAt: new Date(),
          };
          setAttachments([...attachments, mockFile]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeAttachment = (id: string) => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setAttachments(attachments.filter(att => att.id !== id)),
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    return `${Math.round(bytes / 1024)}KB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <X size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editingHomework ? 'Edit Homework' : 'Create Homework'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saving}
        >
          <Save size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter homework title"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          <Text style={styles.charCount}>{title.length}/200</Text>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.label}>Subject *</Text>
          <View style={styles.pickerContainer}>
            <Book size={20} color="#6B7280" />
            <View style={styles.picker}>
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.pickerOption,
                    selectedSubject === subject.id && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setSelectedSubject(subject.id)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedSubject === subject.id && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Class */}
        <View style={styles.section}>
          <Text style={styles.label}>Class *</Text>
          <View style={styles.pickerContainer}>
            <Users size={20} color="#6B7280" />
            <View style={styles.picker}>
              {classes.map(cls => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.pickerOption,
                    selectedClass === cls.id && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setSelectedClass(cls.id)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedClass === cls.id && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.dateButtonText}>
              {dueDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDueDate(selectedDate);
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter homework description and instructions"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={5000}
          />
          <Text style={styles.charCount}>{description.length}/5000</Text>
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <Text style={styles.label}>Attachments (Max 5 files, 10MB each)</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleFileUpload}
            disabled={attachments.length >= 5}
          >
            <Upload size={20} color={attachments.length >= 5 ? '#9CA3AF' : '#3B82F6'} />
            <Text
              style={[
                styles.uploadButtonText,
                attachments.length >= 5 && styles.uploadButtonTextDisabled,
              ]}
            >
              Upload File
            </Text>
          </TouchableOpacity>

          {attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {attachments.map(attachment => (
                <View key={attachment.id} style={styles.attachmentItem}>
                  <View style={styles.attachmentInfo}>
                    <FileText size={20} color="#3B82F6" />
                    <View style={styles.attachmentDetails}>
                      <Text style={styles.attachmentName}>{attachment.name}</Text>
                      <Text style={styles.attachmentSize}>
                        {formatFileSize(attachment.size)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(attachment.id)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : editingHomework ? 'Update' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B82F6',
    padding: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  picker: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  pickerOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1e293b',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 16,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  uploadButtonTextDisabled: {
    color: '#9CA3AF',
  },
  attachmentList: {
    marginTop: 12,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default HomeworkCreateScreen;




