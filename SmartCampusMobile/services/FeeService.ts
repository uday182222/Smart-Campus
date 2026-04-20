import { FeeStructure, Payment, FeeStats, FeeItem, FeeStatus, PaymentStatus } from '../models/FeeModel';

export class FeeService {
  private static instance: FeeService;
  private feeData: FeeStructure[] = [];
  private paymentData: Payment[] = [];

  static getInstance(): FeeService {
    if (!FeeService.instance) {
      FeeService.instance = new FeeService();
      FeeService.instance.initializeMockData();
    }
    return FeeService.instance;
  }

  // Initialize mock data
  initializeMockData(): void {
    this.feeData = [
      {
        id: 'fee_1',
        studentId: 'student_1',
        studentName: 'Emma Johnson',
        classId: 'class_1',
        className: 'Grade 5A',
        academicYear: '2024-25',
        fees: [
          {
            id: 'fee_item_1',
            name: 'Tuition Fee',
            type: 'tuition',
            amount: 5000,
            dueDate: new Date('2025-01-15'),
            status: 'paid',
            description: 'Monthly tuition fee',
            isMandatory: true,
          },
          {
            id: 'fee_item_2',
            name: 'Transport Fee',
            type: 'transport',
            amount: 800,
            dueDate: new Date('2025-01-15'),
            status: 'paid',
            description: 'Monthly transport fee',
            isMandatory: true,
          },
          {
            id: 'fee_item_3',
            name: 'Library Fee',
            type: 'library',
            amount: 200,
            dueDate: new Date('2025-01-20'),
            status: 'pending',
            description: 'Annual library membership',
            isMandatory: false,
          },
        ],
        totalAmount: 6000,
        paidAmount: 5800,
        balanceAmount: 200,
        status: 'partial',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-15'),
      },
      {
        id: 'fee_2',
        studentId: 'student_2',
        studentName: 'James Wilson',
        classId: 'class_1',
        className: 'Grade 5A',
        academicYear: '2024-25',
        fees: [
          {
            id: 'fee_item_4',
            name: 'Tuition Fee',
            type: 'tuition',
            amount: 5000,
            dueDate: new Date('2025-01-15'),
            status: 'overdue',
            description: 'Monthly tuition fee',
            isMandatory: true,
          },
          {
            id: 'fee_item_5',
            name: 'Sports Fee',
            type: 'sports',
            amount: 300,
            dueDate: new Date('2025-01-10'),
            status: 'overdue',
            description: 'Annual sports fee',
            isMandatory: true,
          },
        ],
        totalAmount: 5300,
        paidAmount: 0,
        balanceAmount: 5300,
        status: 'overdue',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-15'),
      },
      {
        id: 'fee_3',
        studentId: 'student_3',
        studentName: 'Sarah Davis',
        classId: 'class_2',
        className: 'Grade 5B',
        academicYear: '2024-25',
        fees: [
          {
            id: 'fee_item_6',
            name: 'Tuition Fee',
            type: 'tuition',
            amount: 5000,
            dueDate: new Date('2025-01-15'),
            status: 'paid',
            description: 'Monthly tuition fee',
            isMandatory: true,
          },
          {
            id: 'fee_item_7',
            name: 'Exam Fee',
            type: 'exam',
            amount: 500,
            dueDate: new Date('2025-01-25'),
            status: 'pending',
            description: 'Mid-term exam fee',
            isMandatory: true,
          },
        ],
        totalAmount: 5500,
        paidAmount: 5000,
        balanceAmount: 500,
        status: 'partial',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-15'),
      },
    ];

    this.paymentData = [
      {
        id: 'pay_1',
        feeStructureId: 'fee_1',
        studentId: 'student_1',
        amount: 5800,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date('2025-01-15'),
        transactionId: 'TXN001',
        receiptNumber: 'RCP001',
        status: 'completed',
        notes: 'Payment for tuition and transport',
        processedBy: 'admin_1',
        createdAt: new Date('2025-01-15'),
      },
      {
        id: 'pay_2',
        feeStructureId: 'fee_3',
        studentId: 'student_3',
        amount: 5000,
        paymentMethod: 'card',
        paymentDate: new Date('2025-01-14'),
        transactionId: 'TXN002',
        receiptNumber: 'RCP002',
        status: 'completed',
        notes: 'Tuition fee payment',
        processedBy: 'admin_1',
        createdAt: new Date('2025-01-14'),
      },
    ];
  }

  // Get fee structure for a student
  async getFeeStructureForStudent(studentId: string): Promise<FeeStructure | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const feeStructure = this.feeData.find(fee => fee.studentId === studentId);
        resolve(feeStructure || null);
      }, 400);
    });
  }

  // Get fee structures for a class
  async getFeeStructuresForClass(classId: string): Promise<FeeStructure[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const feeStructures = this.feeData.filter(fee => fee.classId === classId);
        resolve(feeStructures);
      }, 400);
    });
  }

  // Get all fee structures (for admin)
  async getAllFeeStructures(): Promise<FeeStructure[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.feeData);
      }, 300);
    });
  }

  // Record a payment
  async recordPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<{ success: boolean; payment?: Payment; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const newPayment: Payment = {
            ...payment,
            id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
          };

          this.paymentData.push(newPayment);

          // Update fee structure
          const feeStructure = this.feeData.find(fee => fee.id === payment.feeStructureId);
          if (feeStructure) {
            feeStructure.paidAmount += payment.amount;
            feeStructure.balanceAmount = feeStructure.totalAmount - feeStructure.paidAmount;
            
            // Update fee status
            if (feeStructure.balanceAmount <= 0) {
              feeStructure.status = 'paid';
              // Update individual fee items
              feeStructure.fees.forEach(fee => {
                if (fee.status === 'pending' || fee.status === 'overdue') {
                  fee.status = 'paid';
                }
              });
            } else {
              feeStructure.status = 'partial';
            }
            
            feeStructure.updatedAt = new Date();
          }

          resolve({ success: true, payment: newPayment, message: 'Payment recorded successfully' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to record payment' });
        }
      }, 600);
    });
  }

  // Get payment history for a student
  async getPaymentHistory(studentId: string): Promise<Payment[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const payments = this.paymentData.filter(payment => payment.studentId === studentId);
        resolve(payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime()));
      }, 300);
    });
  }

  // Get fee statistics
  async getFeeStats(): Promise<FeeStats> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalFees = this.feeData.reduce((sum, fee) => sum + fee.totalAmount, 0);
        const collectedFees = this.feeData.reduce((sum, fee) => sum + fee.paidAmount, 0);
        const pendingFees = this.feeData.filter(fee => fee.status === 'pending').length;
        const overdueFees = this.feeData.filter(fee => fee.status === 'overdue').length;
        const collectionRate = totalFees > 0 ? Math.round((collectedFees / totalFees) * 100) : 0;
        
        // Calculate monthly collection (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyCollection = this.paymentData
          .filter(payment => 
            payment.paymentDate.getMonth() === currentMonth && 
            payment.paymentDate.getFullYear() === currentYear &&
            payment.status === 'completed'
          )
          .reduce((sum, payment) => sum + payment.amount, 0);

        resolve({
          totalFees,
          collectedFees,
          pendingFees,
          overdueFees,
          collectionRate,
          monthlyCollection,
        });
      }, 400);
    });
  }

  // Update fee status
  async updateFeeStatus(feeStructureId: string, feeItemId: string, status: FeeStatus): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const feeStructure = this.feeData.find(fee => fee.id === feeStructureId);
          if (feeStructure) {
            const feeItem = feeStructure.fees.find(fee => fee.id === feeItemId);
            if (feeItem) {
              feeItem.status = status;
              feeStructure.updatedAt = new Date();
              resolve({ success: true, message: 'Fee status updated successfully' });
            } else {
              resolve({ success: false, message: 'Fee item not found' });
            }
          } else {
            resolve({ success: false, message: 'Fee structure not found' });
          }
        } catch (error) {
          resolve({ success: false, message: 'Failed to update fee status' });
        }
      }, 400);
    });
  }

  // Generate fee reminder
  async generateFeeReminder(studentId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock fee reminder generation
        console.log(`Fee reminder generated for student ${studentId}`);
        resolve({ success: true, message: 'Fee reminder generated successfully' });
      }, 300);
    });
  }

  // Create fee structure
  async createFeeStructure(feeStructure: Omit<FeeStructure, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; feeStructure?: FeeStructure; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const newFeeStructure: FeeStructure = {
            ...feeStructure,
            id: `fee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          this.feeData.push(newFeeStructure);
          resolve({ success: true, feeStructure: newFeeStructure, message: 'Fee structure created successfully' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to create fee structure' });
        }
      }, 600);
    });
  }
}

export default FeeService.getInstance();