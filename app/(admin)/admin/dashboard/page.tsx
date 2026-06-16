'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  TriangleAlert,
  WalletCards,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AdminScreen } from '@/src/components/AdminScreen';
import { PushNotificationCard } from '@/src/components/PushNotificationCard';
import { Card, ScreenState, StatusBadge, UserAvatar } from '@/src/components/ui';
import { useWorkSessionsRealtime } from '@/src/features/work-session/useWorkSessionsRealtime';
import { sessionSeconds } from '@/src/lib/format';
import { services } from '@/src/services';

/** Local calendar day (sv-SE gives a sortable YYYY-MM-DD key). */
function localDayKey(date: Date) {
  return date.toLocaleDateString('sv-SE');
}

/** Sum of seconds → "H:MM" (e.g. 48900 → "13:35"). */
function formatTeamHours(totalSeconds: number) {
  const totalMinutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  useWorkSessionsRealtime();
  const employees = useQuery({
    queryKey: ['employees'],
    queryFn: services.employees.list,
  });
  const sessions = useQuery({
    queryKey: ['sessions-admin'],
    queryFn: () => services.workSessions.list(),
  });
  const leaves = useQuery({
    queryKey: ['leaves-admin'],
    queryFn: () => services.leaves.list(),
  });
  const issues = useQuery({
    queryKey: ['issues-admin'],
    queryFn: () => services.issues.list(),
  });
  const working =
    employees.data?.filter((item) => item.workStatus === 'working') ?? [];
  const pending =
    leaves.data?.filter((item) => item.status === 'pending').length ?? 0;
  const open =
    issues.data?.filter((item) => item.status !== 'closed').length ?? 0;
  const todayKey = localDayKey(new Date());
  const secondsToday = (sessions.data ?? [])
    .filter((session) => localDayKey(new Date(session.startedAt)) === todayKey)
    .reduce(
      (total, session) =>
        total + sessionSeconds(session.startedAt, session.endedAt),
      0,
    );
  const tiles = [
    {
      label: 'Pracuje teraz',
      value: String(working.length),
      sub: `z ${employees.data?.length ?? 0} w ekipie`,
      color: 'bg-success',
    },
    {
      label: 'Godziny dziś',
      value: formatTeamHours(secondsToday),
      sub: 'suma zespołu',
      color: 'bg-navy',
    },
    {
      label: 'Wnioski urlopowe',
      value: String(pending),
      sub: 'oczekują',
      color: 'bg-warning',
    },
    {
      label: 'Otwarte awarie',
      value: String(open),
      sub: 'do obsługi',
      color: 'bg-danger',
    },
  ];

  return (
    <AdminScreen title="Pulpit">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] text-subtle">
            {new Date().toLocaleDateString('pl-PL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <div className="flex items-center gap-2 rounded-round border border-lineSoft bg-white px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[12px] font-semibold text-success">
              Na żywo
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="relative overflow-hidden rounded-[15px] border border-lineSoft bg-white p-4"
            >
              <span
                className={`absolute bottom-4 left-0 top-4 w-1 rounded-r ${tile.color}`}
              />
              <p className="pl-1 text-[12px] text-subtle">{tile.label}</p>
              <p className="mt-1 pl-1 font-mono text-[28px] font-semibold">
                {tile.value}
              </p>
              <p className="pl-1 text-[11px] text-subtle">{tile.sub}</p>
            </div>
          ))}
        </div>

        <p className="mb-2 mt-6 font-mono text-[11px] tracking-[1px] text-subtle">
          KTO TERAZ PRACUJE
        </p>
        <ScreenState
          loading={employees.isLoading}
          error={employees.isError}
        />
        <Card>
          <div className="divide-y divide-soft">
            {working.map((employee) => (
              <button
                key={employee.id}
                className="flex w-full items-center gap-3 py-2.5 text-left"
                onClick={() =>
                  router.push(`/admin/employees/${employee.id}`)
                }
              >
                <UserAvatar
                  initials={employee.initials}
                  tone={employee.tone}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{employee.name}</span>
                  <span className="block text-[12px] text-subtle">
                    {employee.jobTitle}
                  </span>
                </span>
                <StatusBadge status="working" />
              </button>
            ))}
          </div>
        </Card>

        <button
          className="mt-4 flex w-full items-center gap-3 rounded-card bg-navy p-4 text-left"
          onClick={() => router.push('/admin/leaves')}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E0A53A33] text-warning">
            <CalendarDays size={22} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-white">
              {pending} wnioski urlopowe
            </span>
            <span className="block text-[12px] text-[#9AA8BC]">
              czekają na akceptację
            </span>
          </span>
          <ChevronRight className="text-[#7E8BA0]" />
        </button>

        <p className="mb-2 mt-6 font-mono text-[11px] tracking-[1px] text-subtle">
          ZARZĄDZANIE
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Godziny', icon: Clock, href: '/admin/hours' },
            { label: 'Dokumenty', icon: FileText, href: '/admin/documents' },
            {
              label: 'Paski i zaliczki',
              icon: WalletCards,
              href: '/admin/payroll',
            },
            {
              label: 'Zgłoszenia',
              icon: TriangleAlert,
              href: '/admin/issues',
            },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-2 rounded-control border border-lineSoft bg-white p-3 text-left"
              onClick={() => router.push(item.href)}
            >
              <item.icon size={19} className="text-orange" />
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        <p className="mb-2 mt-6 font-mono text-[11px] tracking-[1px] text-subtle">
          USTAWIENIA
        </p>
        <PushNotificationCard />
      </div>
    </AdminScreen>
  );
}
