import 'package:cloud_firestore/cloud_firestore.dart';

enum FeeStatus {
  pending,
  paid,
  overdue,
  waived,
  partial,
}

enum FeeType {
  tuition,
  transport,
  library,
  laboratory,
  sports,
  examination,
  miscellaneous,
}

enum PaymentMethod {
  cash,
  bankTransfer,
  card,
  cheque,
  online,
  offline, // For payments made outside the app
}

class FeeStructure {
  final String id;
  final String schoolId;
  final String name;
  final String description;
  final FeeType type;
  final double amount;
  final String currency;
  final String? applicableClassId;
  final String? applicableClassName;
  final bool isMandatory;
  final bool isRecurring;
  final int? recurringInterval; // in months
  final DateTime dueDate;
  final DateTime? validFrom;
  final DateTime? validTo;
  final Map<String, dynamic>? metadata;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  FeeStructure({
    required this.id,
    required this.schoolId,
    required this.name,
    required this.description,
    required this.type,
    required this.amount,
    required this.currency,
    this.applicableClassId,
    this.applicableClassName,
    required this.isMandatory,
    required this.isRecurring,
    this.recurringInterval,
    required this.dueDate,
    this.validFrom,
    this.validTo,
    this.metadata,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FeeStructure.fromMap(Map<String, dynamic> map) {
    return FeeStructure(
      id: map['id'] ?? '',
      schoolId: map['schoolId'] ?? '',
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      type: FeeType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => FeeType.miscellaneous,
      ),
      amount: (map['amount'] ?? 0.0).toDouble(),
      currency: map['currency'] ?? 'USD',
      applicableClassId: map['applicableClassId'],
      applicableClassName: map['applicableClassName'],
      isMandatory: map['isMandatory'] ?? true,
      isRecurring: map['isRecurring'] ?? false,
      recurringInterval: map['recurringInterval'],
      dueDate: (map['dueDate'] as Timestamp).toDate(),
      validFrom: map['validFrom'] != null 
          ? (map['validFrom'] as Timestamp).toDate()
          : null,
      validTo: map['validTo'] != null 
          ? (map['validTo'] as Timestamp).toDate()
          : null,
      metadata: map['metadata'],
      isActive: map['isActive'] ?? true,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'schoolId': schoolId,
      'name': name,
      'description': description,
      'type': type.name,
      'amount': amount,
      'currency': currency,
      'applicableClassId': applicableClassId,
      'applicableClassName': applicableClassName,
      'isMandatory': isMandatory,
      'isRecurring': isRecurring,
      'recurringInterval': recurringInterval,
      'dueDate': Timestamp.fromDate(dueDate),
      'validFrom': validFrom != null ? Timestamp.fromDate(validFrom!) : null,
      'validTo': validTo != null ? Timestamp.fromDate(validTo!) : null,
      'metadata': metadata,
      'isActive': isActive,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  FeeStructure copyWith({
    String? id,
    String? schoolId,
    String? name,
    String? description,
    FeeType? type,
    double? amount,
    String? currency,
    String? applicableClassId,
    String? applicableClassName,
    bool? isMandatory,
    bool? isRecurring,
    int? recurringInterval,
    DateTime? dueDate,
    DateTime? validFrom,
    DateTime? validTo,
    Map<String, dynamic>? metadata,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return FeeStructure(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      name: name ?? this.name,
      description: description ?? this.description,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      applicableClassId: applicableClassId ?? this.applicableClassId,
      applicableClassName: applicableClassName ?? this.applicableClassName,
      isMandatory: isMandatory ?? this.isMandatory,
      isRecurring: isRecurring ?? this.isRecurring,
      recurringInterval: recurringInterval ?? this.recurringInterval,
      dueDate: dueDate ?? this.dueDate,
      validFrom: validFrom ?? this.validFrom,
      validTo: validTo ?? this.validTo,
      metadata: metadata ?? this.metadata,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get typeDisplayName {
    switch (type) {
      case FeeType.tuition:
        return 'Tuition Fee';
      case FeeType.transport:
        return 'Transport Fee';
      case FeeType.library:
        return 'Library Fee';
      case FeeType.laboratory:
        return 'Laboratory Fee';
      case FeeType.sports:
        return 'Sports Fee';
      case FeeType.examination:
        return 'Examination Fee';
      case FeeType.miscellaneous:
        return 'Miscellaneous';
    }
  }

  bool get isOverdue => DateTime.now().isAfter(dueDate);
  bool get isValid => DateTime.now().isAfter(validFrom ?? DateTime(1900)) && 
                     DateTime.now().isBefore(validTo ?? DateTime(2100));
}

class FeeDue {
  final String id;
  final String schoolId;
  final String studentId;
  final String studentName;
  final String classId;
  final String className;
  final String feeStructureId;
  final String feeName;
  final FeeType feeType;
  final double amount;
  final double paidAmount;
  final double balanceAmount;
  final String currency;
  final DateTime dueDate;
  final FeeStatus status;
  final DateTime? paidDate;
  final List<Payment> payments;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  FeeDue({
    required this.id,
    required this.schoolId,
    required this.studentId,
    required this.studentName,
    required this.classId,
    required this.className,
    required this.feeStructureId,
    required this.feeName,
    required this.feeType,
    required this.amount,
    required this.paidAmount,
    required this.balanceAmount,
    required this.currency,
    required this.dueDate,
    required this.status,
    this.paidDate,
    required this.payments,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FeeDue.fromMap(Map<String, dynamic> map) {
    return FeeDue(
      id: map['id'] ?? '',
      schoolId: map['schoolId'] ?? '',
      studentId: map['studentId'] ?? '',
      studentName: map['studentName'] ?? '',
      classId: map['classId'] ?? '',
      className: map['className'] ?? '',
      feeStructureId: map['feeStructureId'] ?? '',
      feeName: map['feeName'] ?? '',
      feeType: FeeType.values.firstWhere(
        (e) => e.name == map['feeType'],
        orElse: () => FeeType.miscellaneous,
      ),
      amount: (map['amount'] ?? 0.0).toDouble(),
      paidAmount: (map['paidAmount'] ?? 0.0).toDouble(),
      balanceAmount: (map['balanceAmount'] ?? 0.0).toDouble(),
      currency: map['currency'] ?? 'USD',
      dueDate: (map['dueDate'] as Timestamp).toDate(),
      status: FeeStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => FeeStatus.pending,
      ),
      paidDate: map['paidDate'] != null 
          ? (map['paidDate'] as Timestamp).toDate()
          : null,
      payments: (map['payments'] as List<dynamic>? ?? [])
          .map((payment) => Payment.fromMap(payment))
          .toList(),
      notes: map['notes'],
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'schoolId': schoolId,
      'studentId': studentId,
      'studentName': studentName,
      'classId': classId,
      'className': className,
      'feeStructureId': feeStructureId,
      'feeName': feeName,
      'feeType': feeType.name,
      'amount': amount,
      'paidAmount': paidAmount,
      'balanceAmount': balanceAmount,
      'currency': currency,
      'dueDate': Timestamp.fromDate(dueDate),
      'status': status.name,
      'paidDate': paidDate != null ? Timestamp.fromDate(paidDate!) : null,
      'payments': payments.map((payment) => payment.toMap()).toList(),
      'notes': notes,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  FeeDue copyWith({
    String? id,
    String? schoolId,
    String? studentId,
    String? studentName,
    String? classId,
    String? className,
    String? feeStructureId,
    String? feeName,
    FeeType? feeType,
    double? amount,
    double? paidAmount,
    double? balanceAmount,
    String? currency,
    DateTime? dueDate,
    FeeStatus? status,
    DateTime? paidDate,
    List<Payment>? payments,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return FeeDue(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      studentId: studentId ?? this.studentId,
      studentName: studentName ?? this.studentName,
      classId: classId ?? this.classId,
      className: className ?? this.className,
      feeStructureId: feeStructureId ?? this.feeStructureId,
      feeName: feeName ?? this.feeName,
      feeType: feeType ?? this.feeType,
      amount: amount ?? this.amount,
      paidAmount: paidAmount ?? this.paidAmount,
      balanceAmount: balanceAmount ?? this.balanceAmount,
      currency: currency ?? this.currency,
      dueDate: dueDate ?? this.dueDate,
      status: status ?? this.status,
      paidDate: paidDate ?? this.paidDate,
      payments: payments ?? this.payments,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get statusDisplayName {
    switch (status) {
      case FeeStatus.pending:
        return 'Pending';
      case FeeStatus.paid:
        return 'Paid';
      case FeeStatus.overdue:
        return 'Overdue';
      case FeeStatus.waived:
        return 'Waived';
      case FeeStatus.partial:
        return 'Partial';
    }
  }

  bool get isOverdue => status == FeeStatus.overdue || 
                       (status == FeeStatus.pending && DateTime.now().isAfter(dueDate));
  bool get isFullyPaid => status == FeeStatus.paid;
  bool get hasPartialPayment => status == FeeStatus.partial;
  double get paymentPercentage => amount > 0 ? (paidAmount / amount) * 100 : 0;
}

class Payment {
  final String id;
  final String feeDueId;
  final double amount;
  final String currency;
  final PaymentMethod method;
  final String? transactionId;
  final String? reference;
  final String? notes;
  final DateTime paymentDate;
  final String recordedBy;
  final String recordedByName;
  final DateTime createdAt;

  Payment({
    required this.id,
    required this.feeDueId,
    required this.amount,
    required this.currency,
    required this.method,
    this.transactionId,
    this.reference,
    this.notes,
    required this.paymentDate,
    required this.recordedBy,
    required this.recordedByName,
    required this.createdAt,
  });

  factory Payment.fromMap(Map<String, dynamic> map) {
    return Payment(
      id: map['id'] ?? '',
      feeDueId: map['feeDueId'] ?? '',
      amount: (map['amount'] ?? 0.0).toDouble(),
      currency: map['currency'] ?? 'USD',
      method: PaymentMethod.values.firstWhere(
        (e) => e.name == map['method'],
        orElse: () => PaymentMethod.cash,
      ),
      transactionId: map['transactionId'],
      reference: map['reference'],
      notes: map['notes'],
      paymentDate: (map['paymentDate'] as Timestamp).toDate(),
      recordedBy: map['recordedBy'] ?? '',
      recordedByName: map['recordedByName'] ?? '',
      createdAt: (map['createdAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'feeDueId': feeDueId,
      'amount': amount,
      'currency': currency,
      'method': method.name,
      'transactionId': transactionId,
      'reference': reference,
      'notes': notes,
      'paymentDate': Timestamp.fromDate(paymentDate),
      'recordedBy': recordedBy,
      'recordedByName': recordedByName,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  String get methodDisplayName {
    switch (method) {
      case PaymentMethod.cash:
        return 'Cash';
      case PaymentMethod.bankTransfer:
        return 'Bank Transfer';
      case PaymentMethod.card:
        return 'Card';
      case PaymentMethod.cheque:
        return 'Cheque';
      case PaymentMethod.online:
        return 'Online';
      case PaymentMethod.offline:
        return 'Offline Payment';
    }
  }
}
