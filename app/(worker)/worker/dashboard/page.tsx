'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Check,
  CloudUpload,
  MapPin,
  Play,
  Square,
  TriangleAlert,
  WalletCards,
} from 'lucide-react';
import { Button, Card, UserAvatar } from '@/src/components/ui';
import { LocationLine } from '@/src/components/LocationLine';
import { getCurrentLocation } from '@/src/hooks/useGeolocation';
import {
  formatClock,
  formatDuration,
  formatMoney,
  formatTimer,
  sessionSeconds,
} from '@/src/lib/format';
import { addToQueue } from '@/src/lib/syncQueue';
import { services } from '@/src/services';
import {
  useAuthStore,
  useToastStore,
  useWorkStore,
} from '@/src/store/appStore';
import type { WorkSession } from '@/src/types/entities';

export default function WorkerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const active = useWorkStore((state) => state.active);
  const lastCompleted = useWorkStore((state) => state.lastCompleted);
  const setActive = useWorkStore((state) => state.setActive);
  const finish = useWorkStore((state) => state.finish);
  const clearSummary = useWorkStore((state) => state.clearSummary);
  const showToast = useToastStore((state) => state.show);
  const queryClient = useQueryClient();
  const [confirmStop, setConfirmStop] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [gpsState, setGpsState] = useState<'idle' | 'fetching' | 'ready' | 'error'>('idle');
  const [gpsLocation, setGpsLocation] = useState<WorkSession['startLocation']>(undefined);

  const payslips = useQuery({
    queryKey: ['payslips', user?.id],
    queryFn: () => services.payslips.list(user?.id),
    enabled: Boolean(user),
  });
  const leaves = useQuery({
    queryKey: ['leave-balance', user?.id],
    queryFn: () => services.leaves.balance(user?.id ?? ''),
    enabled: Boolean(user),
  });
  const issues = useQuery({
    queryKey: ['issues', user?.id],
    queryFn: () => services.issues.list(user?.id),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  // Pre-fetch GPS tylko gdy uprawnienie już przyznane — nie triggerujemy dialogu przy ładowaniu
  useEffect(() => {
    if (active || !('permissions' in navigator)) return;
    let cancelled = false;
    void navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (cancelled || status.state !== 'granted') return;
        setGpsState('fetching');
        return getCurrentLocation().then((loc) => {
          if (cancelled) return;
          setGpsState(loc ? 'ready' : 'error');
          if (loc) setGpsLocation(loc);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [active]);

  // Retry GPS co 30s gdy brak lokalizacji
  useEffect(() => {
    if (active || gpsState !== 'error') return;
    const timer = window.setInterval(async () => {
      const loc = await getCurrentLocation();
      if (loc) {
        setGpsState('ready');
        setGpsLocation(loc);
      }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [active, gpsState]);

  const start = useMutation({
    mutationFn: async (): Promise<WorkSession> => {
      if (!user) throw new Error('Brak profilu użytkownika.');
      // Użyj pre-fetched lokalizacji lub pobierz teraz (dialog pojawi się w odpowiednim momencie)
      const location =
        gpsState === 'ready' && gpsLocation
          ? gpsLocation
          : await (async () => {
              const loc = await getCurrentLocation();
              setGpsState(loc ? 'ready' : 'error');
              if (loc) setGpsLocation(loc);
              return loc;
            })();
      const input = {
        userId: user.id,
        startedAt: new Date().toISOString(),
        startLocation: location,
      };
      if (!navigator.onLine) {
        const localId = crypto.randomUUID();
        const session: WorkSession = {
          ...input,
          id: localId,
          status: 'active',
          pendingSync: true,
        };
        addToQueue({ type: 'start', session });
        return session;
      }
      try {
        return await services.workSessions.start(input);
      } catch {
        const localId = crypto.randomUUID();
        const session: WorkSession = {
          ...input,
          id: localId,
          status: 'active',
          pendingSync: true,
        };
        addToQueue({ type: 'start', session });
        return session;
      }
    },
    onSuccess: async (session) => {
      setError(null);
      clearSummary();
      await setActive(session);
      showToast(
        session.pendingSync
          ? 'Rozpoczęto pracę · synchronizacja po powrocie zasięgu'
          : 'Rozpoczęto pracę · lokalizacja zapisana',
      );
    },
    onError: (reason: Error) => setError(reason.message),
  });

  const stop = useMutation({
    mutationFn: async (): Promise<WorkSession> => {
      if (!active) throw new Error('Brak aktywnej sesji.');
      const endedAt = new Date().toISOString();
      const endLocation = await getCurrentLocation();
      if (!navigator.onLine) {
        const session: WorkSession = {
          ...active,
          endedAt,
          endLocation,
          status: 'completed',
          pendingSync: true,
        };
        addToQueue({ type: 'stop', sessionId: active.id, endedAt, endLocation });
        return session;
      }
      try {
        return await services.workSessions.stop(active.id, { endedAt, endLocation });
      } catch {
        const session: WorkSession = {
          ...active,
          endedAt,
          endLocation,
          status: 'completed',
          pendingSync: true,
        };
        addToQueue({ type: 'stop', sessionId: active.id, endedAt, endLocation });
        return session;
      }
    },
    onSuccess: async (session) => {
      setConfirmStop(false);
      await finish(session);
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      showToast(
        session.pendingSync
          ? 'Zakończono pracę · synchronizacja po powrocie zasięgu'
          : 'Zakończono pracę · sesja zapisana',
      );
    },
    onError: (reason: Error) => setError(reason.message),
  });

  if (!user) return null;

  const dateLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const isWorking = Boolean(active);
  const openIssues =
    issues.data?.filter((item) => item.status !== 'closed').length ?? 0;

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        isWorking ? 'bg-[#0F1722]' : 'bg-canvas'
      } px-4 py-6 pb-24`}
    >
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserAvatar initials={user.initials} tone="#FF6A1A" />
            <div>
              <p
                className={`text-[12px] ${isWorking ? 'text-[#7E8BA0]' : 'text-subtle'}`}
              >
                {dateLabel}
              </p>
              <h1
                className={`font-display text-[19px] font-bold leading-tight ${
                  isWorking ? 'text-white' : 'text-ink'
                }`}
              >
                Cześć, {user.name.split(' ')[0]}
              </h1>
            </div>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-card bg-[#FCEAE8] p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {/* BEFORE WORK */}
        {!active && !lastCompleted ? (
          <div className="flex flex-col items-center pt-4">
            <p className="text-[15px] text-muted">Gotowy do pracy?</p>
            <p className="mb-8 mt-1 font-display text-[22px] font-bold text-ink">
              Rozpocznij dzień
            </p>

            {/* Start button with halo rings */}
            <div className="relative flex h-[208px] w-[208px] items-center justify-center">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-success opacity-[0.12]" />
              <div className="pointer-events-none absolute inset-[18px] rounded-full bg-success opacity-[0.16]" />
              <button
                disabled={start.isPending}
                onClick={() => start.mutate()}
                className="relative z-10 flex h-[172px] w-[172px] flex-col items-center justify-center rounded-full text-white shadow-[0_20px_40px_-12px_rgba(31,163,90,0.60)] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(160deg,#23B062,#178A4B)',
                }}
              >
                <Play size={48} fill="currentColor" />
                <span className="mt-1 font-display text-[19px] font-extrabold tracking-wide">
                  {start.isPending ? 'GPS…' : 'START'}
                </span>
              </button>
            </div>

            {/* Location pill */}
            <div
              className={`mt-8 flex items-center gap-2 rounded-round px-4 py-2.5 shadow-[0_1px_3px_rgba(16,22,33,0.07)] ${
                gpsState === 'error' ? 'bg-[#FEF2F2]' : 'bg-white'
              }`}
            >
              <MapPin
                size={15}
                className={`shrink-0 ${
                  gpsState === 'ready'
                    ? 'text-success'
                    : gpsState === 'error'
                      ? 'text-danger'
                      : 'text-muted'
                }`}
              />
              <span className="text-[13px] font-semibold text-strong">
                {gpsState === 'ready'
                  ? 'Lokalizacja GPS gotowa'
                  : gpsState === 'fetching'
                    ? 'Pobieranie lokalizacji…'
                    : gpsState === 'error'
                      ? 'Brak lokalizacji GPS'
                      : 'Lokalizacja GPS'}
              </span>
            </div>

            {/* Shortcut tiles */}
            <div className="mt-8 grid w-full grid-cols-3 gap-2.5">
              <div className="rounded-[14px] bg-white p-3">
                <WalletCards size={18} className="text-success" />
                <p className="mt-2.5 text-[11px] text-subtle">Ostatni pasek</p>
                <p className="mt-0.5 font-mono text-[13px] font-semibold text-ink">
                  {payslips.data?.[0]
                    ? formatMoney(payslips.data[0].net).replace(',00', '')
                    : '—'}
                </p>
              </div>
              <div className="rounded-[14px] bg-white p-3">
                <CalendarDays size={18} className="text-orange" />
                <p className="mt-2.5 text-[11px] text-subtle">Urlop</p>
                <p className="mt-0.5 font-mono text-[13px] font-semibold text-ink">
                  {leaves.data?.available ?? '—'} dni
                </p>
              </div>
              <div className="rounded-[14px] bg-white p-3">
                <TriangleAlert size={18} className="text-warning" />
                <p className="mt-2.5 text-[11px] text-subtle">Zgłoszenia</p>
                <p className="mt-0.5 font-mono text-[13px] font-semibold text-ink">
                  {openIssues} otw.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* WORKING STATE */}
        {active ? (
          <div className="flex flex-col items-center pt-2">
            {/* Active badge */}
            <div className="mb-6 flex items-center gap-2 rounded-round border border-[#286B4B] bg-[#173B2A] px-4 py-2">
              <span className="acd-pulse h-2 w-2 rounded-full bg-[#2FD27E]" />
              <span className="text-[12px] font-semibold text-[#7EE2AC]">
                Pracujesz od {formatClock(active.startedAt)}
              </span>
              {active.pendingSync ? (
                <CloudUpload size={13} className="ml-auto shrink-0 text-[#7EE2AC] opacity-60" />
              ) : null}
            </div>

            {/* Live timer */}
            <p className="font-mono text-[56px] font-semibold leading-none tracking-[-3px] text-white">
              {formatTimer(
                sessionSeconds(active.startedAt, new Date(now).toISOString()),
              )}
            </p>
            <p className="mt-2 text-[12px] text-[#7E8BA0]">
              Czas dzisiejszej sesji
            </p>

            {/* Stop button with pulsing ring */}
            <div className="relative mt-8 flex h-[170px] w-[170px] items-center justify-center">
              <div className="acd-ring pointer-events-none absolute inset-0 rounded-full border-2 border-danger" />
              <button
                onClick={() => setConfirmStop(true)}
                className="relative z-10 flex h-[138px] w-[138px] flex-col items-center justify-center rounded-full bg-danger text-white shadow-[0_16px_40px_rgba(224,57,43,0.40)]"
              >
                <Square size={36} fill="currentColor" />
                <span className="mt-1 font-display text-[16px] font-extrabold">
                  STOP
                </span>
              </button>
            </div>

            {/* Location */}
            <div className="mt-7 flex items-center gap-2 rounded-round bg-[#1C2840] px-4 py-2.5">
              <MapPin size={15} className="shrink-0 text-orange" />
              <LocationLine
                point={active.startLocation}
                showIcon={false}
                className="text-[12px] text-[#9AA8BC]"
                emptyText="Lokalizacja GPS niedostępna"
              />
            </div>
          </div>
        ) : null}

        {/* AFTER WORK */}
        {lastCompleted ? (
          <div>
            <Card>
              <div className="mb-5 flex items-center gap-2 text-success">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E6F4EC]">
                  {lastCompleted.pendingSync ? (
                    <CloudUpload size={14} className="text-orange" />
                  ) : (
                    <Check size={14} strokeWidth={3} />
                  )}
                </span>
                <span className="font-semibold">
                  {lastCompleted.pendingSync ? 'Oczekuje na synchronizację' : 'Sesja zapisana'}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[12px] text-subtle">Od</p>
                  <p className="font-mono text-[24px] font-semibold">
                    {formatClock(lastCompleted.startedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-subtle">Do</p>
                  <p className="font-mono text-[24px] font-semibold">
                    {formatClock(lastCompleted.endedAt)}
                  </p>
                </div>
              </div>
              <div className="my-5 h-px bg-soft" />
              <div className="flex items-center justify-between">
                <span className="text-muted">Łączny czas</span>
                <span className="font-mono text-[28px] font-semibold text-orange">
                  {formatDuration(
                    sessionSeconds(
                      lastCompleted.startedAt,
                      lastCompleted.endedAt,
                    ),
                  )}
                </span>
              </div>
            </Card>
            <Button
              title="Rozpocznij nową sesję"
              variant="navy"
              className="mt-3"
              onPress={clearSummary}
            />
          </div>
        ) : null}
      </div>

      {/* Stop confirmation sheet */}
      {confirmStop ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/50">
          <div className="w-full rounded-t-[26px] bg-white px-6 pb-10 pt-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FCEAE8] text-danger">
              <Square size={25} />
            </div>
            <h2 className="mt-4 font-display text-[21px] font-extrabold">
              Zakończyć pracę?
            </h2>
            <p className="mt-2 leading-5 text-muted">
              Czas i lokalizacja zostaną zapisane w dzisiejszej sesji.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                title="Anuluj"
                variant="secondary"
                className="flex-1"
                onPress={() => setConfirmStop(false)}
              />
              <Button
                title="Tak, zakończ"
                variant="danger"
                className="flex-1"
                disabled={stop.isPending}
                onPress={() => stop.mutate()}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
