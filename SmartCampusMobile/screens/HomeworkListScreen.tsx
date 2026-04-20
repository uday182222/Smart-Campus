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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Users,
  FileText,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import {
  Homework,
  HomeworkFilters,
  getHomeworkStatusColor,
  getDueDateText,
  isHomeworkOverdue,
} from '../models/HomeworkModel';

interface HomeworkListScreenProps {
  navigation: any;
}

const HomeworkListScreen: React.FC<HomeworkListScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [filteredHomework, setFilteredHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | undefined>();
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadClassesAndHomework();
  }, []);

  const loadClassesAndHomework = async () => {
    try {
      const res = await apiClient.get<{ data: { classes: Array<{ id: string; name: string; section?: string }> } }>('/classes/today');
      const list = (res as any).data?.classes ?? [];
      setClasses(list.map((c: any) => ({ id: c.id, name: c.section ? `${c.name} ${c.section}` : c.name })));
      const firstId = list[0]?.id;
      if (firstId && !selectedClass) setSelectedClass(firstId);
      await loadHomework(firstId ?? selectedClass);
    } catch (e) {
      console.error('Load classes:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) loadHomework(selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    applyFilters();
  }, [homework, searchTerm, selectedClass, selectedSubject]);

  const loadHomework = async (classIdOverride?: string) => {
    const classId = classIdOverride ?? selectedClass ?? classes[0]?.id;
    if (!classId) {
      setHomework([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: { homework: any[] } }>(`/homework/${classId}`);
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

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        hw =>
          hw.title.toLowerCase().includes(term) ||
          hw.description.toLowerCase().includes(term)
      );
    }

    if (selectedClass) {
      filtered = filtered.filter(hw => hw.classId === selectedClass);
    }

    if (selectedSubject) {
      filtered = filtered.filter(hw => hw.subjectId === selectedSubject);
    }

    // Sort by due date
    filtered.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    setFilteredHomework(filtered);
  };

  const handleDelete = async (homeworkId: string) => {
    Alert.alert(
      'Delete Homework',
      'Are you sure you want to delete this homework? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/homework/${homeworkId}`);
              Alert.alert('Success', 'Homework deleted successfully');
              loadHomework();
            } catch {
              Alert.alert('Error', 'Failed to delete homework');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (homework: Homework) => {
    navigation.navigate('HomeworkCreate', { homework });
  };

  const getStatusIcon = (homework: Homework) => {
    if (isHomeworkOverdue(homework)) {
      return <AlertCircle size={20} color="#EF4444" />;
    }
    if (homework.status === 'graded') {
      return <CheckCircle size={20} color="#10B981" />;
    }
    return <Clock size={20} color="#F59E0B" />;
  };

  const renderHomeworkItem = ({ item }: { item: Homework }) => (
    <View style={styles.homeworkCard}>
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge}>
          {getStatusIcon(item)}
          <Text
            style={[
              styles.statusText,
              { color: getHomeworkStatusColor(item.status) },
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={styles.actionButton}
          >
            <Edit size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.actionButton}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.metadata}>
        <View style={styles.metadataItem}>
          <Users size={16} color="#6B7280" />
          <Text style={styles.metadataText}>{item.className}</Text>
        </View>
        <View style={styles.metadataItem}>
          <FileText size={16} color="#6B7280" />
          <Text style={styles.metadataText}>{item.subjectName}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dueDateContainer}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.dueDateText}>{getDueDateText(item.dueDate)}</Text>
        </View>
        {item.attachments && item.attachments.length > 0 && (
          <Text style={styles.attachmentCount}>
            📎 {item.attachments.length} file{item.attachments.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>-%</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>
    </View>
  );

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
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('HomeworkCreate')}
        >
          <Plus size={20} color="white" />
          <Text style={styles.createButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{homework.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {homework.filter(hw => isHomeworkOverdue(hw)).length}
          </Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {homework.filter(hw => hw.status === 'assigned').length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
      </View>

      {/* Class picker & Filters */}
      <View style={styles.filterContainer}>
        {classes.length > 1 && (
          <View style={styles.classPickerWrap}>
            <Text style={styles.classPickerLabel}>Class:</Text>
            <View style={styles.classPickerRow}>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.classPickerBtn, selectedClass === c.id && styles.classPickerBtnActive]}
                  onPress={() => setSelectedClass(c.id)}
                >
                  <Text style={[styles.classPickerBtnText, selectedClass === c.id && styles.classPickerBtnTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#6B7280" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <Text style={styles.searchPlaceholder}>Search homework...</Text>
        </View>
      </View>

      {/* List */}
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
            <FileText size={64} color="#E5E7EB" />
            <Text style={styles.emptyStateText}>No homework found</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first homework assignment
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('HomeworkCreate')}
            >
              <Plus size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>Create Homework</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B82F6',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  classPickerWrap: {
    marginBottom: 12,
  },
  classPickerLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  classPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classPickerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  classPickerBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  classPickerBtnText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  classPickerBtnTextActive: {
    color: 'white',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
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
    marginBottom: 12,
    lineHeight: 20,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
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
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  attachmentCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default HomeworkListScreen;




