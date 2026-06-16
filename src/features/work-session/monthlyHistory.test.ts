import type { WorkSession } from '@/src/types/entities';

import {
  currentMonthKey,
  groupSessionsByMonth,
} from './monthlyHistory';

const session = (
  id: string,
  startedAt: string,
  endedAt?: string,
): WorkSession => ({
  id,
  userId: 'worker-1',
  startedAt,
  endedAt,
  status: endedAt ? 'completed' : 'active',
});

describe('groupSessionsByMonth', () => {
  const now = new Date('2026-06-16T10:00:00.000Z');

  test('grupuje dni w miesiace posortowane od najnowszego', () => {
    const groups = groupSessionsByMonth(
      [
        session('maj', '2026-05-04T06:00:00.000Z', '2026-05-04T14:00:00.000Z'),
        session('czer-1', '2026-06-10T06:00:00.000Z', '2026-06-10T14:00:00.000Z'),
        session('czer-2', '2026-06-12T06:00:00.000Z', '2026-06-12T14:00:00.000Z'),
      ],
      now,
    );

    expect(groups.map((group) => group.monthKey)).toEqual([
      '2026-06',
      '2026-05',
    ]);
    expect(groups[0].days.map((day) => day.id)).toEqual(['czer-2', 'czer-1']);
  });

  test('sumuje czas pracy w obrebie miesiaca', () => {
    const groups = groupSessionsByMonth(
      [
        session('a', '2026-06-10T06:00:00.000Z', '2026-06-10T08:00:00.000Z'),
        session('b', '2026-06-11T06:00:00.000Z', '2026-06-11T09:00:00.000Z'),
      ],
      now,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].totalSeconds).toBe(5 * 3600);
  });

  test('pomija dni z przyszlosci wzgledem dnia dzisiejszego', () => {
    const groups = groupSessionsByMonth(
      [
        session('dzis', '2026-06-16T06:00:00.000Z', '2026-06-16T08:00:00.000Z'),
        session('jutro', '2026-06-17T06:00:00.000Z', '2026-06-17T08:00:00.000Z'),
      ],
      now,
    );

    expect(groups[0].days.map((day) => day.id)).toEqual(['dzis']);
  });

  test('zwraca pusta liste gdy brak sesji', () => {
    expect(groupSessionsByMonth([], now)).toEqual([]);
  });
});

describe('currentMonthKey', () => {
  test('zwraca klucz YYYY-MM dla biezacej daty', () => {
    expect(currentMonthKey(new Date('2026-06-16T10:00:00.000Z'))).toBe(
      '2026-06',
    );
  });
});
