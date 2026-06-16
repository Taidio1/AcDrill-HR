'use client';

import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { deferAuthEvent } from '@/src/features/auth/authEvent';
import { resolveProfile } from '@/src/features/auth/authService';
import { supabase } from '@/src/lib/supabase';
import {
  useAuthStore,
  useToastStore,
  useWorkStore,
} from '@/src/store/appStore';

export function AuthListener() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const hydrateWork = useWorkStore((state) => state.hydrate);
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    void hydrateWork();

    const handleAuth = async (
      event: AuthChangeEvent,
      session: Session | null,
    ) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setHydrated();
        router.replace('/login');
        return;
      }
      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return;

      try {
        const result = await resolveProfile(session.user.id);
        if (!result.ok) {
          showToast(result.error);
          await supabase.auth.signOut();
          return;
        }
        setUser(result.user);
        setHydrated();
        router.replace(
          result.user.role === 'admin'
            ? '/admin/dashboard'
            : '/worker/dashboard',
        );
      } catch {
        showToast('Błąd połączenia. Sprawdź internet i spróbuj ponownie.');
        await supabase.auth.signOut();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      deferAuthEvent(() => handleAuth(event, session));
    });

    return () => subscription.unsubscribe();
  }, [hydrateWork, router, setHydrated, setUser, showToast]);

  return null;
}
