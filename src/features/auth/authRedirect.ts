import type { User } from '@/src/types/entities';

/**
 * Czyste reguły przekierowań po hydratacji sesji.
 *
 * Zwraca ścieżkę, na którą należy przekierować, lub `null`, gdy bieżąca
 * lokalizacja jest dozwolona dla danego stanu uwierzytelnienia.
 *
 * Centralizuje logikę rozproszoną w `AuthListener` (po zdarzeniach Supabase)
 * i `app/page.tsx` (strona wejścia).
 */

// Ścieżki publiczne związane z logowaniem — dostępne dla niezalogowanych,
// a zalogowanych odsyłamy z nich na właściwy pulpit.
const PUBLIC_AUTH_PATHS = ['/login', '/auth/callback'];

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function dashboardFor(role: User['role']): string {
  return role === 'admin' ? '/admin/dashboard' : '/worker/dashboard';
}

// Obszar aplikacji, do którego należy ścieżka (na podstawie prefiksu trasy).
function areaFor(pathname: string): User['role'] | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/worker')) return 'worker';
  return null;
}

export function getAuthRedirectPath(
  pathname: string,
  role: User['role'] | null,
): string | null {
  // Niezalogowany: zostaje na stronach publicznych, w przeciwnym razie na login.
  if (!role) {
    return isPublicAuthPath(pathname) ? null : '/login';
  }

  // Zalogowany na stronie logowania → na własny pulpit.
  if (isPublicAuthPath(pathname)) {
    return dashboardFor(role);
  }

  // Zalogowany w obszarze innej roli → na własny pulpit.
  const area = areaFor(pathname);
  if (area && area !== role) {
    return dashboardFor(role);
  }

  // Lokalizacja dozwolona — brak przekierowania.
  return null;
}
