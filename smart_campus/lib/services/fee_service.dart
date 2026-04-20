import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/fee_model.dart';
import '../models/student_model.dart';
import 'auth_service.dart';

class FeeService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _feeStructuresCollection = 'fee_structures';
  static const String _feeDuesCollection = 'fee_dues';
  static const String _paymentsCollection = 'payments';
  static const String _studentsCollection = 'students';

  // Mock data for development
  static List<FeeStructure> _mockFeeStructures = [];
  static List<FeeDue> _mockFeeDues = [];
  static List<Payment> _mockPayments = [];

  static void initializeMockData() {
    _mockFeeStructures = [
      FeeStructure(
        id: 'fee_struct_1',
        schoolId: 'school_1',
        name: 'Tuition Fee - Grade 5',
        description: 'Monthly tuition fee for Grade 5 students',
        type: FeeType.tuition,
        amount: 500.0,
        currency: 'USD',
        applicableClassId: 'class_1',
        applicableClassName: 'Grade 5A',
        isMandatory: true,
        isRecurring: true,
        recurringInterval: 1,
        dueDate: DateTime.now().add(const Duration(days: 15)),
        validFrom: DateTime.now().subtract(const Duration(days: 30)),
        validTo: DateTime.now().add(const Duration(days: 365)),
        isActive: true,
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      FeeStructure(
        id: 'fee_struct_2',
        schoolId: 'school_1',
        name: 'Transport Fee',
        description: 'Monthly transport fee for bus service',
        type: FeeType.transport,
        amount: 100.0,
        currency: 'USD',
        isMandatory: false,
        isRecurring: true,
        recurringInterval: 1,
        dueDate: DateTime.now().add(const Duration(days: 10)),
        validFrom: DateTime.now().subtract(const Duration(days: 30)),
        validTo: DateTime.now().add(const Duration(days: 365)),
        isActive: true,
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      FeeStructure(
        id: 'fee_struct_3',
        schoolId: 'school_1',
        name: 'Examination Fee',
        description: 'Annual examination fee',
        type: FeeType.examination,
        amount: 50.0,
        currency: 'USD',
        isMandatory: true,
        isRecurring: false,
        dueDate: DateTime.now().add(const Duration(days: 30)),
        validFrom: DateTime.now().subtract(const Duration(days: 30)),
        validTo: DateTime.now().add(const Duration(days: 365)),
        isActive: true,
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
    ];

    _mockFeeDues = [
      FeeDue(
        id: 'fee_due_1',
        schoolId: 'school_1',
        studentId: 'student_1',
        studentName: 'Emma Smith',
        classId: 'class_1',
        className: 'Grade 5A',
        feeStructureId: 'fee_struct_1',
        feeName: 'Tuition Fee - Grade 5',
        feeType: FeeType.tuition,
        amount: 500.0,
        paidAmount: 500.0,
        balanceAmount: 0.0,
        currency: 'USD',
        dueDate: DateTime.now().add(const Duration(days: 15)),
        status: FeeStatus.paid,
        paidDate: DateTime.now().subtract(const Duration(days: 5)),
        payments: [],
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      FeeDue(
        id: 'fee_due_2',
        schoolId: 'school_1',
        studentId: 'student_1',
        studentName: 'Emma Smith',
        classId: 'class_1',
        className: 'Grade 5A',
        feeStructureId: 'fee_struct_2',
        feeName: 'Transport Fee',
        feeType: FeeType.transport,
        amount: 100.0,
        paidAmount: 0.0,
        balanceAmount: 100.0,
        currency: 'USD',
        dueDate: DateTime.now().add(const Duration(days: 10)),
        status: FeeStatus.pending,
        payments: [],
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      FeeDue(
        id: 'fee_due_3',
        schoolId: 'school_1',
        studentId: 'student_2',
        studentName: 'James Wilson',
        classId: 'class_2',
        className: 'Grade 6B',
        feeStructureId: 'fee_struct_1',
        feeName: 'Tuition Fee - Grade 5',
        feeType: FeeType.tuition,
        amount: 500.0,
        paidAmount: 300.0,
        balanceAmount: 200.0,
        currency: 'USD',
        dueDate: DateTime.now().subtract(const Duration(days: 5)),
        status: FeeStatus.overdue,
        payments: [],
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
    ];

    _mockPayments = [
      Payment(
        id: 'payment_1',
        feeDueId: 'fee_due_1',
        amount: 500.0,
        currency: 'USD',
        method: PaymentMethod.bankTransfer,
        transactionId: 'TXN001',
        reference: 'Bank Transfer - Emma Smith Tuition',
        notes: 'Full payment received',
        paymentDate: DateTime.now().subtract(const Duration(days: 5)),
        recordedBy: 'admin_1',
        recordedByName: 'School Administrator',
        createdAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      Payment(
        id: 'payment_2',
        feeDueId: 'fee_due_3',
        amount: 300.0,
        currency: 'USD',
        method: PaymentMethod.cash,
        reference: 'Cash Payment - James Wilson',
        notes: 'Partial payment received',
        paymentDate: DateTime.now().subtract(const Duration(days: 10)),
        recordedBy: 'admin_1',
        recordedByName: 'School Administrator',
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      ),
    ];
  }

  // Create a new fee structure (School Admin only)
  static Future<String> createFeeStructure(FeeStructure feeStructure) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_feeStructuresCollection).doc();
      final feeWithId = feeStructure.copyWith(
        id: docRef.id,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await docRef.set(feeWithId.toMap());
      return docRef.id;
    } catch (e) {
      print('Error creating fee structure: $e');
      // For development, add to mock data
      final id = 'fee_struct_${DateTime.now().millisecondsSinceEpoch}';
      _mockFeeStructures.add(feeStructure.copyWith(id: id));
      return id;
    }
  }

  // Get fee structures by school ID
  static Future<List<FeeStructure>> getFeeStructuresBySchool(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_feeStructuresCollection)
          .where('schoolId', isEqualTo: schoolId)
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => FeeStructure.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting fee structures: $e');
      // Return mock data for development
      return _mockFeeStructures
          .where((fee) => fee.schoolId == schoolId && fee.isActive)
          .toList();
    }
  }

  // Get fee dues by school ID
  static Future<List<FeeDue>> getFeeDuesBySchool(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_feeDuesCollection)
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => FeeDue.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting fee dues: $e');
      // Return mock data for development
      return _mockFeeDues
          .where((due) => due.schoolId == schoolId)
          .toList();
    }
  }

  // Get fee dues by student ID (for parents)
  static Future<List<FeeDue>> getFeeDuesByStudent(String studentId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_feeDuesCollection)
          .where('studentId', isEqualTo: studentId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => FeeDue.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting fee dues by student: $e');
      // Return mock data for development
      return _mockFeeDues
          .where((due) => due.studentId == studentId)
          .toList();
    }
  }

  // Update fee due status (School Admin only)
  static Future<void> updateFeeDueStatus(
    String feeDueId,
    FeeStatus status, {
    double? paidAmount,
    String? notes,
  }) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // Get current fee due
      final feeDue = _mockFeeDues.firstWhere((due) => due.id == feeDueId);
      final newBalanceAmount = feeDue.amount - (paidAmount ?? feeDue.paidAmount);
      
      final updateData = {
        'status': status.name,
        'paidAmount': paidAmount ?? feeDue.paidAmount,
        'balanceAmount': newBalanceAmount,
        'paidDate': status == FeeStatus.paid ? Timestamp.fromDate(DateTime.now()) : feeDue.paidDate,
        'notes': notes ?? feeDue.notes,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      };

      await _firestore.collection(_feeDuesCollection).doc(feeDueId).update(updateData);
      
      // Update mock data for development
      final index = _mockFeeDues.indexWhere((due) => due.id == feeDueId);
      if (index != -1) {
        _mockFeeDues[index] = _mockFeeDues[index].copyWith(
          status: status,
          paidAmount: paidAmount ?? _mockFeeDues[index].paidAmount,
          balanceAmount: newBalanceAmount,
          paidDate: status == FeeStatus.paid ? DateTime.now() : _mockFeeDues[index].paidDate,
          notes: notes ?? _mockFeeDues[index].notes,
          updatedAt: DateTime.now(),
        );
      }
    } catch (e) {
      print('Error updating fee due status: $e');
      // Update mock data for development
      final index = _mockFeeDues.indexWhere((due) => due.id == feeDueId);
      if (index != -1) {
        final paidAmountValue = paidAmount ?? _mockFeeDues[index].paidAmount;
        final newBalanceAmount = _mockFeeDues[index].amount - paidAmountValue;
        
        _mockFeeDues[index] = _mockFeeDues[index].copyWith(
          status: status,
          paidAmount: paidAmountValue,
          balanceAmount: newBalanceAmount,
          paidDate: status == FeeStatus.paid ? DateTime.now() : _mockFeeDues[index].paidDate,
          notes: notes ?? _mockFeeDues[index].notes,
          updatedAt: DateTime.now(),
        );
      }
    }
  }

  // Record a payment (School Admin only)
  static Future<String> recordPayment(Payment payment) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_paymentsCollection).doc();
      final paymentWithId = Payment(
        id: docRef.id,
        feeDueId: payment.feeDueId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        transactionId: payment.transactionId,
        reference: payment.reference,
        notes: payment.notes,
        paymentDate: payment.paymentDate,
        recordedBy: currentUser.uid,
        recordedByName: currentUser.displayName ?? 'Admin User',
        createdAt: DateTime.now(),
      );

      await docRef.set(paymentWithId.toMap());
      
      // Update fee due
      final feeDue = _mockFeeDues.firstWhere((due) => due.id == payment.feeDueId);
      final newPaidAmount = feeDue.paidAmount + payment.amount;
      final newBalanceAmount = feeDue.amount - newPaidAmount;
      final newStatus = newBalanceAmount <= 0 ? FeeStatus.paid : FeeStatus.partial;
      
      await updateFeeDueStatus(
        payment.feeDueId,
        newStatus,
        paidAmount: newPaidAmount,
      );
      
      return docRef.id;
    } catch (e) {
      print('Error recording payment: $e');
      // For development, add to mock data
      final id = 'payment_${DateTime.now().millisecondsSinceEpoch}';
      _mockPayments.add(payment.copyWith(id: id));
      return id;
    }
  }

  // Get overdue fees (for notifications)
  static Future<List<FeeDue>> getOverdueFees(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final now = DateTime.now();
      final querySnapshot = await _firestore
          .collection(_feeDuesCollection)
          .where('schoolId', isEqualTo: schoolId)
          .where('status', whereIn: [FeeStatus.pending.name, FeeStatus.partial.name])
          .where('dueDate', isLessThan: Timestamp.fromDate(now))
          .get();

      return querySnapshot.docs
          .map((doc) => FeeDue.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting overdue fees: $e');
      // Return mock data for development
      final now = DateTime.now();
      return _mockFeeDues
          .where((due) => due.schoolId == schoolId && 
                         (due.status == FeeStatus.pending || due.status == FeeStatus.partial) &&
                         due.dueDate.isBefore(now))
          .toList();
    }
  }

  // Get fee statistics for school admin
  static Future<Map<String, dynamic>> getFeeStatistics(String schoolId) async {
    try {
      final feeDues = await getFeeDuesBySchool(schoolId);
      
      double totalAmount = 0;
      double totalPaid = 0;
      double totalPending = 0;
      double totalOverdue = 0;
      int paidCount = 0;
      int pendingCount = 0;
      int overdueCount = 0;
      
      for (final due in feeDues) {
        totalAmount += due.amount;
        totalPaid += due.paidAmount;
        
        switch (due.status) {
          case FeeStatus.paid:
            paidCount++;
            break;
          case FeeStatus.pending:
            pendingCount++;
            totalPending += due.balanceAmount;
            break;
          case FeeStatus.overdue:
            overdueCount++;
            totalOverdue += due.balanceAmount;
            break;
          case FeeStatus.partial:
            pendingCount++;
            totalPending += due.balanceAmount;
            break;
          default:
            break;
        }
      }
      
      return {
        'totalAmount': totalAmount,
        'totalPaid': totalPaid,
        'totalPending': totalPending,
        'totalOverdue': totalOverdue,
        'paidCount': paidCount,
        'pendingCount': pendingCount,
        'overdueCount': overdueCount,
        'totalCount': feeDues.length,
        'collectionRate': totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      };
    } catch (e) {
      print('Error getting fee statistics: $e');
      return {
        'totalAmount': 0.0,
        'totalPaid': 0.0,
        'totalPending': 0.0,
        'totalOverdue': 0.0,
        'paidCount': 0,
        'pendingCount': 0,
        'overdueCount': 0,
        'totalCount': 0,
        'collectionRate': 0.0,
      };
    }
  }

  // Get students for fee management
  static Future<List<Student>> getStudentsForFeeManagement(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_studentsCollection)
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('name')
          .get();

      return querySnapshot.docs
          .map((doc) => Student.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting students for fee management: $e');
      // Return mock data for development
      return [
        Student(
          id: 'student_1',
          name: 'Emma Smith',
          email: 'emma.smith@school.com',
          className: 'Grade 5A',
          rollNo: 'ST001',
          phone: '+1234567890',
          address: '123 Main St, Downtown',
          parentName: 'John Smith',
          parentPhone: '+0987654321',
          dateOfBirth: DateTime(2015, 6, 15),
          gender: 'Female',
          bloodGroup: 'O+',
          admissionDate: '2020-01-01',
          // emergencyContact: 'John Smith - +1234567890', // Not in Student model
          // medicalInfo: 'No known allergies', // Not in Student model
          // createdAt: DateTime.now(), // Not in Student model
          // updatedAt: DateTime.now(), // Not in Student model
        ),
        Student(
          id: 'student_2',
          name: 'James Wilson',
          email: 'james.wilson@school.com',
          className: 'Grade 6B',
          rollNo: 'ST002',
          phone: '+1234567891',
          address: '456 Oak St, Downtown',
          parentName: 'Sarah Wilson',
          parentPhone: '+0987654322',
          dateOfBirth: DateTime(2014, 3, 20),
          gender: 'Male',
          bloodGroup: 'A+',
          admissionDate: '2020-01-01',
          // emergencyContact: 'Sarah Wilson - +1234567891', // Not in Student model
          // medicalInfo: 'Asthma', // Not in Student model
          // createdAt: DateTime.now(), // Not in Student model
          // updatedAt: DateTime.now(), // Not in Student model
        ),
      ];
    }
  }

  // Delete fee structure
  static Future<void> deleteFeeStructure(String feeStructureId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_feeStructuresCollection).doc(feeStructureId).delete();
    } catch (e) {
      print('Error deleting fee structure: $e');
      // Remove from mock data for development
      _mockFeeStructures.removeWhere((fee) => fee.id == feeStructureId);
    }
  }

  // Update fee structure
  static Future<void> updateFeeStructure(FeeStructure feeStructure) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_feeStructuresCollection).doc(feeStructure.id).update({
        ...feeStructure.toMap(),
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      print('Error updating fee structure: $e');
      // Update mock data for development
      final index = _mockFeeStructures.indexWhere((fee) => fee.id == feeStructure.id);
      if (index != -1) {
        _mockFeeStructures[index] = feeStructure.copyWith(updatedAt: DateTime.now());
      }
    }
  }
}

// Extension for Payment to add copyWith method
extension PaymentCopyWith on Payment {
  Payment copyWith({
    String? id,
    String? feeDueId,
    double? amount,
    String? currency,
    PaymentMethod? method,
    String? transactionId,
    String? reference,
    String? notes,
    DateTime? paymentDate,
    String? recordedBy,
    String? recordedByName,
    DateTime? createdAt,
  }) {
    return Payment(
      id: id ?? this.id,
      feeDueId: feeDueId ?? this.feeDueId,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      method: method ?? this.method,
      transactionId: transactionId ?? this.transactionId,
      reference: reference ?? this.reference,
      notes: notes ?? this.notes,
      paymentDate: paymentDate ?? this.paymentDate,
      recordedBy: recordedBy ?? this.recordedBy,
      recordedByName: recordedByName ?? this.recordedByName,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
