import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import {
  Homework,
  getDueDateText,
  getDaysUntilDue,
  getHomeworkStatusColor,
  formatFileSize,
  getFileIcon,
} from '../models/HomeworkModel';

interface ParentHomeworkScreenProps {
  navigation?: any;
}

const ParentHomeworkScreen: React.FC<ParentHomeworkScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [filteredHomework, setFilteredHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'submitted'>('all');

  useEffect(() => {
    loadHomework();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [homework, filterStatus]);

  const loadHomework = async () => {
    try {
      setLoading(true);
      // In production, get classId from parent's linked student/class
      const classId = 'class_1';
      const res = await apiClient.get<{ data: { homework: any[]; className?: string } }>(`/homework/${classId}`);
      const raw = (res as any).data?.homework ?? [];
      const data: Homework[] = raw.map((hw: any) => ({
        id: hw.id,
        teacherId: hw.teacher?.id ?? '',
        teacherName: hw.teacher?.name ?? '',
        classId,
        className: (res as any).data?.className ?? '',
        subjectId: hw.subject ?? '',
        subjectName: hw.subject ?? '',
        title: hw.title,
        description: hw.description ?? '',
        dueDate: new Date(hw.dueDate),
        assignedDate: new Date(hw.createdAt ?? hw.dueDate),
        attachments: Array.isArray(hw.attachments) ? hw.attachments.map((a: any, i: number) => ({
          id: String(i),
          name: typeof a === 'string' ? a : a?.name ?? 'file',
          url: typeof a === 'string' ? a : a?.url ?? '',
          type: 'document',
          mimeType: 'application/octet-stream',
          size: 0,
          uploadedAt: new Date(),
        })) : [],
        status: (hw.status === 'active' ? 'assigned' : hw.status) as Homework['status'],
        createdAt: new Date(hw.createdAt),
        updatedAt: new Date(hw.updatedAt ?? hw.createdAt),
        version: 1,
      }));
      setHomework(data);
    } catch (error) {
      console.error('❌ Error loading homework:', error);
      Alert.alert('Error', 'Failed to load homework. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomework();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...homework];

    if (filterStatus === 'pending') {
      filtered = filtered.filter(hw => hw.status === 'assigned' && getDaysUntilDue(hw.dueDate) >= 0);
    } else if (filterStatus === 'overdue') {
      filtered = filtered.filter(hw => getDaysUntilDue(hw.dueDate) < 0);
    } else if (filterStatus === 'submitted') {
      filtered = filtered.filter(hw => hw.status === 'submitted' || hw.status === 'graded');
    }

    setFilteredHomework(filtered);
  };

  const handleDownloadAttachment = (url: string, name: string) => {
    // In production, would download file
    Alert.alert('Download', `Downloading: ${name}`);
  };

  const viewHomeworkDetail = (homework: Homework) => {
    setSelectedHomework(homework);
    setShowDetailModal(true);
  };

  const getStatusIcon = (homework: Homework) => {
    const daysUntilDue = getDaysUntilDue(homework.dueDate);
    
    if (homework.status === 'submitted' || homework.status === 'graded') {
      return <CheckCircle size={24} color="#10B981" />;
    }
    if (daysUntilDue < 0) {
      return <AlertCircle size={24} color="#EF4444" />;
    }
    if (daysUntilDue <= 1) {
      return <Clock size={24} color="#F59E0B" />;
    }
    return <BookOpen size={24} color="#3B82F6" />;
  };

  const renderHomeworkItem = ({ item }: { item: Homework }) => {
    const daysUntilDue = getDaysUntilDue(item.dueDate);
    const isOverdue = daysUntilDue < 0;

    return (
      <TouchableOpacity
        style={[styles.homeworkCard, isOverdue && styles.homeworkCardOverdue]}
        onPress={() => viewHomeworkDetail(item)}
      >
        <View style={styles.cardHeader}>
          {getStatusIcon(item)}
          <View style={styles.headerInfo}>
            <Text style={styles.subject}>{item.subjectName}</Text>
            <Text style={styles.teacher}>by {item.teacherName}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.metadata}>
          <View style={[styles.dueBadge, isOverdue && styles.dueBadgeOverdue]}>
            <Calendar size={14} color={isOverdue ? '#EF4444' : '#6B7280'} />
            <Text style={[styles.dueText, isOverdue && styles.dueTextOverdue]}>
              {getDueDateText(item.dueDate)}
            </Text>
          </View>

          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentBadge}>
              <FileText size={14} color="#6B7280" />
              <Text style={styles.attachmentText}>
                {item.attachments.length} file{item.attachments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.className}>{item.className}</Text>
          <ChevronRight size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading homework...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Homework</Text>
        <Text style={styles.headerSubtitle}>View all assignments</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{homework.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
            {homework.filter(hw => hw.status === 'assigned').length}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
            {homework.filter(hw => getDaysUntilDue(hw.dueDate) < 0).length}
          </Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {homework.filter(hw => hw.status === 'submitted' || hw.status === 'graded').length}
          </Text>
          <Text style={styles.summaryLabel}>Done</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'pending', 'overdue', 'submitted'].map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
            onPress={() => setFilterStatus(status as any)}
          >
            <Text
              style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Homework List */}
      <FlatList
        data={filteredHomework}
        renderItem={renderHomeworkItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#E5E7EB" />
            <Text style={styles.emptyStateText}>No homework found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filterStatus === 'all' ? 'No homework assigned yet' : `No ${filterStatus} homework`}
            </Text>
          </View>
        }
      />

      {/* Homework Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Homework Details</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          {selectedHomework && (
            <View style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Subject</Text>
                <Text style={styles.detailValue}>{selectedHomework.subjectName}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue}>{selectedHomework.title}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailDescription}>{selectedHomework.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>
                  {selectedHomework.dueDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.dueDateCountdown}>{getDueDateText(selectedHomework.dueDate)}</Text>
              </View>

              {selectedHomework.attachments && selectedHomework.attachments.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Attachments</Text>
                  {selectedHomework.attachments.map(attachment => (
                    <TouchableOpacity
                      key={attachment.id}
                      style={styles.attachmentItem}
                      onPress={() => handleDownloadAttachment(attachment.url, attachment.name)}
                    >
                      <Text style={styles.fileIcon}>{getFileIcon(attachment.mimeType)}</Text>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName}>{attachment.name}</Text>
                        <Text style={styles.attachmentSize}>{formatFileSize(attachment.size)}</Text>
                      </View>
                      <Download size={20} color="#3B82F6" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  setShowDetailModal(false);
                  // Navigate to submission screen
                  Alert.alert('Submit Homework', 'Submission screen would open here');
                }}
              >
                <Text style={styles.submitButtonText}>Submit Homework</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
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
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  header: {
    backgroundColor: '#3B82F6',
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  homeworkCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  homeworkCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  teacher: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  dueBadgeOverdue: {
    backgroundColor: '#FEE2E2',
  },
  dueText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  dueTextOverdue: {
    color: '#EF4444',
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  attachmentText: {
    fontSize: 13,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  className: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B82F6',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalClose: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  detailDescription: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
  },
  dueDateCountdown: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  attachmentInfo: {
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
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ParentHomeworkScreen;




