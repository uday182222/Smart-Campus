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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useHomeworkStore } from '../stores/homeworkStore';
import { Homework, HomeworkStats, HomeworkSubmission } from '../models/HomeworkModel';

const HomeworkScreen: React.FC = () => {
  const { userData } = useAuth();
  
  // Zustand store
  const {
    homework,
    stats,
    selectedHomework,
    submissions,
    loading,
    creating,
    error,
    createForm,
    setSelectedHomework,
    updateCreateForm,
    resetCreateForm,
    loadHomework,
    loadStats,
    loadSubmissions,
    createHomework,
    updateHomework,
    deleteHomework,
    refresh,
  } = useHomeworkStore();

  // Local UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

  useEffect(() => {
    const teacherId = userData?.userId || 'teacher_1';
    loadHomework(teacherId);
    loadStats(teacherId);
  }, [userData?.userId]);

  const handleCreateHomework = async () => {
    if (!createForm.title || !createForm.description || !createForm.subject || !createForm.classId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const result = await createHomework({
      classId: createForm.classId,
      subject: createForm.subject,
      title: createForm.title,
      description: createForm.description,
      dueDate: createForm.dueDate,
      attachments: createForm.attachments,
    });

    if (result.success) {
      setShowCreateModal(false);
      resetCreateForm();
      Alert.alert('Success', 'Homework created successfully');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleViewSubmissions = async (homeworkItem: Homework) => {
    try {
      await loadSubmissions(homeworkItem.id);
      setSelectedHomework(homeworkItem);
      setShowSubmissionsModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load submissions');
    }
  };

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    try {
      // TODO: Implement when API endpoint is available
      // const result = await HomeworkService.gradeSubmission(submissionId, grade, feedback, 'teacher_1');
      
      // if (result.success && selectedHomework) {
      //   await handleViewSubmissions(selectedHomework);
      //   const teacherId = userData?.userId || 'teacher_1';
      //   await refresh(teacherId);
      //   Alert.alert('Success', 'Submission graded successfully');
      // } else {
      //   Alert.alert('Error', result.message);
      // }
      Alert.alert('Info', 'Grading feature coming soon');
    } catch (error) {
      Alert.alert('Error', 'Failed to grade submission');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6366F1';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#10B981';
      case 'late': return '#F59E0B';
      case 'graded': return '#6366F1';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isOverdue = (dueDate: Date) => {
    return new Date() > dueDate;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading homework data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📝 Homework Management</Text>
        <Text style={styles.headerSubtitle}>Assign and grade student homework</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalAssigned}</Text>
              <Text style={styles.statLabel}>Total Assigned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pendingSubmissions}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.gradedSubmissions}</Text>
              <Text style={styles.statLabel}>Graded</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.averageGrade}%</Text>
              <Text style={styles.statLabel}>Avg Grade</Text>
            </View>
          </View>
        )}

        {/* Create Homework Button */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create New Homework</Text>
        </TouchableOpacity>

        {/* Homework List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Homework ({homework.length})</Text>
          {homework.map((item) => (
            <View key={item.id} style={styles.homeworkCard}>
              <View style={styles.homeworkHeader}>
                <Text style={styles.homeworkTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.homeworkSubject}>{item.subject} • {item.className}</Text>
              <Text style={styles.homeworkDescription}>{item.description}</Text>
              
              <View style={styles.homeworkFooter}>
                <Text style={styles.dueDate}>
                  Due: {formatDate(item.dueDate)}
                  {isOverdue(item.dueDate) && item.status === 'active' && (
                    <Text style={styles.overdueText}> (OVERDUE)</Text>
                  )}
                </Text>
                <Text style={styles.submissionCount}>
                  {item.submissions.length} submissions
                </Text>
              </View>

              <View style={styles.homeworkActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleViewSubmissions(item)}
                >
                  <Text style={styles.actionButtonText}>View Submissions</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => console.log('Edit homework')}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Create Homework Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Homework</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Homework Title"
              value={createForm.title}
              onChangeText={(text) => updateCreateForm({ title: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={createForm.description}
              onChangeText={(text) => updateCreateForm({ description: text })}
              multiline
              numberOfLines={4}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Subject"
              value={createForm.subject}
              onChangeText={(text) => updateCreateForm({ subject: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createModalButton}
                onPress={handleCreateHomework}
              >
                <Text style={styles.createModalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        visible={showSubmissionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubmissionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Submissions - {selectedHomework?.title}
            </Text>
            
            <FlatList
              data={submissions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.submissionCard}>
                  <View style={styles.submissionHeader}>
                    <Text style={styles.studentName}>{item.studentName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getSubmissionStatusColor(item.status) }]}>
                      <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.submissionDate}>
                    Submitted: {formatDate(item.submittedDate)}
                  </Text>
                  
                  {item.content && (
                    <Text style={styles.submissionContent}>{item.content}</Text>
                  )}
                  
                  {item.grade !== undefined && (
                    <View style={styles.gradeContainer}>
                      <Text style={styles.gradeText}>Grade: {item.grade}%</Text>
                      {item.feedback && (
                        <Text style={styles.feedbackText}>Feedback: {item.feedback}</Text>
                      )}
                    </View>
                  )}
                  
                  {item.status === 'submitted' && (
                    <View style={styles.gradeActions}>
                      <TextInput
                        style={styles.gradeInput}
                        placeholder="Grade (0-100)"
                        keyboardType="numeric"
                        onChangeText={(text) => {
                          const grade = parseInt(text);
                          if (grade >= 0 && grade <= 100) {
                            // Handle grade input
                          }
                        }}
                      />
                      <TextInput
                        style={styles.feedbackInput}
                        placeholder="Feedback"
                        multiline
                        numberOfLines={2}
                      />
                      <TouchableOpacity 
                        style={styles.gradeButton}
                        onPress={() => gradeSubmission(item.id, 85, 'Good work!')}
                      >
                        <Text style={styles.gradeButtonText}>Grade</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            />
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowSubmissionsModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
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
    color: '#6366F1',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#6366F1',
    padding: 20,
    paddingTop: 10,
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
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  homeworkCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  homeworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  homeworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  homeworkSubject: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 8,
  },
  homeworkDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  homeworkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dueDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  overdueText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  submissionCount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  homeworkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createModalButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  createModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submissionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  submissionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  submissionContent: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  gradeContainer: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#6b7280',
  },
  gradeActions: {
    marginTop: 8,
  },
  gradeInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    fontSize: 14,
    height: 60,
    textAlignVertical: 'top',
  },
  gradeButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  gradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#6366F1',
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

export default HomeworkScreen;