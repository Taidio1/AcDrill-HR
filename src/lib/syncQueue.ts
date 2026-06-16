import type { LocationPoint, WorkSession } from '@/src/types/entities';

const QUEUE_KEY = 'acdrill-sync-queue';

export type SyncOperation =
  | { type: 'start'; session: WorkSession }
  | { type: 'stop'; sessionId: string; endedAt: string; endLocation?: LocationPoint };

export function readQueue(): SyncOperation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncOperation[]) : [];
  } catch {
    return [];
  }
}

export function addToQueue(op: SyncOperation): void {
  if (typeof window === 'undefined') return;
  const queue = readQueue();
  localStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, op]));
}

export function saveQueue(queue: SyncOperation[]): void {
  if (typeof window === 'undefined') return;
  if (queue.length === 0) {
    localStorage.removeItem(QUEUE_KEY);
  } else {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}
