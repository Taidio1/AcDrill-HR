import type { WorkSession } from '@/src/types/entities';

function localDateKey(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE');
}

export interface WorkSessionDayGroup {
  id: string;
  dateKey: string;
  startedAt: string;
  endedAt?: string;
  sessions: WorkSession[];
  startLocation?: WorkSession['startLocation'];
}

export function sessionsForSameLocalDay(
  selected: WorkSession,
  sessions: WorkSession[],
) {
  const selectedDate = localDateKey(selected.startedAt);

  return sessions
    .filter(
      (session) =>
        session.userId === selected.userId &&
        localDateKey(session.startedAt) === selectedDate,
    )
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt));
}

export function groupSessionsByLocalDay(
  sessions: WorkSession[],
): WorkSessionDayGroup[] {
  const groups = new Map<string, WorkSession[]>();

  sessions.forEach((session) => {
    const key = `${session.userId}:${localDateKey(session.startedAt)}`;
    groups.set(key, [...(groups.get(key) ?? []), session]);
  });

  return [...groups.values()]
    .map((items) => {
      const sorted = [...items].sort((left, right) =>
        left.startedAt.localeCompare(right.startedAt),
      );
      const latest = sorted[sorted.length - 1];
      const hasActive = sorted.some((session) => !session.endedAt);
      const lastCompleted = [...sorted]
        .reverse()
        .find((session) => session.endedAt);

      return {
        id: latest.id,
        dateKey: localDateKey(sorted[0].startedAt),
        startedAt: sorted[0].startedAt,
        endedAt: hasActive ? undefined : lastCompleted?.endedAt,
        sessions: sorted,
        startLocation: sorted[0].startLocation,
      };
    })
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt));
}
