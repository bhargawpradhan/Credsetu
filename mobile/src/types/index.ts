export interface User {
  id: string;
  phone: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  isRepaid: boolean;
  repaidAt: string | null;
  receiptUrl: string | null;
  notes?: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  totalPending: number;
  overdueAmount: number;
  counts: {
    total: number;
    active: number;
    overdue: number;
    repaid: number;
  };
}

export interface CreateLoanPayload {
  friendName: string;
  amount: number;
  dueDate: string;
  notes?: string;
  receiptUri?: string | null;
}

export type LoanFilterStatus = 'all' | 'active' | 'overdue' | 'repaid';
