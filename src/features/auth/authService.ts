import type { AuthError } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import type { User, UserRole } from '@/src/types/entities';

export type ProfileResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export async function resolveProfile(userId: string): Promise<ProfileResult> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, initials, role, job_title, is_active')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: 'Nie znaleziono profilu. Skontaktuj się z administratorem.',
    };
  }

  if (!data.is_active) {
    return {
      ok: false,
      error: 'Twoje konto jest nieaktywne. Skontaktuj się z administratorem.',
    };
  }

  const role = data.role as UserRole;
  if (role !== 'admin' && role !== 'worker') {
    return {
      ok: false,
      error: 'Nieprawidłowa rola konta. Skontaktuj się z administratorem.',
    };
  }

  return {
    ok: true,
    user: {
      id: data.id as string,
      name: data.full_name as string,
      initials: data.initials as string,
      role,
      jobTitle: data.job_title as string,
    },
  };
}

export function getAuthErrorMessage(error: AuthError): string {
  if (error.status === 429) {
    return 'Zbyt wiele prób logowania. Poczekaj chwilę i spróbuj ponownie.';
  }
  const msg = error.message ?? '';
  if (
    msg.includes('Invalid login credentials') ||
    msg.includes('invalid_credentials')
  ) {
    return 'Nieprawidłowy adres e-mail lub hasło.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Potwierdź adres e-mail przed zalogowaniem.';
  }
  return 'Błąd logowania. Sprawdź internet i spróbuj ponownie.';
}
