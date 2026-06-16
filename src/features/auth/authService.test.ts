import type { AuthError } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import { getAuthErrorMessage, resolveProfile } from './authService';

// Jest hoistuje jest.mock() na górę pliku – mock jest aktywny przed każdym importem
jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockFrom = supabase.from as jest.Mock;

function buildChain(result: { data: unknown; error: unknown }) {
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select });
  return { single, eq, select };
}

describe('resolveProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('zwraca profil pracownika po poprawnych danych', async () => {
    buildChain({
      data: {
        id: 'user-1',
        full_name: 'Mariusz Kowalski',
        initials: 'MK',
        role: 'worker',
        job_title: 'Wiertacz',
        is_active: true,
      },
      error: null,
    });

    const result = await resolveProfile('user-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.role).toBe('worker');
      expect(result.user.name).toBe('Mariusz Kowalski');
      expect(result.user.jobTitle).toBe('Wiertacz');
    }
  });

  test('zwraca profil administratora po poprawnych danych', async () => {
    buildChain({
      data: {
        id: 'admin-1',
        full_name: 'Adam Nowak',
        initials: 'AN',
        role: 'admin',
        job_title: 'Administrator',
        is_active: true,
      },
      error: null,
    });

    const result = await resolveProfile('admin-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.role).toBe('admin');
    }
  });

  test('odrzuca nieaktywny profil z komunikatem po polsku', async () => {
    buildChain({
      data: {
        id: 'user-2',
        full_name: 'Jan Wiśnewski',
        initials: 'JW',
        role: 'worker',
        job_title: 'Wiertacz',
        is_active: false,
      },
      error: null,
    });

    const result = await resolveProfile('user-2');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('nieaktywne');
    }
  });

  test('odrzuca brakujący profil z komunikatem po polsku', async () => {
    buildChain({
      data: null,
      error: { message: 'No rows found', code: 'PGRST116' },
    });

    const result = await resolveProfile('brak-id');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('profilu');
    }
  });

  test('odrzuca nieprawidłową rolę z komunikatem po polsku', async () => {
    buildChain({
      data: {
        id: 'user-3',
        full_name: 'Test',
        initials: 'T',
        role: 'superuser',
        job_title: 'Test',
        is_active: true,
      },
      error: null,
    });

    const result = await resolveProfile('user-3');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('rola');
    }
  });
});

describe('getAuthErrorMessage', () => {
  const makeError = (message: string, status?: number): AuthError =>
    Object.assign(new Error(message), {
      status,
      code: undefined,
      __isAuthError: true,
      toJSON: () => ({ message, status }),
    }) as unknown as AuthError;

  test('mapuje błędne dane logowania po polsku', () => {
    const msg = getAuthErrorMessage(
      makeError('Invalid login credentials', 400),
    );
    expect(msg).toBe('Nieprawidłowy adres e-mail lub hasło.');
  });

  test('mapuje zbyt wiele prób logowania', () => {
    const msg = getAuthErrorMessage(makeError('Rate limited', 429));
    expect(msg).toBe(
      'Zbyt wiele prób logowania. Poczekaj chwilę i spróbuj ponownie.',
    );
  });

  test('zwraca ogólny komunikat dla nieznanych błędów', () => {
    const msg = getAuthErrorMessage(makeError('Unknown error', 500));
    expect(msg).toBe('Błąd logowania. Sprawdź internet i spróbuj ponownie.');
  });
});
