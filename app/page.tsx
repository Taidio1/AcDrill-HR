'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Spinner } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/appStore';

export default function EntryPage() {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace('/login');
    else if (user.role === 'admin') router.replace('/admin/dashboard');
    else router.replace('/worker/dashboard');
  }, [hydrated, router, user]);

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner />
      </main>
    );
  }
  return null;
}
