import type {
  DocumentRecord,
  Employee,
  IssueReport,
  LeaveBalance,
  LeaveRequest,
  Payslip,
  User,
  WorkSession,
} from '@/src/types/entities';

export interface CreateEmployeeInput {
  email: string;
  fullName: string;
  jobTitle: string;
  temporaryPassword: string;
}

export interface AppServices {
  auth: {
    login(role: User['role']): Promise<User>;
  };
  workSessions: {
    list(userId?: string): Promise<WorkSession[]>;
    get(id: string): Promise<WorkSession | undefined>;
    start(input: Omit<WorkSession, 'id' | 'status'>): Promise<WorkSession>;
    stop(
      id: string,
      input: Pick<WorkSession, 'endedAt' | 'endLocation'>,
    ): Promise<WorkSession>;
    update(id: string, input: Partial<WorkSession>): Promise<WorkSession>;
  };
  payslips: {
    list(userId?: string): Promise<Payslip[]>;
    get(id: string): Promise<Payslip | undefined>;
    create(input: Omit<Payslip, 'id'>): Promise<Payslip>;
    addAdvance(
      payslipId: string,
      amount: number,
      date: string,
    ): Promise<Payslip>;
  };
  documents: {
    list(userId?: string): Promise<DocumentRecord[]>;
    get(id: string): Promise<DocumentRecord | undefined>;
    markRead(id: string): Promise<DocumentRecord>;
    create(input: Omit<DocumentRecord, 'id'>): Promise<DocumentRecord>;
  };
  leaves: {
    list(userId?: string): Promise<LeaveRequest[]>;
    balance(userId: string): Promise<LeaveBalance>;
    create(
      input: Omit<LeaveRequest, 'id' | 'days' | 'status'>,
    ): Promise<LeaveRequest>;
    decide(id: string, status: 'approved' | 'rejected'): Promise<LeaveRequest>;
  };
  issues: {
    list(userId?: string): Promise<IssueReport[]>;
    create(
      input: Omit<IssueReport, 'id' | 'createdAt' | 'status'>,
    ): Promise<IssueReport>;
    updateStatus(
      id: string,
      status: IssueReport['status'],
    ): Promise<IssueReport>;
    remove(id: string): Promise<void>;
  };
  employees: {
    list(): Promise<Employee[]>;
    get(id: string): Promise<Employee | undefined>;
    create(input: CreateEmployeeInput): Promise<Employee>;
  };
  pushSubscriptions: {
    save(input: PushSubscriptionInput): Promise<void>;
    remove(endpoint: string): Promise<void>;
  };
}

export interface PushSubscriptionInput {
  endpoint: string;
  authKey: string;
  p256dhKey: string;
  userAgent?: string;
}
