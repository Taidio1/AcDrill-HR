import type { WorkSession } from '@/src/types/entities';
import {
  groupSessionsByLocalDay,
  sessionsForSameLocalDay,
} from './daySessions';

const session = (
  id: string,
  userId: string,
  startedAt: string,
  endedAt?: string,
): WorkSession => ({
  id,
  userId,
  startedAt,
  endedAt,
  status: endedAt ? 'completed' : 'active',
});

describe('sessionsForSameLocalDay', () => {
  test('wybiera sesje tego samego pracownika i dnia, sortujac je od najwczesniejszej', () => {
    const selected = session(
      'selected',
      'worker-1',
      '2026-06-13T10:00:00.000Z',
      '2026-06-13T11:00:00.000Z',
    );
    const active = session('active', 'worker-1', '2026-06-13T12:00:00.000Z');
    const earlier = session(
      'earlier',
      'worker-1',
      '2026-06-13T06:00:00.000Z',
      '2026-06-13T08:00:00.000Z',
    );
    const otherWorker = session(
      'other-worker',
      'worker-2',
      '2026-06-13T07:00:00.000Z',
      '2026-06-13T08:00:00.000Z',
    );
    const otherDay = session(
      'other-day',
      'worker-1',
      '2026-06-14T06:00:00.000Z',
      '2026-06-14T08:00:00.000Z',
    );

    expect(
      sessionsForSameLocalDay(selected, [
        selected,
        active,
        earlier,
        otherWorker,
        otherDay,
      ]).map((item) => item.id),
    ).toEqual(['earlier', 'selected', 'active']);
  });
});

describe('groupSessionsByLocalDay', () => {
  test('laczenie kilka sesji z tego samego dnia w jeden wpis dnia', () => {
    const morning = session(
      'morning',
      'worker-1',
      '2026-06-16T06:00:00.000Z',
      '2026-06-16T08:00:00.000Z',
    );
    const afternoon = session(
      'afternoon',
      'worker-1',
      '2026-06-16T12:00:00.000Z',
      '2026-06-16T14:30:00.000Z',
    );
    const yesterday = session(
      'yesterday',
      'worker-1',
      '2026-06-15T06:00:00.000Z',
      '2026-06-15T07:00:00.000Z',
    );

    const groups = groupSessionsByLocalDay([afternoon, yesterday, morning]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      id: 'afternoon',
      startedAt: morning.startedAt,
      endedAt: afternoon.endedAt,
      sessions: [morning, afternoon],
    });
    expect(groups[1]).toMatchObject({
      id: 'yesterday',
      sessions: [yesterday],
    });
  });

  test('zostawia koniec dnia pusty gdy ostatnia sesja jest aktywna', () => {
    const completed = session(
      'completed',
      'worker-1',
      '2026-06-16T06:00:00.000Z',
      '2026-06-16T08:00:00.000Z',
    );
    const active = session('active', 'worker-1', '2026-06-16T12:00:00.000Z');

    expect(groupSessionsByLocalDay([active, completed])[0]).toMatchObject({
      id: 'active',
      startedAt: completed.startedAt,
      endedAt: undefined,
      sessions: [completed, active],
    });
  });
});
