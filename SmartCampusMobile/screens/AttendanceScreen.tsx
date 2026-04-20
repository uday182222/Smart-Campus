// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, CheckCircle, XCircle, Clock, Users, Save, RotateCcw, Calendar as CalendarIcon, BarChart3 } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAttendanceStore } from '../stores/attendanceStore';
import { AttendanceStatus, ClassAttendance } from '../models/AttendanceModel';

const AttendanceScreen: React.FC = () => {
  const { userData } = useAuth();
  
  // Zustand store
  const {
    classes,
    selectedClass,
    attendanceRecords,
    summary,
    selectedDate,
    pendingChanges,
    loading,
    saving,
    refreshing,
    error,
    setSelectedClass,
    setSelectedDate,
    markAttendance,
    saveAttendance: saveAttendanceToStore,
    loadClasses,
    loadClassAttendance,
    loadSummary,
    refresh,
  } = useAttendanceStore();

  // Local UI state
  const [showClassModal, setShowClassModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'present' | 'absent' | null>(null);

  useEffect(() => {
    const teacherId = userData?.userId || 'teacher_1';
    loadClasses(teacherId);
    loadSummary(teacherId);
  }, [userData?.userId]);

  useEffect(() => {
    if (selectedClass) {
      loadClassAttendance(selectedClass.id, selectedDate);
    }
  }, [selectedClass, selectedDate]);

  const handleSaveAttendance = async () => {
    if (!selectedClass || pendingChanges.size === 0) return;

    const teacherId = userData?.userId || 'teacher_1';
    const result = await saveAttendanceToStore(
      selectedClass.id,
      selectedDate,
      teacherId,
      selectedClass.subject,
      selectedClass.students
    );

    if (result.success) {
      // Send notifications to parents of absent/late students
      const notificationsToSend = Array.from(pendingChanges.entries())
        .filter(([_, status]) => status === 'absent' || status === 'late')
        .map(([studentId, status]) => {
          const student = selectedClass.students.find(s => s.id === studentId);
          return {
            studentId,
            studentName: student?.name || 'Unknown',
            parentId: `parent_${studentId}`, // In production, fetch from user record
            date: selectedDate,
            reason: status === 'absent' ? 'Absent from school' : 'Late to school',
          };
        });

      // Server sends absence notifications when marking attendance

      const notifCount = notificationsToSend.length;
      const message = notifCount > 0 
        ? `Attendance saved and ${notifCount} parent notification(s) sent!`
        : 'Attendance saved successfully';
      
      Alert.alert('Success', message);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const bulkMarkAttendance = async (status: 'present' | 'absent') => {
    if (!selectedClass) return;

    try {
      setSaving(true);
      selectedClass.students.forEach(s => markAttendance(s.id, status));
      const result = await saveAttendanceToStore(
        selectedClass.id,
        selectedDate,
        userData?.userId || 'teacher_1',
        selectedClass.subject,
        selectedClass.students
      );
      if (result.success) {
        Alert.alert('Success', `All students marked as ${status}`);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('❌ Error bulk marking attendance:', error);
      Alert.alert('Error', 'Failed to bulk mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = async () => {
    const teacherId = userData?.userId || 'teacher_1';
    if (selectedClass) {
      await refresh(teacherId, selectedClass.id, selectedDate);
    }
  };

  const canEditPastAttendance = (date: Date): boolean => {
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Allow editing within 7 days
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'absent': return '#EF4444';
      case 'late': return '#F59E0B';
      case 'excused': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      case 'excused': return '📝';
      default: return '⭕';
    }
  };

  const getCurrentStatus = (studentId: string): AttendanceStatus => {
    // Check pending changes first
    if (pendingChanges.has(studentId)) {
      return pendingChanges.get(studentId)!;
    }
    
    // Check existing records
    const existingRecord = attendanceRecords.find(record => record.studentId === studentId);
    return existingRecord?.status || 'not_marked';
  };

  const handleClassSelect = (classItem: ClassAttendance) => {
    setSelectedClass(classItem);
    setShowClassModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>📊 Attendance Management</Text>
            <Text style={styles.headerSubtitle}>Track and manage student attendance</Text>
          </View>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => {
              // Navigate to history screen - this would be handled by navigation prop in real app
              console.log('Navigate to attendance history');
            }}
          >
            <BarChart3 size={20} color="white" />
            <Text style={styles.historyButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        {summary && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <CheckCircle size={24} color="#10B981" />
              <Text style={styles.summaryNumber}>{summary.todayPresent}</Text>
              <Text style={styles.summaryLabel}>Present Today</Text>
            </View>
            <View style={styles.summaryCard}>
              <XCircle size={24} color="#EF4444" />
              <Text style={styles.summaryNumber}>{summary.todayAbsent}</Text>
              <Text style={styles.summaryLabel}>Absent Today</Text>
            </View>
            <View style={styles.summaryCard}>
              <Clock size={24} color="#F59E0B" />
              <Text style={styles.summaryNumber}>{summary.todayLate}</Text>
              <Text style={styles.summaryLabel}>Late Today</Text>
            </View>
            <View style={styles.summaryCard}>
              <Users size={24} color="#3B82F6" />
              <Text style={styles.summaryNumber}>{summary.attendancePercentage}%</Text>
              <Text style={styles.summaryLabel}>Attendance Rate</Text>
            </View>
          </View>
        )}

        {/* Class Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Class</Text>
          <TouchableOpacity 
            style={styles.classSelector}
            onPress={() => setShowClassModal(true)}
          >
            <Text style={styles.classSelectorText}>
              {selectedClass ? selectedClass.name : 'Select a class'}
            </Text>
            <Text style={styles.classSelectorIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDateModal(true)}
            disabled={!canEditPastAttendance(selectedDate)}
          >
            <CalendarIcon size={20} color="#6B7280" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            {!canEditPastAttendance(selectedDate) && (
              <Text style={styles.dateWarningText}>Read Only</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bulk Actions */}
        {selectedClass && canEditPastAttendance(selectedDate) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bulk Actions</Text>
            <View style={styles.bulkActionsContainer}>
              <TouchableOpacity
                style={[styles.bulkButton, styles.bulkPresentButton]}
                onPress={() => {
                  setBulkAction('present');
                  setShowConfirmModal(true);
                }}
              >
                <CheckCircle size={20} color="white" />
                <Text style={styles.bulkButtonText}>Mark All Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkButton, styles.bulkAbsentButton]}
                onPress={() => {
                  setBulkAction('absent');
                  setShowConfirmModal(true);
                }}
              >
                <XCircle size={20} color="white" />
                <Text style={styles.bulkButtonText}>Mark All Absent</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Save Button */}
        {pendingChanges.size > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveAttendance}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Save size={20} color="white" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : `Save Changes (${pendingChanges.size})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Attendance List */}
        {selectedClass && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Students ({selectedClass.students.length})</Text>
            <View style={styles.studentsList}>
              {selectedClass.students.map((student) => {
                const currentStatus = getCurrentStatus(student.id);
                const isReadOnly = !canEditPastAttendance(selectedDate);
                
                return (
                  <View key={student.id} style={styles.studentCard}>
                    <View style={styles.studentInfo}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {student.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.studentDetails}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentRoll}>Roll: {student.rollNumber}</Text>
                      </View>
                    </View>
                    
                    {!isReadOnly && (
                      <View style={styles.statusContainer}>
                        <TouchableOpacity
                          style={[
                            styles.statusButton, 
                            { backgroundColor: getStatusColor('present') },
                            currentStatus === 'present' && styles.statusButtonActive
                          ]}
                          onPress={() => markAttendance(student.id, 'present')}
                        >
                          <CheckCircle size={16} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.statusButton, 
                            { backgroundColor: getStatusColor('late') },
                            currentStatus === 'late' && styles.statusButtonActive
                          ]}
                          onPress={() => markAttendance(student.id, 'late')}
                        >
                          <Clock size={16} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.statusButton, 
                            { backgroundColor: getStatusColor('absent') },
                            currentStatus === 'absent' && styles.statusButtonActive
                          ]}
                          onPress={() => markAttendance(student.id, 'absent')}
                        >
                          <XCircle size={16} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.statusButton, 
                            { backgroundColor: getStatusColor('excused') },
                            currentStatus === 'excused' && styles.statusButtonActive
                          ]}
                          onPress={() => markAttendance(student.id, 'excused')}
                        >
                          <Text style={styles.statusButtonText}>📝</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <View style={styles.currentStatus}>
                      <Text style={styles.currentStatusIcon}>{getStatusIcon(currentStatus)}</Text>
                      <Text style={[styles.currentStatusText, { color: getStatusColor(currentStatus) }]}>
                        {currentStatus.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Class</Text>
            <FlatList
              data={classes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    handleClassSelect(item);
                    loadClassAttendance(item.id, selectedDate);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Text style={styles.modalItemSubtext}>{item.students.length} students</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowClassModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Selection Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <Text style={styles.modalSubtitle}>
              You can edit attendance for the past 7 days
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Bulk Action</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to mark all students as {bulkAction}?
            </Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => {
                  if (bulkAction) {
                    bulkMarkAttendance(bulkAction);
                    setShowConfirmModal(false);
                  }
                }}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 20,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  classSelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  classSelectorText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  classSelectorIcon: {
    fontSize: 12,
    color: '#6b7280',
  },
  dateSelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
    flex: 1,
  },
  dateWarningText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  bulkPresentButton: {
    backgroundColor: '#10B981',
  },
  bulkAbsentButton: {
    backgroundColor: '#EF4444',
  },
  bulkButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  studentsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  studentRoll: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusContainer: {
    flexDirection: 'row',
    marginRight: 12,
    gap: 4,
  },
  statusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonActive: {
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statusButtonText: {
    fontSize: 14,
    color: 'white',
  },
  currentStatus: {
    alignItems: 'center',
    minWidth: 80,
  },
  currentStatusIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  currentStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#3B82F6',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttendanceScreen;
