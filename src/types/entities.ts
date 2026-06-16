export type UserRole = 'worker' | 'admin';
export type WorkSessionStatus = 'active' | 'completed';
export type LeaveType = 'vacation' | 'on_demand' | 'unpaid' | 'care';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type IssueType = 'breakdown' | 'materials';
export type IssuePriority = 'low' | 'medium' | 'high';
export type IssueStatus = 'new' | 'in_progress' | 'closed';

export interface User {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  jobTitle: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  recordedAt: string;
  address?: string;
  label?: string;
}

export interface WorkSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  startLocation?: LocationPoint;
  endLocation?: LocationPoint;
  status: WorkSessionStatus;
  pendingSync?: boolean;
}

export interface PayslipItem {
  label: string;
  amount: number;
}

export interface Advance {
  id: string;
  userId: string;
  date: string;
  amount: number;
}

export interface Payslip {
  id: string;
  userId: string;
  month: string;
  gross: number;
  net: number;
  items: PayslipItem[];
  advances: Advance[];
  pdfUri?: string;
}

export interface DocumentRecord {
  id: string;
  userId: string | 'all';
  name: string;
  category: string;
  date: string;
  size: string;
  isNew: boolean;
  uri?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName?: string;
  type: LeaveType;
  dateFrom: string;
  dateTo: string;
  comment: string;
  days: number;
  status: LeaveStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  available: number;
  used: number;
  annual: number;
}

export interface IssueReport {
  id: string;
  userId: string;
  userName?: string;
  type: IssueType;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: string;
  imageUri?: string;
  location?: LocationPoint;
}

export interface Employee extends User {
  tone: string;
  workStatus: 'working' | 'leave' | 'off';
  today: string;
  since?: string;
}
