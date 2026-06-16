'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { useToastStore } from '@/src/store/appStore';
import type { LeaveStatus } from '@/src/types/entities';

type LeaveRealtimeRow = {
  id?: string;
  user_id?: string;
  status?: LeaveStatus;
};

export function useLeaveRequestUpdates(userId?: string) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`leave-request-updates:${userId}`)
      .on<LeaveRealtimeRow>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leave_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const status = payload.new.status;

          void queryClient.invalidateQueries({ queryKey: ['leaves', userId] });
          void queryClient.invalidateQueries({
            queryKey: ['leave-balance', userId],
          });

          if (status === 'approved') {
            showToast('Twój wniosek urlopowy został zaakceptowany');
          }
          if (status === 'rejected') {
            showToast('Twój wniosek urlopowy został odrzucony');
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, showToast, userId]);
}
