// @ts-nocheck
/**
 * Smart Campus - Parent Marks Screen
 * View child's academic performance with charts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart, ProgressChart } from 'react-native-chart-kit';

// Theme & Components
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Card, Avatar } from '../../components/ui';

// Services
import { MarksService } from '../../services/MarksService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================
interface SubjectMarks {
  subject: string;
  marks: number;
  maxMarks: number;
  grade: string;
  rank?: number;
}

interface ExamResult {
  id: string;
  examName: string;
  examType: string;
  date: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  subjects: SubjectMarks[];
}

interface PerformanceTrend {
  labels: string[];
  data: number[];
}

// ============================================================================
// COMPONENT
// ============================================================================
const MarksScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend | null>(null);
  const [overallStats, setOverallStats] = useState({
    averagePercentage: 0,
    highestPercentage: 0,
    lowestPercentage: 0,
    totalExams: 0,
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const fetchMarksData = async () => {
    try {
      const result = await MarksService.getInstance().getStudentMarks('current');
      
      if (result.success && result.data?.length) {
        const results = result.data;
        setExamResults(results);
        setSelectedExam(results[0]);
        
        // Calculate stats
        const percentages = results.map((e: ExamResult) => e.percentage);
        setOverallStats({
          averagePercentage: Math.round(percentages.reduce((a: number, b: number) => a + b, 0) / percentages.length),
          highestPercentage: Math.max(...percentages),
          lowestPercentage: Math.min(...percentages),
          totalExams: results.length,
        });
        
        // Create trend data
        setPerformanceTrend({
          labels: results.slice(-5).map((e: ExamResult) => e.examName.substring(0, 3)),
          data: results.slice(-5).map((e: ExamResult) => e.percentage),
        });
      } else {
        // Demo data
        const demoResults: ExamResult[] = [
          {
            id: '1',
            examName: 'Final Exam',
            examType: 'Term',
            date: '2025-01-15',
            totalMarks: 500,
            obtainedMarks: 425,
            percentage: 85,
            grade: 'A',
            subjects: [
              { subject: 'Mathematics', marks: 88, maxMarks: 100, grade: 'A' },
              { subject: 'Science', marks: 82, maxMarks: 100, grade: 'A' },
              { subject: 'English', marks: 85, maxMarks: 100, grade: 'A' },
              { subject: 'History', marks: 78, maxMarks: 100, grade: 'B+' },
              { subject: 'Geography', marks: 92, maxMarks: 100, grade: 'A+' },
            ],
          },
          {
            id: '2',
            examName: 'Mid Term',
            examType: 'Term',
            date: '2024-11-10',
            totalMarks: 500,
            obtainedMarks: 410,
            percentage: 82,
            grade: 'A',
            subjects: [
              { subject: 'Mathematics', marks: 85, maxMarks: 100, grade: 'A' },
              { subject: 'Science', marks: 80, maxMarks: 100, grade: 'A' },
              { subject: 'English', marks: 82, maxMarks: 100, grade: 'A' },
              { subject: 'History', marks: 75, maxMarks: 100, grade: 'B+' },
              { subject: 'Geography', marks: 88, maxMarks: 100, grade: 'A' },
            ],
          },
          {
            id: '3',
            examName: 'Unit Test 2',
            examType: 'Unit',
            date: '2024-10-05',
            totalMarks: 200,
            obtainedMarks: 156,
            percentage: 78,
            grade: 'B+',
            subjects: [
              { subject: 'Mathematics', marks: 38, maxMarks: 50, grade: 'B+' },
              { subject: 'Science', marks: 42, maxMarks: 50, grade: 'A' },
              { subject: 'English', marks: 36, maxMarks: 50, grade: 'B' },
              { subject: 'History', marks: 40, maxMarks: 50, grade: 'A' },
            ],
          },
        ];
        
        setExamResults(demoResults);
        setSelectedExam(demoResults[0]);
        
        setOverallStats({
          averagePercentage: 82,
          highestPercentage: 85,
          lowestPercentage: 78,
          totalExams: 3,
        });
        
        setPerformanceTrend({
          labels: ['Unit1', 'Unit2', 'Mid', 'Final'],
          data: [75, 78, 82, 85],
        });
      }
    } catch (error) {
      console.error('Error fetching marks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarksData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMarksData();
  }, []);

  // ============================================================================
  // HELPERS
  // ============================================================================
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return colors.success.dark;
      case 'A': return colors.success.main;
      case 'B+': return colors.secondary.main;
      case 'B': return colors.primary.main;
      case 'C': return colors.warning.main;
      case 'D': return colors.error.light;
      case 'F': return colors.error.main;
      default: return colors.text.secondary;
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  const renderHeader = () => (
    <LinearGradient
      colors={['#9C27B0', '#7B1FA2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Academic Performance</Text>
        
        <View style={styles.headerButton} />
      </View>
    </LinearGradient>
  );

  const renderOverallStats = () => (
    <Card variant="elevated" style={styles.statsCard}>
      <Text style={styles.statsTitle}>Overall Performance</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary.main }]}>
            {overallStats.averagePercentage}%
          </Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success.main }]}>
            {overallStats.highestPercentage}%
          </Text>
          <Text style={styles.statLabel}>Highest</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning.main }]}>
            {overallStats.lowestPercentage}%
          </Text>
          <Text style={styles.statLabel}>Lowest</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.secondary.main }]}>
            {overallStats.totalExams}
          </Text>
          <Text style={styles.statLabel}>Exams</Text>
        </View>
      </View>
    </Card>
  );

  const renderTrendChart = () => {
    if (!performanceTrend) return null;

    return (
      <Card variant="elevated" style={styles.chartCard}>
        <Text style={styles.chartTitle}>Performance Trend</Text>
        
        <LineChart
          data={{
            labels: performanceTrend.labels,
            datasets: [{ data: performanceTrend.data }],
          }}
          width={SCREEN_WIDTH - spacing.base * 4}
          height={180}
          chartConfig={{
            backgroundColor: colors.background.paper,
            backgroundGradientFrom: colors.background.paper,
            backgroundGradientTo: colors.background.paper,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
            labelColor: (opacity = 1) => colors.text.secondary,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: colors.accent.purple,
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          yAxisSuffix="%"
        />
        
        <Text style={styles.chartSubtext}>
          Showing last {performanceTrend.labels.length} exam results
        </Text>
      </Card>
    );
  };

  const renderExamSelector = () => (
    <View style={styles.examSelector}>
      <Text style={styles.sectionTitle}>Exam Results</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.examTabs}
      >
        {examResults.map((exam) => (
          <TouchableOpacity
            key={exam.id}
            style={[
              styles.examTab,
              selectedExam?.id === exam.id && styles.examTabActive,
            ]}
            onPress={() => setSelectedExam(exam)}
          >
            <Text style={[
              styles.examTabText,
              selectedExam?.id === exam.id && styles.examTabTextActive,
            ]}>
              {exam.examName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderExamDetails = () => {
    if (!selectedExam) return null;

    return (
      <Card variant="elevated" style={styles.examCard}>
        <View style={styles.examHeader}>
          <View>
            <Text style={styles.examName}>{selectedExam.examName}</Text>
            <Text style={styles.examDate}>
              {new Date(selectedExam.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(selectedExam.grade) + '20' }]}>
            <Text style={[styles.gradeText, { color: getGradeColor(selectedExam.grade) }]}>
              {selectedExam.grade}
            </Text>
          </View>
        </View>
        
        <View style={styles.examSummary}>
          <View style={styles.examStat}>
            <Text style={styles.examStatValue}>{selectedExam.obtainedMarks}</Text>
            <Text style={styles.examStatLabel}>/ {selectedExam.totalMarks}</Text>
          </View>
          <View style={styles.examStatDivider} />
          <View style={styles.examStat}>
            <Text style={[styles.examStatValue, { color: colors.primary.main }]}>
              {selectedExam.percentage}%
            </Text>
            <Text style={styles.examStatLabel}>Percentage</Text>
          </View>
        </View>
        
        <View style={styles.subjectsContainer}>
          <Text style={styles.subjectsTitle}>Subject-wise Marks</Text>
          
          {selectedExam.subjects.map((subject, index) => (
            <View key={index} style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.subject}</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(subject.marks / subject.maxMarks) * 100}%`,
                        backgroundColor: getGradeColor(subject.grade),
                      }
                    ]} 
                  />
                </View>
              </View>
              <View style={styles.subjectMarks}>
                <Text style={styles.subjectMarksText}>
                  {subject.marks}/{subject.maxMarks}
                </Text>
                <Text style={[styles.subjectGrade, { color: getGradeColor(subject.grade) }]}>
                  {subject.grade}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent.purple} />
      <Text style={styles.loadingText}>Loading academic records...</Text>
    </View>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderLoading()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent.purple]}
            tintColor={colors.accent.purple}
          />
        }
      >
        {renderOverallStats()}
        {renderTrendChart()}
        {renderExamSelector()}
        {renderExamDetails()}
        
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },

  // Header
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    color: colors.text.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.white,
  },

  // Stats Card
  statsCard: {
    marginBottom: spacing.base,
    padding: spacing.base,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Chart
  chartCard: {
    marginBottom: spacing.base,
    padding: spacing.base,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  chart: {
    borderRadius: 16,
    marginVertical: spacing.xs,
  },
  chartSubtext: {
    fontSize: 12,
    color: colors.text.hint,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  // Exam Selector
  examSelector: {
    marginBottom: spacing.base,
  },
  examTabs: {
    paddingRight: spacing.base,
  },
  examTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grey[100],
    marginRight: spacing.xs,
  },
  examTabActive: {
    backgroundColor: colors.accent.purple,
  },
  examTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  examTabTextActive: {
    color: colors.text.white,
  },

  // Exam Card
  examCard: {
    padding: spacing.base,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  examName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  examDate: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  gradeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  gradeText: {
    fontSize: 24,
    fontWeight: '700',
  },
  examSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.base,
    marginBottom: spacing.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  examStat: {
    alignItems: 'center',
    flex: 1,
  },
  examStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  examStatLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  examStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
  },
  subjectsContainer: {
    marginTop: spacing.sm,
  },
  subjectsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subjectInfo: {
    flex: 1,
    marginRight: spacing.base,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.grey[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectMarks: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  subjectMarksText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subjectGrade: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default MarksScreen;

