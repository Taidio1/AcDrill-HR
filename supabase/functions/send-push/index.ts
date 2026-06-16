// Edge Function: wysyłka Web Push do wszystkich urządzeń użytkownika.
//
// Wywoływana SERWEROWO (triggery / serwer) z nagłówkiem:
//   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
// Body: { userId: string, title: string, body: string, url?: string }
//
// Podejście Deno-safe: `web-push` służy tylko do podpisu VAPID i zaszyfrowania
// ładunku (generateRequestDetails), a wysyłkę realizuje natywny fetch — dzięki
// temu omijamy klienta HTTP z Node, który bywa zawodny w runtime Deno.
//
// Sekrety (Dashboard → Project Settings → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (np. mailto:ty@example.com)
// SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY są wstrzykiwane automatycznie.
//
// Uwaga: w supabase/config.toml ustaw dla tej funkcji `verify_jwt = false`
// — autoryzację robimy sami (porównanie z service_role key).

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface SendPushRequest {
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  auth_key: string;
  p256dh_key: string;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? '';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Autoryzacja: tylko wywołania z kluczem service_role.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${SERVICE_ROLE_KEY}` || !SERVICE_ROLE_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return json({ error: 'Brak konfiguracji VAPID.' }, 500);
  }

  let payload: SendPushRequest;
  try {
    payload = (await req.json()) as SendPushRequest;
  } catch {
    return json({ error: 'Nieprawidłowy JSON.' }, 400);
  }

  const { userId, title, body, url } = payload;
  if (!userId || !title) {
    return json({ error: 'Wymagane pola: userId, title.' }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, auth_key, p256dh_key')
    .eq('user_id', userId);

  if (error) {
    return json({ error: `Odczyt subskrypcji: ${error.message}` }, 500);
  }
  if (!subscriptions || subscriptions.length === 0) {
    return json({ sent: 0, removed: 0 });
  }

  const notification = JSON.stringify({ title, body: body ?? '', url: url ?? '/' });
  const vapidDetails = {
    subject: VAPID_SUBJECT,
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY,
  };

  const expiredIds: string[] = [];
  let sent = 0;

  await Promise.all(
    (subscriptions as SubscriptionRow[]).map(async (sub) => {
      const details = webpush.generateRequestDetails(
        {
          endpoint: sub.endpoint,
          keys: { auth: sub.auth_key, p256dh: sub.p256dh_key },
        },
        notification,
        { vapidDetails, TTL: 60 },
      );

      try {
        const res = await fetch(details.endpoint, {
          method: details.method,
          headers: details.headers as HeadersInit,
          body: details.body as BodyInit,
        });
        if (res.status === 404 || res.status === 410) {
          expiredIds.push(sub.id); // martwa subskrypcja → do skasowania
        } else if (res.ok) {
          sent += 1;
        }
      } catch {
        // błąd sieci — nie kasujemy, spróbujemy ponownie następnym razem
      }
    }),
  );

  // Sprzątanie wygasłych subskrypcji (410 Gone / 404).
  let removed = 0;
  if (expiredIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds);
    if (!deleteError) removed = expiredIds.length;
  }

  return json({ sent, removed });
});
