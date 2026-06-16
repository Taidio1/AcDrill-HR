'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Card, Heading, Screen, ScreenState } from '@/src/components/ui';
import { LocationLine } from '@/src/components/LocationLine';
import { sessionsForSameLocalDay } from '@/src/features/work-session/daySessions';
import { formatClock, formatDuration, sessionSeconds } from '@/src/lib/format';
import { services } from '@/src/services';

export default function TimeDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [now, setNow] = useState(Date.now());
  const query = useQuery({
    queryKey: ['session', id],
    queryFn: () => services.workSessions.get(id),
  });
  const session = query.data;
  const sessionsQuery = useQuery({
    queryKey: ['sessions', session?.userId],
    queryFn: () => services.workSessions.list(session?.userId),
    enabled: Boolean(session?.userId),
  });
  const sessionSource = session
    ? sessionsQuery.data?.length
      ? sessionsQuery.data
      : [session]
    : [];
  const daySessions = session
    ? sessionsForSameLocalDay(session, sessionSource)
    : [];
  const hasActiveSession = daySessions.some(
    (item) => item.status === 'active' && !item.endedAt,
  );
  const currentIso = new Date(now).toISOString();
  const total = daySessions.reduce(
    (sum, item) => sum + sessionSeconds(item.startedAt, item.endedAt ?? currentIso),
    0,
  );

  useEffect(() => {
    if (!hasActiveSession) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasActiveSession]);

  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading
          title="Szczegóły dnia"
          action={
            <button
              aria-label="Wróć"
              className="flex h-11 w-11 items-center justify-center rounded-control bg-white text-muted"
              onClick={() => router.back()}
            >
              <ArrowLeft size={20} />
            </button>
          }
        />
        <ScreenState
          loading={query.isLoading || (Boolean(session) && sessionsQuery.isLoading)}
          error={query.isError || sessionsQuery.isError}
          empty={!session}
        />
        {session ? (
          <div className="space-y-3">
            <div className="rounded-card border border-lineSoft bg-navy p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] text-[#9AA8BC]">Łączny czas dnia</p>
                  <p className="mt-1 font-mono text-[36px] font-semibold text-orange">
                    {formatDuration(total)}
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#FF6A1A2E] text-orange">
                  <Clock size={22} />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[12px] text-[#9AA8BC]">Data</p>
                  <p className="font-semibold">
                    {new Date(session.startedAt).toLocaleDateString('pl-PL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#9AA8BC]">Sesje</p>
                  <p className="font-mono font-semibold">
                    {daySessions.length}
                  </p>
                </div>
              </div>
            </div>

            <section>
              <h2 className="mb-2 px-1 font-display text-[18px] font-bold text-ink">
                Sesje pracy
              </h2>
              <div className="space-y-2.5">
                {daySessions.map((item, index) => {
                  const isActive = item.status === 'active' && !item.endedAt;
                  const durationEnd = item.endedAt ?? currentIso;

                  return (
                    <Card key={item.id}>
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-soft font-mono text-[13px] font-semibold text-muted">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-mono text-[15px] font-semibold text-ink">
                                {formatClock(item.startedAt)} →{' '}
                                {item.endedAt ? formatClock(item.endedAt) : '-'}
                              </p>
                              {isActive ? (
                                <p className="mt-1 text-[12px] font-semibold text-success">
                                  Aktywna
                                </p>
                              ) : null}
                            </div>
                            <p className="shrink-0 font-mono text-[15px] font-semibold text-orange">
                              {formatDuration(
                                sessionSeconds(item.startedAt, durationEnd),
                              )}
                            </p>
                          </div>
                          <LocationLine
                            point={item.startLocation}
                            iconSize={13}
                            className="mt-2 text-[12px] text-subtle"
                            emptyText="Brak lokalizacji"
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
