'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock,
  TriangleAlert,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AdminScreen } from '@/src/components/AdminScreen';
import { Card, ScreenState, StatusBadge, UserAvatar } from '@/src/components/ui';
import { LocationLine } from '@/src/components/LocationLine';
import {
  currentMonthKey,
  groupSessionsByMonth,
} from '@/src/features/work-session/monthlyHistory';
import {
  formatClock,
  formatDayLabel,
  formatDuration,
  formatMoney,
  formatMonthLabel,
  sessionSeconds,
} from '@/src/lib/format';
import { services } from '@/src/services';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const employee = useQuery({
    queryKey: ['employee', id],
    queryFn: () => services.employees.get(id),
  });
  const sessions = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => services.workSessions.list(id),
  });
  const leaves = useQuery({
    queryKey: ['leaves', id],
    queryFn: () => services.leaves.list(id),
  });
  const issues = useQuery({
    queryKey: ['issues', id],
    queryFn: () => services.issues.list(id),
  });
  const payslips = useQuery({
    queryKey: ['payslips', id],
    queryFn: () => services.payslips.list(id),
  });
  const total =
    sessions.data?.reduce(
      (sum, item) => sum + sessionSeconds(item.startedAt, item.endedAt),
      0,
    ) ?? 0;
  if (typeof window !== 'undefined' && sessions.data) {
    // TODO usunac: tymczasowa diagnostyka historii pracy
    // eslint-disable-next-line no-console
    console.log('[DEBUG historia] strefa offset(min):', new Date().getTimezoneOffset());
    // eslint-disable-next-line no-console
    console.log('[DEBUG historia] teraz:', new Date().toISOString());
    sessions.data.forEach((s, i) => {
      // eslint-disable-next-line no-console
      console.log(
        `[DEBUG historia] #${i} start=${s.startedAt} end=${s.endedAt ?? 'AKTYWNA'} lokalnaData=${new Date(s.startedAt).toLocaleDateString('sv-SE')} sek=${sessionSeconds(s.startedAt, s.endedAt)}`,
      );
    });
  }
  const months = useMemo(
    () => groupSessionsByMonth(sessions.data ?? []),
    [sessions.data],
  );
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    () => new Set([currentMonthKey()]),
  );
  const toggleMonth = (monthKey: string) =>
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  return (
    <AdminScreen title="Profil pracownika">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <button
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} /> Wróć do listy
        </button>
        <ScreenState
          loading={employee.isLoading}
          error={employee.isError}
          empty={!employee.data}
        />
        {employee.data ? (
          <>
            <Card className="mb-4">
              <div className="flex items-center gap-4">
                <UserAvatar
                  initials={employee.data.initials}
                  tone={employee.data.tone}
                  size="lg"
                />
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold">
                    {employee.data.name}
                  </h2>
                  <p className="text-sm text-muted">
                    {employee.data.jobTitle}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={employee.data.workStatus} />
                  </div>
                </div>
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-2.5">
              <Card>
                <Clock size={20} className="text-orange" />
                <p className="mt-2 text-[11px] text-subtle">Czas pracy</p>
                <p className="font-mono font-semibold">
                  {formatDuration(total)}
                </p>
              </Card>
              <Card>
                <CalendarDays size={20} className="text-warning" />
                <p className="mt-2 text-[11px] text-subtle">Wnioski urlopowe</p>
                <p className="font-mono font-semibold">
                  {leaves.data?.length ?? 0}
                </p>
              </Card>
              <Card>
                <TriangleAlert size={20} className="text-danger" />
                <p className="mt-2 text-[11px] text-subtle">
                  Otwarte zgłoszenia
                </p>
                <p className="font-mono font-semibold">
                  {issues.data?.filter((item) => item.status !== 'closed')
                    .length ?? 0}
                </p>
              </Card>
              <Card>
                <p className="text-[11px] text-subtle">Ostatnia wypłata</p>
                <p className="mt-2 font-mono font-semibold text-success">
                  {payslips.data?.[0]
                    ? formatMoney(payslips.data[0].net)
                    : '—'}
                </p>
              </Card>
            </div>
            <div className="mt-4">
              <h3 className="mb-2.5 px-1 font-display text-sm font-bold text-strong">
                Historia pracy
              </h3>
              <ScreenState
                loading={sessions.isLoading}
                error={sessions.isError}
                empty={
                  !sessions.isLoading && months.length === 0
                    ? 'Brak zarejestrowanych dni pracy.'
                    : false
                }
              />
              <div className="space-y-2.5">
                {months.map((month) => {
                  const open = openMonths.has(month.monthKey);
                  return (
                    <div
                      key={month.monthKey}
                      className="overflow-hidden rounded-card border border-lineSoft bg-white"
                    >
                      <button
                        className="flex w-full items-center gap-3 p-4 text-left"
                        onClick={() => toggleMonth(month.monthKey)}
                        aria-expanded={open}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-strong">
                            {formatMonthLabel(month.monthKey)}
                          </p>
                          <p className="mt-1 font-mono text-[12px] text-muted">
                            {month.days.length}{' '}
                            {month.days.length === 1 ? 'dzień' : 'dni'} ·{' '}
                            {formatDuration(month.totalSeconds)}
                          </p>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-muted transition-transform ${
                            open ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {open ? (
                        <div className="border-t border-lineSoft">
                          {month.days.map((day) => (
                            <div
                              key={day.id}
                              className="flex items-center gap-3 border-b border-lineSoft px-4 py-3 last:border-b-0"
                            >
                              <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-soft text-muted">
                                <Clock size={18} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold capitalize text-strong">
                                  {formatDayLabel(day.startedAt)}
                                </p>
                                <p className="mt-0.5 font-mono text-[12px] text-muted">
                                  {formatClock(day.startedAt)} →{' '}
                                  {formatClock(day.endedAt)} ·{' '}
                                  {formatDuration(
                                    day.sessions.reduce(
                                      (sum, session) =>
                                        sum +
                                        sessionSeconds(
                                          session.startedAt,
                                          session.endedAt,
                                        ),
                                      0,
                                    ),
                                  )}
                                </p>
                                <LocationLine
                                  point={day.startLocation}
                                  className="mt-0.5 text-[11px] text-subtle"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminScreen>
  );
}
