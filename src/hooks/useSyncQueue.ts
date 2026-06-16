'use client';

import { useCallback, useEffect } from 'react';

import { services } from '@/src/services';
import { readQueue, saveQueue } from '@/src/lib/syncQueue';
import { useToastStore, useWorkStore } from '@/src/store/appStore';

export function useSyncQueue(): void {
  const processQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = readQueue();
    if (queue.length === 0) return;

    const remaining = [...queue];
    const idMap: Record<string, string> = {};
    let synced = false;

    for (let i = 0; i < remaining.length; i++) {
      const op = remaining[i];
      if (!navigator.onLine) break;

      try {
        if (op.type === 'start') {
          const serverSession = await services.workSessions.start({
            userId: op.session.userId,
            startedAt: op.session.startedAt,
            startLocation: op.session.startLocation,
          });
          idMap[op.session.id] = serverSession.id;
          const active = useWorkStore.getState().active;
          if (active?.id === op.session.id) {
            await useWorkStore.getState().setActive(serverSession);
          }
        } else {
          const serverId = idMap[op.sessionId] ?? op.sessionId;
          await services.workSessions.stop(serverId, {
            endedAt: op.endedAt,
            endLocation: op.endLocation,
          });
        }
        remaining.splice(i, 1);
        i--;
        synced = true;
      } catch {
        if (!navigator.onLine) break;
        console.error('[SyncQueue] permanent error, dropping operation:', op.type);
        remaining.splice(i, 1);
        i--;
      }
    }

    saveQueue(remaining);

    if (synced) {
      useWorkStore.getState().clearPendingSync();
      useToastStore.getState().show('Sesja zsynchronizowana');
    }
  }, []);

  useEffect(() => {
    void processQueue();
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [processQueue]);
}
