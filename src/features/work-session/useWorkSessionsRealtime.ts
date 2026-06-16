'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

/**
 * Subscribes to changes on the `work_sessions` table and invalidates the
 * `employees` and `sessions-admin` queries so the admin dashboard
 * ("KTO TERAZ PRACUJE" and the "Godziny dziś" tile) refreshes almost
 * immediately when a worker starts or stops a session.
 *
 * The `employees` view derives `work_status` from active `work_sessions`, but
 * realtime does not emit changes for views — so we listen on the underlying
 * table instead.
 */
export function useWorkSessionsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('work-sessions-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_sessions',
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['employees'] });
          void queryClient.invalidateQueries({ queryKey: ['sessions-admin'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
