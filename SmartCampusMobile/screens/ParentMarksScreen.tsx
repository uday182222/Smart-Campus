import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Calendar,
  Book,
  Target,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { StudentMarksHistory, ExamMarks, getGradeColor } from '../models/MarksModel';

const { width: screenWidth } = Dimensions.get('window');

interface ParentMarksScreenProps {
  navigation?: any;
}

const ParentMarksScreen: React.FC<ParentMarksScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const [marksHistory, setMarksHistory] = useState<StudentMarksHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'subject' | 'exam'>('all');

  useEffect(() => {
    loadMarks();
  }, []);

  const loadMarks = async () => {
    try {
      setLoading(true);
      const studentId = 'student_1';
      const res = await apiClient.get<{ data: { student: any; marks: any[]; statistics: any } }>(`/marks/student/${studentId}`);
      const data = (res as any).data;
      if (!data) {
        setMarksHistory(null);
        return;
      }
      const student = data.student ?? {};
      const marksList = data.marks ?? [];
      const stats = data.statistics ?? {};
      const exams = marksList.map((m: any, idx: number) => {
        const pct = Number(m.percentage) || 0;
        const totalMarks = m.maxMarks ?? 100;
        return {
          examId: m.examId,
          examName: m.exam?.name ?? 'Exam',
          examType: (m.exam?.examType ?? 'unit_test') as ExamMarks['examType'],
          subjectName: m.exam?.subject ?? '',
          marksObtained: m.marksObtained,
          totalMarks,
          percentage: pct,
          grade: (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D') as ExamMarks['grade'],
          rank: idx + 1,
          examDate: m.exam?.date ? new Date(m.exam.date) : new Date(),
        };
      });
      const overallPct = Number(stats.averagePercentage) || (exams.length ? exams.reduce((a, e) => a + e.percentage, 0) / exams.length : 0);
      const history: StudentMarksHistory = {
        studentId,
        studentName: student.name ?? 'Student',
        rollNumber: student.email ?? studentId,
        exams,
        overallAverage: Number(stats.averageMarks) ?? 0,
        overallPercentage: overallPct,
        trend: exams.length >= 2 && exams[0].percentage > exams[exams.length - 1].percentage ? 'declining' : exams.length >= 2 ? 'improving' : 'stable',
      };
      setMarksHistory(history);
    } catch (error) {
      console.error('❌ Error loading marks:', error);
      Alert.alert('Error', 'Failed to load marks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarks();
    setRefreshing(false);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp size={20} color="#10B981" />;
    if (trend === 'declining') return <TrendingDown size={20} color="#EF4444" />;
    return <BarChart3 size={20} color="#6B7280" />;
  };

  const renderProgressChart = (percentages: number[]) => {
    if (percentages.length === 0) return null;

    const maxValue = Math.max(...percentages, 100);
    const chartHeight = 120;
    const chartWidth = screenWidth - 80;

    return (
      <View style={[styles.chart, { height: chartHeight + 40, width: chartWidth }]}>
        {percentages.map((percentage, index) => {
          const x = (index / (percentages.length - 1)) * chartWidth;
          const y = chartHeight - (percentage / maxValue) * chartHeight;

          return (
            <View key={index}>
              <View
                style={[
                  styles.chartPoint,
                  {
                    left: x - 4,
                    top: y - 4,
                    backgroundColor: '#3B82F6',
                  },
                ]}
              />
              <Text style={[styles.chartLabel, { left: x - 10, top: y - 25 }]}>
                {Math.round(percentage)}%
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading marks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!marksHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
        <View style={styles.emptyContainer}>
          <Award size={64} color="#E5E7EB" />
          <Text style={styles.emptyText}>No marks available yet</Text>
          <Text style={styles.emptySubtext}>Marks will appear here once exams are graded</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Exam Results</Text>
        <Text style={styles.headerSubtitle}>{marksHistory.studentName}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overall Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Performance</Text>
          <View style={styles.overallCard}>
            <View style={styles.overallStat}>
              <Text style={styles.overallValue}>{Math.round(marksHistory.overallPercentage)}%</Text>
              <Text style={styles.overallLabel}>Average</Text>
            </View>
            <View style={styles.overallStat}>
              <View style={styles.trendBadge}>
                {getTrendIcon(marksHistory.trend)}
                <Text style={styles.trendText}>
                  {marksHistory.trend.charAt(0).toUpperCase() + marksHistory.trend.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.overallStat}>
              <Text style={styles.overallValue}>{marksHistory.exams.length}</Text>
              <Text style={styles.overallLabel}>Exams</Text>
            </View>
          </View>
        </View>

        {/* Progress Chart */}
        {marksHistory.exams.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Trend</Text>
            <View style={styles.chartCard}>
              {renderProgressChart(marksHistory.exams.map(e => e.percentage))}
            </View>
          </View>
        )}

        {/* Exam Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exam Results ({marksHistory.exams.length})</Text>
          {marksHistory.exams.map((exam, index) => (
            <View key={exam.examId} style={styles.examCard}>
              <View style={styles.examHeader}>
                <View style={styles.examInfo}>
                  <Text style={styles.examName}>{exam.examName}</Text>
                  <Text style={styles.examSubject}>{exam.subjectName}</Text>
                </View>
                <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(exam.grade) }]}>
                  <Text style={styles.gradeText}>{exam.grade}</Text>
                </View>
              </View>

              <View style={styles.examStats}>
                <View style={styles.examStat}>
                  <Text style={styles.examStatLabel}>Marks</Text>
                  <Text style={styles.examStatValue}>
                    {exam.marksObtained}/{exam.totalMarks}
                  </Text>
                </View>
                <View style={styles.examStat}>
                  <Text style={styles.examStatLabel}>Percentage</Text>
                  <Text style={styles.examStatValue}>{Math.round(exam.percentage)}%</Text>
                </View>
                <View style={styles.examStat}>
                  <Text style={styles.examStatLabel}>Rank</Text>
                  <Text style={styles.examStatValue}>#{exam.rank}</Text>
                </View>
              </View>

              <View style={styles.examFooter}>
                <Text style={styles.examDate}>
                  {exam.examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                {exam.percentage >= 75 ? (
                  <Text style={styles.examStatusGood}>✅ Excellent</Text>
                ) : exam.percentage >= 50 ? (
                  <Text style={styles.examStatusAvg}>⚠️ Good</Text>
                ) : (
                  <Text style={styles.examStatusPoor}>❌ Needs Improvement</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Subject-wise Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
          <View style={styles.subjectGrid}>
            {/* Group by subject and show average */}
            {Object.entries(
              marksHistory.exams.reduce((acc, exam) => {
                if (!acc[exam.subjectName]) {
                  acc[exam.subjectName] = { total: 0, count: 0, grades: [] };
                }
                acc[exam.subjectName].total += exam.percentage;
                acc[exam.subjectName].count += 1;
                acc[exam.subjectName].grades.push(exam.grade);
                return acc;
              }, {} as Record<string, { total: number; count: number; grades: string[] }>)
            ).map(([subject, data]) => {
              const average = Math.round(data.total / data.count);
              const mostCommonGrade = data.grades.sort((a, b) =>
                data.grades.filter(g => g === a).length - data.grades.filter(g => g === b).length
              ).pop() || 'N/A';

              return (
                <View key={subject} style={styles.subjectCard}>
                  <Text style={styles.subjectName}>{subject}</Text>
                  <Text style={styles.subjectAverage}>{average}%</Text>
                  <View style={[styles.subjectGrade, { backgroundColor: getGradeColor(mostCommonGrade as any) }]}>
                    <Text style={styles.subjectGradeText}>{mostCommonGrade}</Text>
                  </View>
                </View>
              );
            })}
          </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
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
  content: {
    flex: 1,
    padding: 20,
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
  overallCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  overallStat: {
    alignItems: 'center',
  },
  overallValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  overallLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chart: {
    position: 'relative',
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  examCard: {
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
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  examSubject: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  gradeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  examStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  examStat: {
    alignItems: 'center',
  },
  examStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  examStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  examFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  examDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  examStatusGood: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  examStatusAvg: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  examStatusPoor: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subjectAverage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subjectGrade: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectGradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ParentMarksScreen;




