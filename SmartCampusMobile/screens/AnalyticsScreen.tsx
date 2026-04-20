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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import AnalyticsService from '../services/AnalyticsService';
import { AnalyticsData, AnalyticsFilters } from '../models/AnalyticsModel';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const { userData } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const filters: AnalyticsFilters = {
        period: selectedPeriod,
      };
      
      const data = await AnalyticsService.getAnalyticsData(filters);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const filters: AnalyticsFilters = {
        period: selectedPeriod,
      };
      
      const result = await AnalyticsService.exportAnalytics(filters, format);
      
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'quarterly': return 'This Quarter';
      case 'yearly': return 'This Year';
      default: return 'This Month';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'recommendation': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return '✅';
      case 'negative': return '⚠️';
      case 'recommendation': return '💡';
      default: return '📊';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return `$${formatNumber(amount)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>School performance insights</Text>
        
        {/* Period Selector */}
        <TouchableOpacity 
          style={styles.periodSelector}
          onPress={() => setShowPeriodModal(true)}
        >
          <Text style={styles.periodText}>{getPeriodText(selectedPeriod)}</Text>
          <Text style={styles.periodIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>👥</Text>
              <Text style={styles.metricValue}>{analyticsData?.metrics.attendance.totalStudents}</Text>
              <Text style={styles.metricLabel}>Total Students</Text>
              <Text style={styles.metricChange}>+2.3%</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>📈</Text>
              <Text style={styles.metricValue}>{analyticsData?.metrics.attendance.averageAttendance}%</Text>
              <Text style={styles.metricLabel}>Avg Attendance</Text>
              <Text style={styles.metricChange}>+1.8%</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🎓</Text>
              <Text style={styles.metricValue}>{analyticsData?.metrics.academic.averageGrade}</Text>
              <Text style={styles.metricLabel}>Avg Grade</Text>
              <Text style={styles.metricChange}>+2.1%</Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>💰</Text>
              <Text style={styles.metricValue}>{formatCurrency(analyticsData?.metrics.financial.totalRevenue || 0)}</Text>
              <Text style={styles.metricLabel}>Revenue</Text>
              <Text style={styles.metricChange}>+12.5%</Text>
            </View>
          </View>
        </View>

        {/* Attendance Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance by Class</Text>
          <View style={styles.chartContainer}>
            {analyticsData?.metrics.attendance.attendanceByClass.map((classData, index) => (
              <View key={classData.classId} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: (classData.attendanceRate / 100) * 120,
                        backgroundColor: classData.attendanceRate >= 90 ? '#10B981' : 
                                       classData.attendanceRate >= 80 ? '#3B82F6' : '#F59E0B'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{classData.className}</Text>
                <Text style={styles.barValue}>{classData.attendanceRate}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Academic Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Performance</Text>
          <View style={styles.performanceContainer}>
            {analyticsData?.metrics.academic.subjectPerformance.map((subject, index) => (
              <View key={subject.subject} style={styles.performanceCard}>
                <View style={styles.performanceHeader}>
                  <Text style={styles.subjectName}>{subject.subject}</Text>
                  <Text style={styles.subjectGrade}>{subject.averageGrade}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${subject.averageGrade}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.passRate}>Pass Rate: {subject.passRate}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialCard}>
              <Text style={styles.financialIcon}>💰</Text>
              <Text style={styles.financialValue}>{formatCurrency(analyticsData?.metrics.financial.collectedFees || 0)}</Text>
              <Text style={styles.financialLabel}>Collected</Text>
            </View>
            
            <View style={styles.financialCard}>
              <Text style={styles.financialIcon}>⏳</Text>
              <Text style={styles.financialValue}>{formatCurrency(analyticsData?.metrics.financial.pendingFees || 0)}</Text>
              <Text style={styles.financialLabel}>Pending</Text>
            </View>
            
            <View style={styles.financialCard}>
              <Text style={styles.financialIcon}>📊</Text>
              <Text style={styles.financialValue}>{analyticsData?.metrics.financial.collectionRate}%</Text>
              <Text style={styles.financialLabel}>Collection Rate</Text>
            </View>
            
            <View style={styles.financialCard}>
              <Text style={styles.financialIcon}>⚠️</Text>
              <Text style={styles.financialValue}>{formatCurrency(analyticsData?.metrics.financial.overdueFees || 0)}</Text>
              <Text style={styles.financialLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        {/* Communication Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication</Text>
          <View style={styles.communicationGrid}>
            <View style={styles.communicationCard}>
              <Text style={styles.communicationNumber}>{analyticsData?.metrics.communication.totalMessages}</Text>
              <Text style={styles.communicationLabel}>Total Messages</Text>
            </View>
            
            <View style={styles.communicationCard}>
              <Text style={styles.communicationNumber}>{analyticsData?.metrics.communication.responseRate}%</Text>
              <Text style={styles.communicationLabel}>Response Rate</Text>
            </View>
            
            <View style={styles.communicationCard}>
              <Text style={styles.communicationNumber}>{analyticsData?.metrics.communication.averageResponseTime}h</Text>
              <Text style={styles.communicationLabel}>Avg Response Time</Text>
            </View>
            
            <View style={styles.communicationCard}>
              <Text style={styles.communicationNumber}>{analyticsData?.metrics.communication.engagementScore}</Text>
              <Text style={styles.communicationLabel}>Engagement Score</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          {analyticsData?.insights.map((insight) => (
            <View key={insight.id} style={[styles.insightCard, { borderLeftColor: getInsightColor(insight.type) }]}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>{getInsightIcon(insight.type)}</Text>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <View style={[styles.impactBadge, { backgroundColor: getInsightColor(insight.type) }]}>
                  <Text style={styles.impactText}>{insight.impact}</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              {insight.actionable && (
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>{insight.actionText}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Report</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => exportReport('pdf')}
            >
              <Text style={styles.exportButtonText}>📄 Export PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => exportReport('excel')}
            >
              <Text style={styles.exportButtonText}>📊 Export Excel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => exportReport('csv')}
            >
              <Text style={styles.exportButtonText}>📋 Export CSV</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Period Selection Modal */}
      <Modal
        visible={showPeriodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time Period</Text>
            
            {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodOption,
                  selectedPeriod === period && styles.periodOptionSelected
                ]}
                onPress={() => {
                  setSelectedPeriod(period as any);
                  setShowPeriodModal(false);
                }}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === period && styles.periodOptionTextSelected
                ]}>
                  {getPeriodText(period)}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPeriodModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
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
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  periodText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  periodIcon: {
    color: 'white',
    fontSize: 12,
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
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
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
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 30,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  performanceContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceCard: {
    marginBottom: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  subjectGrade: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  passRate: {
    fontSize: 12,
    color: '#6b7280',
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  financialCard: {
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
  financialIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  communicationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  communicationCard: {
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
  communicationNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  communicationLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  impactText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  exportButtonText: {
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
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  periodOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  periodOptionSelected: {
    backgroundColor: '#6366F1',
  },
  periodOptionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  periodOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#6B7280',
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

export default AnalyticsScreen;