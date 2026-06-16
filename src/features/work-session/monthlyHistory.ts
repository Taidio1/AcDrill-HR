import { sessionSeconds } from '@/src/lib/format';
import type { WorkSession } from '@/src/types/entities';

import { groupSessionsByLocalDay, type WorkSessionDayGroup } from './daySessions';

export interface WorkSessionMonthGroup {
  monthKey: string; // YYYY-MM (lokalna strefa)
  totalSeconds: number;
  days: WorkSessionDayGroup[];
}

function localMonthKey(now: Date) {
  return now.toLocaleDateString('sv-SE').slice(0, 7);
}

export function currentMonthKey(now: Date = new Date()) {
  return localMonthKey(now);
}

export function groupSessionsByMonth(
  sessions: WorkSession[],
  now: Date = new Date(),
): WorkSessionMonthGroup[] {
  const todayKey = now.toLocaleDateString('sv-SE');
  const days = groupSessionsByLocalDay(sessions).filter(
    (day) => day.dateKey <= todayKey,
  );

  const groups = new Map<string, WorkSessionDayGroup[]>();
  days.forEach((day) => {
    const key = day.dateKey.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), day]);
  });

  return [...groups.entries()]
    .map(([monthKey, items]) => ({
      monthKey,
      days: items,
      totalSeconds: items.reduce(
        (sum, day) =>
          sum +
          day.sessions.reduce(
            (acc, session) =>
              acc + sessionSeconds(session.startedAt, session.endedAt),
            0,
          ),
        0,
      ),
    }))
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey));
}
