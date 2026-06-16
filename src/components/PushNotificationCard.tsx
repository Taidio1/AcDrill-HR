'use client';

import type { ReactNode } from 'react';
import { Bell, BellOff, BellRing, Share } from 'lucide-react';

import { Button, Card, Spinner } from '@/src/components/ui';
import { useWebPush } from '@/src/hooks/useWebPush';

function Header({
  icon,
  tone,
  title,
  description,
}: {
  icon: ReactNode;
  tone: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] ${tone}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-[12px] leading-4 text-subtle">{description}</p>
      </div>
    </div>
  );
}

export function PushNotificationCard({ className }: { className?: string }) {
  const {
    isSupported,
    needsInstall,
    permission,
    isSubscribed,
    busy,
    error,
    subscribe,
    unsubscribe,
  } = useWebPush();

  // iOS poza trybem standalone — Push API niedostępne, pokaż instrukcję.
  if (needsInstall) {
    return (
      <Card className={className}>
        <Header
          icon={<Share size={21} />}
          tone="bg-[#E8EEF7] text-info"
          title="Powiadomienia"
          description="Aby włączyć powiadomienia na iPhonie, dodaj aplikację do ekranu początkowego."
        />
        <ol className="mt-3 space-y-1.5 pl-1 text-[12px] leading-5 text-subtle">
          <li>1. Dotknij ikony Udostępnij na pasku Safari.</li>
          <li>2. Wybierz „Dodaj do ekranu początkowego”.</li>
          <li>3. Otwórz aplikację z ekranu i wróć tutaj.</li>
        </ol>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className={className}>
        <Header
          icon={<BellOff size={21} />}
          tone="bg-soft text-muted"
          title="Powiadomienia"
          description="Ta przeglądarka nie obsługuje powiadomień push."
        />
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className={className}>
        <Header
          icon={<BellOff size={21} />}
          tone="bg-[#FCEAE8] text-danger"
          title="Powiadomienia zablokowane"
          description="Odblokuj powiadomienia dla tej aplikacji w ustawieniach przeglądarki, aby je włączyć."
        />
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Header
        icon={isSubscribed ? <BellRing size={21} /> : <Bell size={21} />}
        tone={
          isSubscribed
            ? 'bg-[#E6F4EC] text-success'
            : 'bg-[#FFF1E8] text-orange'
        }
        title="Powiadomienia push"
        description={
          isSubscribed
            ? 'Otrzymujesz powiadomienia na tym urządzeniu.'
            : 'Włącz powiadomienia o urlopach, paskach i zgłoszeniach.'
        }
      />
      <div className="mt-4">
        <Button
          title={
            busy
              ? 'Czekaj…'
              : isSubscribed
                ? 'Wyłącz powiadomienia'
                : 'Włącz powiadomienia'
          }
          variant={isSubscribed ? 'secondary' : 'primary'}
          disabled={busy}
          icon={busy ? <Spinner className="h-4 w-4" /> : undefined}
          onPress={() => {
            void (isSubscribed ? unsubscribe() : subscribe());
          }}
        />
      </div>
      {error ? <p className="mt-2 text-[12px] text-danger">{error}</p> : null}
    </Card>
  );
}
