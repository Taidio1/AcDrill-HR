import type { Employee, Payslip } from '@/src/types/entities';

import {
  currentMonthLabel,
  findEmployeeName,
  findPayslipForAdvance,
  groupPayslipsByMonth,
  listWorkerOptions,
  summarizePayslips,
} from './adminPayroll';

const employees: Employee[] = [
  {
    id: 'admin-1',
    name: 'Adam Cieslak',
    initials: 'AC',
    role: 'admin',
    jobTitle: 'Wlasciciel',
    tone: '#111111',
    workStatus: 'off',
    today: 'Wolne',
  },
  {
    id: 'worker-2',
    name: 'Grzegorz Dabrowski',
    initials: 'GD',
    role: 'worker',
    jobTitle: 'Brygadzista',
    tone: '#2563A8',
    workStatus: 'working',
    today: '02:53',
  },
  {
    id: 'worker-1',
    name: 'Mariusz Kowalczyk',
    initials: 'MK',
    role: 'worker',
    jobTitle: 'Operator wiertnicy',
    tone: '#FF6A1A',
    workStatus: 'working',
    today: '02:38',
  },
];

const payslips: Payslip[] = [
  {
    id: 'pay-1',
    userId: 'worker-1',
    month: 'Maj 2026',
    gross: 8200,
    net: 6380,
    items: [],
    advances: [],
  },
  {
    id: 'pay-2',
    userId: 'worker-2',
    month: 'Maj 2026',
    gross: 9000,
    net: 7000,
    items: [],
    advances: [],
  },
];

describe('admin payroll helpers', () => {
  it('pokazuje do wyboru tylko pracownikow, nie adminow', () => {
    expect(listWorkerOptions(employees)).toEqual([
      { value: 'worker-2', label: 'Grzegorz Dabrowski' },
      { value: 'worker-1', label: 'Mariusz Kowalczyk' },
    ]);
  });

  it('wyswietla nazwe pracownika przypisana do paska', () => {
    expect(findEmployeeName(employees, 'worker-2')).toBe('Grzegorz Dabrowski');
  });

  it('uzywa identyfikatora jako fallbacku, gdy pracownika nie ma w slowniku', () => {
    expect(findEmployeeName(employees, 'worker-404')).toBe('worker-404');
  });

  it('dodaje zaliczke do paska wybranego pracownika zamiast do pierwszego paska z listy', () => {
    expect(findPayslipForAdvance(payslips, 'worker-2')?.id).toBe('pay-2');
  });

  it('zwraca undefined, gdy wybrany pracownik nie ma paska wyplat', () => {
    expect(findPayslipForAdvance(payslips, 'worker-404')).toBeUndefined();
  });

  it('buduje etykiete biezacego miesiaca w formacie zgodnym z paskami', () => {
    expect(currentMonthLabel(new Date('2026-06-17T12:00:00'))).toBe(
      'Czerwiec 2026',
    );
  });

  it('grupuje paski wg miesiaca, od najnowszego do najstarszego', () => {
    const mixed: Payslip[] = [
      { ...payslips[0], id: 'a', month: 'Marzec 2026' },
      { ...payslips[0], id: 'b', month: 'Maj 2026' },
      { ...payslips[0], id: 'c', month: 'Marzec 2026' },
    ];
    const groups = groupPayslipsByMonth(mixed);
    expect(groups.map((group) => group.month)).toEqual([
      'Maj 2026',
      'Marzec 2026',
    ]);
    expect(groups[1].payslips.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('podsumowuje liczbe paskow oraz kwoty brutto, netto i zaliczki', () => {
    const withAdvance: Payslip[] = [
      {
        ...payslips[0],
        gross: 8200,
        net: 6380,
        advances: [
          { id: 'adv-1', userId: 'worker-1', date: '2026-05-12', amount: 500 },
        ],
      },
      { ...payslips[1], gross: 9000, net: 7000, advances: [] },
    ];
    expect(summarizePayslips(withAdvance)).toEqual({
      count: 2,
      totalGross: 17200,
      totalNet: 13380,
      totalAdvances: 500,
      netAfterAdvances: 12880,
    });
  });
});
