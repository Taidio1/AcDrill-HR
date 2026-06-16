// Jest używa testEnvironment: 'node' — symulujemy globale przeglądarki
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
(global as unknown as Record<string, unknown>).window = global;
(global as unknown as Record<string, unknown>).localStorage = localStorageMock;

import { addToQueue, readQueue, saveQueue } from './syncQueue';
import type { SyncOperation } from './syncQueue';

const mockStart: SyncOperation = {
  type: 'start',
  session: {
    id: 'local-uuid-1',
    userId: 'user-1',
    startedAt: '2026-06-15T06:00:00.000Z',
    status: 'active',
    pendingSync: true,
  },
};

const mockStop: SyncOperation = {
  type: 'stop',
  sessionId: 'local-uuid-1',
  endedAt: '2026-06-15T14:00:00.000Z',
};

beforeEach(() => {
  localStorageMock.clear();
});

describe('readQueue', () => {
  test('zwraca pustą tablicę gdy brak danych', () => {
    expect(readQueue()).toEqual([]);
  });

  test('zwraca sparsowaną tablicę operacji', () => {
    localStorage.setItem('acdrill-sync-queue', JSON.stringify([mockStart]));
    expect(readQueue()).toEqual([mockStart]);
  });

  test('zwraca pustą tablicę przy uszkodzonym JSON', () => {
    localStorage.setItem('acdrill-sync-queue', 'nie-json');
    expect(readQueue()).toEqual([]);
  });
});

describe('addToQueue', () => {
  test('dodaje operację start do pustej kolejki', () => {
    addToQueue(mockStart);
    expect(readQueue()).toEqual([mockStart]);
  });

  test('dołącza kolejne operacje zachowując kolejność', () => {
    addToQueue(mockStart);
    addToQueue(mockStop);
    expect(readQueue()).toEqual([mockStart, mockStop]);
  });
});

describe('saveQueue', () => {
  test('zapisuje tablicę operacji', () => {
    saveQueue([mockStop]);
    expect(readQueue()).toEqual([mockStop]);
  });

  test('usuwa klucz z localStorage gdy tablica jest pusta', () => {
    addToQueue(mockStart);
    saveQueue([]);
    expect(localStorage.getItem('acdrill-sync-queue')).toBeNull();
  });

  test('zastępuje istniejącą kolejkę', () => {
    addToQueue(mockStart);
    addToQueue(mockStop);
    saveQueue([mockStop]);
    expect(readQueue()).toEqual([mockStop]);
  });
});
