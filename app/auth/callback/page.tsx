'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Spinner } from '@/src/components/ui';
import { supabase } from '@/src/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const exchange = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) return;

      const code = new URL(window.location.href).searchParams.get('code');
      if (!code) {
        router.replace('/login');
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) router.replace('/login');
    };
    void exchange();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas">
      <Spinner />
    </main>
  );
}
