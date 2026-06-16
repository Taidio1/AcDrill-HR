'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthListener } from '@/src/components/AuthListener';
import { Toast } from '@/src/components/ui';
import { useLeaveRequestUpdates } from '@/src/features/leaves/useLeaveRequestUpdates';
import { queryClient } from '@/src/lib/queryClient';
import { useAuthStore } from '@/src/store/appStore';

function LeaveRequestListener() {
  const user = useAuthStore((state) => state.user);
  useLeaveRequestUpdates(user?.role === 'worker' ? user.id : undefined);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <LeaveRequestListener />
      {children}
      <Toast />
    </QueryClientProvider>
  );
}
