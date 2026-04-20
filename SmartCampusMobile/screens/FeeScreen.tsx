import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import FeeService from '../services/FeeService';
import { FeeStructure, Payment, FeeStats, FeeStatus, PaymentStatus } from '../models/FeeModel';

const FeeScreen: React.FC = () => {
  const { userData } = useAuth();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'online',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load fee structures
      const allFees = await FeeService.getAllFeeStructures();
      setFeeStructures(allFees);
      
      // Load fee statistics
      const feeStats = await FeeService.getFeeStats();
      setStats(feeStats);
    } catch (error) {
      console.error('Error loading fee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!selectedFee || !paymentForm.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const paymentData = {
        feeStructureId: selectedFee.id,
        studentId: selectedFee.studentId,
        amount: amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: new Date(),
        transactionId: `TXN${Date.now()}`,
        receiptNumber: `RCP${Date.now()}`,
        status: 'completed' as PaymentStatus,
        notes: paymentForm.notes,
        processedBy: 'admin_1',
      };

      const result = await FeeService.recordPayment(paymentData);
      
      if (result.success) {
        setPaymentForm({ amount: '', paymentMethod: 'cash', notes: '' });
        setShowPaymentModal(false);
        await loadData();
        Alert.alert('Success', 'Payment recorded successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const viewPaymentHistory = async (feeStructure: FeeStructure) => {
    try {
      const payments = await FeeService.getPaymentHistory(feeStructure.studentId);
      setPaymentHistory(payments);
      setSelectedFee(feeStructure);
      setShowFeeModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment history');
    }
  };

  const generateReminder = async (studentId: string) => {
    try {
      const result = await FeeService.generateFeeReminder(studentId);
      if (result.success) {
        Alert.alert('Success', 'Fee reminder generated successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate reminder');
    }
  };

  const getStatusColor = (status: FeeStatus) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      case 'partial': return '#3B82F6';
      case 'waived': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'bank_transfer': return '🏦';
      case 'cheque': return '📝';
      case 'online': return '💻';
      default: return '💰';
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
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
          <Text style={styles.loadingText}>Loading fee data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Fee Management</Text>
        <Text style={styles.headerSubtitle}>Track and manage student fees</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{formatCurrency(stats.totalFees)}</Text>
              <Text style={styles.statLabel}>Total Fees</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{formatCurrency(stats.collectedFees)}</Text>
              <Text style={styles.statLabel}>Collected</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.overdueFees}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.collectionRate}%</Text>
              <Text style={styles.statLabel}>Collection Rate</Text>
            </View>
          </View>
        )}

        {/* Fee Structures List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Structures ({feeStructures.length})</Text>
          {feeStructures.map((feeStructure) => (
            <View key={feeStructure.id} style={styles.feeCard}>
              <View style={styles.feeHeader}>
                <Text style={styles.studentName}>{feeStructure.studentName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(feeStructure.status) }]}>
                  <Text style={styles.statusText}>{feeStructure.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.classInfo}>{feeStructure.className} • {feeStructure.academicYear}</Text>
              
              <View style={styles.amountContainer}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.amountValue}>{formatCurrency(feeStructure.totalAmount)}</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Paid</Text>
                  <Text style={[styles.amountValue, { color: '#10B981' }]}>{formatCurrency(feeStructure.paidAmount)}</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Balance</Text>
                  <Text style={[styles.amountValue, { color: '#EF4444' }]}>{formatCurrency(feeStructure.balanceAmount)}</Text>
                </View>
              </View>

              <View style={styles.feeDetails}>
                <Text style={styles.feeDetailsTitle}>Fee Items:</Text>
                {feeStructure.fees.map((fee) => (
                  <View key={fee.id} style={styles.feeItem}>
                    <Text style={styles.feeItemName}>{fee.name}</Text>
                    <View style={styles.feeItemRight}>
                      <Text style={styles.feeItemAmount}>{formatCurrency(fee.amount)}</Text>
                      <View style={[styles.feeItemStatus, { backgroundColor: getStatusColor(fee.status) }]}>
                        <Text style={styles.feeItemStatusText}>{fee.status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.feeActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedFee(feeStructure);
                    setShowPaymentModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Record Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.historyButton]}
                  onPress={() => viewPaymentHistory(feeStructure)}
                >
                  <Text style={styles.actionButtonText}>View History</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.reminderButton]}
                  onPress={() => generateReminder(feeStructure.studentId)}
                >
                  <Text style={styles.actionButtonText}>Send Reminder</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <Text style={styles.modalSubtitle}>
              {selectedFee?.studentName} - {selectedFee?.className}
            </Text>
            
            <Text style={styles.balanceText}>
              Balance: {selectedFee && formatCurrency(selectedFee.balanceAmount)}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Payment Amount"
              value={paymentForm.amount}
              onChangeText={(text) => setPaymentForm({...paymentForm, amount: text})}
              keyboardType="numeric"
            />
            
            <View style={styles.paymentMethodContainer}>
              <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
              <View style={styles.paymentMethodButtons}>
                {['cash', 'card', 'bank_transfer', 'cheque', 'online'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentMethodButton,
                      paymentForm.paymentMethod === method && styles.paymentMethodButtonSelected
                    ]}
                    onPress={() => setPaymentForm({...paymentForm, paymentMethod: method as any})}
                  >
                    <Text style={styles.paymentMethodButtonText}>
                      {getPaymentMethodIcon(method)} {method.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              value={paymentForm.notes}
              onChangeText={(text) => setPaymentForm({...paymentForm, notes: text})}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={recordPayment}
              >
                <Text style={styles.confirmButtonText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        visible={showFeeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment History</Text>
            <Text style={styles.modalSubtitle}>
              {selectedFee?.studentName} - {selectedFee?.className}
            </Text>
            
            <FlatList
              data={paymentHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
                    <View style={[styles.paymentStatusBadge, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.paymentStatusText}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.paymentMethod}>
                    {getPaymentMethodIcon(item.paymentMethod)} {item.paymentMethod.replace('_', ' ')}
                  </Text>
                  
                  <Text style={styles.paymentDate}>
                    {formatDate(item.paymentDate)} • Receipt: {item.receiptNumber}
                  </Text>
                  
                  {item.notes && (
                    <Text style={styles.paymentNotes}>{item.notes}</Text>
                  )}
                </View>
              )}
            />
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowFeeModal(false)}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
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
    marginBottom: 16,
  },
  feeCard: {
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
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
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
  classInfo: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  feeDetails: {
    marginBottom: 16,
  },
  feeDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  feeItemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  feeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeItemAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginRight: 8,
  },
  feeItemStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  feeItemStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  feeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  historyButton: {
    backgroundColor: '#10B981',
  },
  reminderButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
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
  paymentMethodContainer: {
    marginBottom: 16,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  paymentMethodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  paymentMethodButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  paymentMethodButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  paymentMethodButtonText: {
    fontSize: 12,
    color: '#374151',
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
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  paymentStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
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

export default FeeScreen;
