export interface FeeStructure {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  academicYear: string;
  fees: FeeItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: FeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeItem {
  id: string;
  name: string;
  type: FeeType;
  amount: number;
  dueDate: Date;
  status: FeeStatus;
  description?: string;
  isMandatory: boolean;
}

export type FeeType = 'tuition' | 'transport' | 'library' | 'sports' | 'exam' | 'lab' | 'other';
export type FeeStatus = 'pending' | 'paid' | 'overdue' | 'partial' | 'waived';

export interface Payment {
  id: string;
  feeStructureId: string;
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  transactionId: string;
  receiptNumber: string;
  status: PaymentStatus;
  notes?: string;
  processedBy: string;
  createdAt: Date;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'online';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface FeeStats {
  totalFees: number;
  collectedFees: number;
  pendingFees: number;
  overdueFees: number;
  collectionRate: number;
  monthlyCollection: number;
}

export interface FeeFilters {
  studentId?: string;
  classId?: string;
  status?: FeeStatus;
  feeType?: FeeType;
  dateFrom?: Date;
  dateTo?: Date;
}
