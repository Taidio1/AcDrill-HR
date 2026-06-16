'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Clock, Pencil } from 'lucide-react';

import { AdminScreen } from '@/src/components/AdminScreen';
import {
  Button,
  Card,
  ChoiceRow,
  Field,
  ScreenState,
  UserAvatar,
} from '@/src/components/ui';
import { LocationLine } from '@/src/components/LocationLine';
import { formatClock, formatDuration, sessionSeconds } from '@/src/lib/format';
import { services } from '@/src/services';
import { useToastStore } from '@/src/store/appStore';
import type { Employee, WorkSession } from '@/src/types/entities';

type SortKey = 'name' | 'hours' | 'recent';

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Ostatnia aktywność' },
  { value: 'hours', label: 'Najwięcej godzin' },
  { value: 'name', label: 'Nazwisko A–Z' },
];

interface EmployeeGroup {
  userId: string;
  name: string;
  initials: string;
  tone?: string;
  jobTitle?: string;
  sessions: WorkSession[];
  totalSeconds: number;
  lastStartedAt: string;
}

export default function AdminHoursPage() {
  const [editing, setEditing] = useState<WorkSession>();
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const client = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const query = useQuery({
    queryKey: ['sessions-admin'],
    queryFn: () => services.workSessions.list(),
  });
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: services.employees.list,
  });
  const employeeById = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const employee of employeesQuery.data ?? []) {
      map.set(employee.id, employee);
    }
    return map;
  }, [employeesQuery.data]);

  const groups = useMemo<EmployeeGroup[]>(() => {
    const byUser = new Map<string, EmployeeGroup>();
    for (const session of query.data ?? []) {
      const employee = employeeById.get(session.userId);
      let group = byUser.get(session.userId);
      if (!group) {
        group = {
          userId: session.userId,
          name: employee?.name ?? 'Pracownik',
          initials: employee?.initials ?? '··',
          tone: employee?.tone,
          jobTitle: employee?.jobTitle,
          sessions: [],
          totalSeconds: 0,
          lastStartedAt: session.startedAt,
        };
        byUser.set(session.userId, group);
      }
      group.sessions.push(session);
      group.totalSeconds += sessionSeconds(session.startedAt, session.endedAt);
      if (session.startedAt > group.lastStartedAt) {
        group.lastStartedAt = session.startedAt;
      }
    }
    const result = [...byUser.values()];
    for (const group of result) {
      group.sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    }
    result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'pl');
      if (sort === 'hours') return b.totalSeconds - a.totalSeconds;
      return b.lastStartedAt.localeCompare(a.lastStartedAt);
    });
    return result;
  }, [query.data, employeeById, sort]);

  const toggle = (userId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error('Brak sesji.');
      const day = editing.startedAt.slice(0, 10);
      return services.workSessions.update(editing.id, {
        startedAt: `${day}T${editFrom}:00.000Z`,
        endedAt: `${day}T${editTo}:00.000Z`,
      });
    },
    onSuccess: async () => {
      setEditing(undefined);
      await client.invalidateQueries({ queryKey: ['sessions'] });
      await client.invalidateQueries({ queryKey: ['sessions-admin'] });
      showToast('Zapisano zmianę godzin');
    },
  });
  const openEditor = (session: WorkSession) => {
    setEditing(session);
    setEditFrom(formatClock(session.startedAt));
    setEditTo(formatClock(session.endedAt));
  };
  return (
    <AdminScreen title="Godziny pracy">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!query.data?.length}
        />
        {query.data?.length ? (
          <div className="mb-1">
            <p className="mb-1.5 text-[12px] text-muted">Sortuj według</p>
            <ChoiceRow options={sortOptions} value={sort} onChange={setSort} />
          </div>
        ) : null}
        <div className="space-y-2.5">
          {groups.map((group) => {
            const isOpen = expanded.has(group.userId);
            return (
              <Card key={group.userId} className="p-0">
                <button
                  className="flex w-full items-center gap-3 p-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => toggle(group.userId)}
                >
                  <UserAvatar initials={group.initials} tone={group.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{group.name}</p>
                    {group.jobTitle ? (
                      <p className="truncate text-[12px] text-subtle">
                        {group.jobTitle}
                      </p>
                    ) : null}
                    <p className="mt-1 font-mono text-[12px] text-muted">
                      {formatDuration(group.totalSeconds)} ·{' '}
                      {group.sessions.length}{' '}
                      {group.sessions.length === 1 ? 'sesja' : 'sesje'}
                    </p>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-muted transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div className="space-y-2 border-t border-lineSoft p-3">
                    {group.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 rounded-control bg-soft p-3"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-muted">
                          <Clock size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[12px] text-strong">
                            {formatClock(session.startedAt)} →{' '}
                            {formatClock(session.endedAt)} ·{' '}
                            {formatDuration(
                              sessionSeconds(
                                session.startedAt,
                                session.endedAt,
                              ),
                            )}
                          </p>
                          <LocationLine
                            point={session.startLocation}
                            className="mt-1 text-[11px] text-subtle"
                          />
                        </div>
                        <button
                          aria-label="Edytuj godziny"
                          className="flex h-9 w-9 items-center justify-center rounded-control border border-line bg-white text-orange"
                          onClick={() => openEditor(session)}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6">
            <h2 className="font-display text-[21px] font-extrabold">
              Edytuj godziny
            </h2>
            <p className="mb-5 mt-1 text-muted">
              {employeeById.get(editing.userId)?.name ?? 'Pracownik'}
            </p>
            <Field
              label="Wejście (HH:mm)"
              type="time"
              value={editFrom}
              onChange={(event) => setEditFrom(event.target.value)}
            />
            <Field
              label="Wyjście (HH:mm)"
              type="time"
              value={editTo}
              onChange={(event) => setEditTo(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                title="Anuluj"
                variant="secondary"
                className="flex-1"
                onPress={() => setEditing(undefined)}
              />
              <Button
                title="Zapisz"
                className="flex-1"
                disabled={mutation.isPending}
                onPress={() => mutation.mutate()}
              />
            </div>
          </div>
        </div>
      ) : null}
    </AdminScreen>
  );
}
