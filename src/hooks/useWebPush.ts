'use client';

import { useCallback, useEffect, useState } from 'react';

import { arrayBufferToBase64, urlBase64ToUint8Array } from '@/src/lib/webpush';
import { services } from '@/src/services';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

type NavigatorStandalone = Navigator & { standalone?: boolean };

function detectSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as NavigatorStandalone).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export interface UseWebPush {
  /** API Service Worker + Push dostępne w tej przeglądarce. */
  isSupported: boolean;
  /** Aplikacja działa w trybie standalone (PWA dodane do ekranu). */
  isStandalone: boolean;
  isIOS: boolean;
  /**
   * iOS poza trybem standalone — push API nie istnieje, dopóki użytkownik
   * nie doda aplikacji do ekranu początkowego. UI pokazuje wtedy instrukcję.
   */
  needsInstall: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  busy: boolean;
  error: string | null;
  /** Wywoływać WYŁĄCZNIE z gestu użytkownika (kliknięcie) — wymóg iOS. */
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function useWebPush(): UseWebPush {
  const [isSupported, setIsSupported] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supported = detectSupport();
    setIsSupported(supported);
    setIsStandalone(detectStandalone());
    setIsIOS(detectIOS());
    if (!supported) return;

    setPermission(Notification.permission);

    let active = true;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (active) setIsSubscribed(Boolean(subscription));
      })
      .catch(() => {
        /* brak rejestracji SW — pozostajemy niesubskrybowani */
      });

    return () => {
      active = false;
    };
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);

    if (!detectSupport()) {
      setError('Twoja przeglądarka nie obsługuje powiadomień push.');
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setError('Brak konfiguracji powiadomień (NEXT_PUBLIC_VAPID_PUBLIC_KEY).');
      return;
    }

    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        setError('Powiadomienia są zablokowane w ustawieniach przeglądarki.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');
      if (!p256dh || !auth) {
        throw new Error('Subskrypcja nie zawiera wymaganych kluczy.');
      }

      await services.pushSubscriptions.save({
        endpoint: subscription.endpoint,
        p256dhKey: arrayBufferToBase64(p256dh),
        authKey: arrayBufferToBase64(auth),
        userAgent: navigator.userAgent,
      });
      setIsSubscribed(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Nie udało się włączyć powiadomień.',
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await services.pushSubscriptions.remove(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Nie udało się wyłączyć powiadomień.',
      );
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    isSupported,
    isStandalone,
    isIOS,
    needsInstall: isIOS && !isStandalone && !isSupported,
    permission,
    isSubscribed,
    busy,
    error,
    subscribe,
    unsubscribe,
  };
}
