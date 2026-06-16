import { useWorkStore } from './appStore';

const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  startedAt: '2026-06-15T06:00:00.000Z',
  status: 'active' as const,
};

beforeEach(() => {
  useWorkStore.setState({
    active: null,
    lastCompleted: null,
    hydrated: false,
  });
});

describe('clearPendingSync', () => {
  test('czyści pendingSync z aktywnej sesji', () => {
    useWorkStore.setState({
      active: { ...mockSession, pendingSync: true },
    });
    useWorkStore.getState().clearPendingSync();
    expect(useWorkStore.getState().active?.pendingSync).toBe(false);
  });

  test('czyści pendingSync z ostatniej zakończonej sesji', () => {
    useWorkStore.setState({
      lastCompleted: {
        ...mockSession,
        endedAt: '2026-06-15T14:00:00.000Z',
        status: 'completed' as const,
        pendingSync: true,
      },
    });
    useWorkStore.getState().clearPendingSync();
    expect(useWorkStore.getState().lastCompleted?.pendingSync).toBe(false);
  });

  test('nie rzuca błędu gdy active i lastCompleted są null', () => {
    expect(() => useWorkStore.getState().clearPendingSync()).not.toThrow();
  });
});
