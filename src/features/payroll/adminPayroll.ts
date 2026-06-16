import type { Employee, Payslip } from '@/src/types/entities';

export function listWorkerOptions(employees: Employee[]) {
  return employees
    .filter((employee) => employee.role === 'worker')
    .map((employee) => ({
      value: employee.id,
      label: employee.name,
    }));
}

export function findEmployeeName(
  employees: Employee[],
  userId: string,
): string {
  return employees.find((employee) => employee.id === userId)?.name ?? userId;
}

export function findPayslipForAdvance(
  payslips: Payslip[],
  userId: string,
): Payslip | undefined {
  return payslips.find((payslip) => payslip.userId === userId);
}

const POLISH_MONTHS = [
  'styczeń',
  'luty',
  'marzec',
  'kwiecień',
  'maj',
  'czerwiec',
  'lipiec',
  'sierpień',
  'wrzesień',
  'październik',
  'listopad',
  'grudzień',
];

/** Zwraca etykietę bieżącego miesiąca w formacie zgodnym z paskami, np. "Czerwiec 2026". */
export function currentMonthLabel(date: Date = new Date()): string {
  const name = POLISH_MONTHS[date.getMonth()] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
}

/** Klucz sortujący etykietę miesiąca ("Maj 2026" → 202605); 0 dla nierozpoznanych. */
function monthSortKey(month: string): number {
  const parts = month.trim().toLowerCase().split(/\s+/);
  const name = parts[0] ?? '';
  const year = Number(parts[1]);
  const index = POLISH_MONTHS.indexOf(name);
  if (index === -1 || !Number.isFinite(year)) return 0;
  return year * 100 + (index + 1);
}

export interface MonthGroup {
  month: string;
  sortKey: number;
  payslips: Payslip[];
}

/** Grupuje paski wg miesiąca, sortując grupy od najnowszej do najstarszej. */
export function groupPayslipsByMonth(payslips: Payslip[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const payslip of payslips) {
    const existing = groups.get(payslip.month);
    if (existing) {
      existing.payslips.push(payslip);
    } else {
      groups.set(payslip.month, {
        month: payslip.month,
        sortKey: monthSortKey(payslip.month),
        payslips: [payslip],
      });
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.sortKey - a.sortKey);
}

export interface PayrollSummary {
  count: number;
  totalGross: number;
  totalNet: number;
  totalAdvances: number;
  netAfterAdvances: number;
}

/** Podsumowuje liczbę pasków oraz kwoty brutto/netto i zaliczki w grupie. */
export function summarizePayslips(payslips: Payslip[]): PayrollSummary {
  return payslips.reduce<PayrollSummary>(
    (summary, payslip) => {
      const advances = payslip.advances.reduce(
        (sum, advance) => sum + advance.amount,
        0,
      );
      summary.count += 1;
      summary.totalGross += payslip.gross;
      summary.totalNet += payslip.net;
      summary.totalAdvances += advances;
      summary.netAfterAdvances += payslip.net - advances;
      return summary;
    },
    {
      count: 0,
      totalGross: 0,
      totalNet: 0,
      totalAdvances: 0,
      netAfterAdvances: 0,
    },
  );
}
