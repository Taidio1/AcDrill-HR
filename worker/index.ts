/// <reference lib="webworker" />
//
// Custom Service Worker dla next-pwa.
// next-pwa kompiluje ten plik (worker/index.ts) osobnym webpackiem do
// public/worker-*.js i dołącza go do generowanego sw.js przez importScripts.
//
// PoC: potwierdzamy, że (1) plik się kompiluje w next-pwa 5.x,
// (2) handlery push/notificationclick są aktywne w zbudowanym sw.js.
//
// Ten katalog jest wykluczony z głównego tsconfig (lib: dom), bo używa
// typów ServiceWorkerGlobalScope (lib: webworker).

declare const self: ServiceWorkerGlobalScope;

// Marker PoC — po zbudowaniu i aktywacji SW powinien pojawić się w konsoli.
console.log('[acdrill-sw] custom worker załadowany');

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title ?? 'AcDrill HR';
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.url ?? '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const targetUrl: string =
    (event.notification.data as { url?: string } | undefined)?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            // @ts-expect-error navigate istnieje na WindowClient
            if (typeof client.navigate === 'function') client.navigate(targetUrl);
            return;
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
