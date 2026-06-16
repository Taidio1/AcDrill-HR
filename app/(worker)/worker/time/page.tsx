'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card, Heading, Screen, ScreenState } from '@/src/components/ui';
import { LocationLine } from '@/src/components/LocationLine';
import { groupSessionsByLocalDay } from '@/src/features/work-session/daySessions';
import { formatClock, formatDuration, sessionSeconds } from '@/src/lib/format';
import { services } from '@/src/services';
import { useAuthStore } from '@/src/store/appStore';

export default function TimePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const query = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: () => services.workSessions.list(user?.id),
    enabled: Boolean(user),
  });
  const days = groupSessionsByLocalDay(query.data ?? []);
  const total =
    query.data?.reduce(
      (sum, session) =>
        sum + sessionSeconds(session.startedAt, session.endedAt),
      0,
    ) ?? 0;

  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading title="Czas pracy" />
        <div className="mb-5 flex items-center justify-between rounded-[18px] bg-navy p-5 text-white">
          <div>
            <p className="text-[12px] text-[#9AA8BC]">
              Czerwiec 2026 · {days.length} dni
            </p>
            <p className="mt-1 font-mono text-[34px] font-semibold">
              {formatDuration(total)}
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#FF6A1A2E] text-orange">
            <Clock size={25} />
          </span>
        </div>
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!days.length}
        />
        <div className="space-y-2.5">
          {days.map((day) => {
            const dayTotal = day.sessions.reduce(
              (sum, session) =>
                sum + sessionSeconds(session.startedAt, session.endedAt),
              0,
            );

            return (
              <Card
                key={day.dateKey}
                onClick={() => router.push(`/worker/time/${day.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-soft text-muted">
                    <Clock size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold">
                        {new Date(day.startedAt).toLocaleDateString('pl-PL', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                      <span className="font-mono font-semibold">
                        {formatDuration(dayTotal)}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[12px] text-muted">
                      {formatClock(day.startedAt)} → {formatClock(day.endedAt)}
                      {day.sessions.length > 1
                        ? ` · ${day.sessions.length} sesje`
                        : ''}
                    </p>
                    <LocationLine
                      point={day.startLocation}
                      className="mt-1 text-[11px] text-subtle"
                      emptyText="Brak lokalizacji"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}
