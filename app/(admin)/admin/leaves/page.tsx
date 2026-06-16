'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminScreen } from '@/src/components/AdminScreen';
import { Button, Card, ScreenState, StatusBadge } from '@/src/components/ui';
import { services } from '@/src/services';
import { useToastStore } from '@/src/store/appStore';
import type { LeaveRequest, LeaveStatus } from '@/src/types/entities';

const leaveNames = {
  vacation: 'Wypoczynkowy',
  on_demand: 'Na żądanie',
  unpaid: 'Bezpłatny',
  care: 'Opieka',
};

function getWorkerLabel(leave: LeaveRequest) {
  return leave.userName ?? leave.userId;
}

function sortByDecisionDate(left: LeaveRequest, right: LeaveRequest) {
  return (right.updatedAt ?? right.createdAt ?? right.dateFrom).localeCompare(
    left.updatedAt ?? left.createdAt ?? left.dateFrom,
  );
}

export default function AdminLeavesPage() {
  const client = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const [tab, setTab] = useState<'pending' | 'decided'>('pending');
  const query = useQuery({
    queryKey: ['leaves-admin'],
    queryFn: () => services.leaves.list(),
  });
  const mutation = useMutation({
    mutationFn: ({
      leave,
      status,
    }: {
      leave: LeaveRequest;
      status: Extract<LeaveStatus, 'approved' | 'rejected'>;
    }) => services.leaves.decide(leave.id, status),
    onSuccess: async (leave) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['leaves-admin'] }),
        client.invalidateQueries({ queryKey: ['leaves'] }),
        client.invalidateQueries({ queryKey: ['leave-balance'] }),
        client.invalidateQueries({ queryKey: ['leave-balance', leave.userId] }),
      ]);
      setTab('decided');
      showToast(
        leave.status === 'approved'
          ? 'Wniosek zaakceptowany'
          : 'Wniosek odrzucony',
      );
    },
    onError: (reason: Error) => {
      showToast(reason.message || 'Nie udało się zmienić statusu wniosku.');
    },
  });
  const pending = query.data?.filter((item) => item.status === 'pending') ?? [];
  const decided =
    query.data
      ?.filter((item) => item.status === 'approved' || item.status === 'rejected')
      .sort(sortByDecisionDate) ?? [];
  const visible = tab === 'pending' ? pending : decided;

  return (
    <AdminScreen title="Urlopy">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <div className="mb-4 flex rounded-[14px] border border-lineSoft bg-white p-1">
          <button
            className={`h-10 flex-1 rounded-[11px] text-[13px] font-semibold ${
              tab === 'pending' ? 'bg-navy text-white' : 'text-muted'
            }`}
            onClick={() => setTab('pending')}
            type="button"
          >
            Oczekujące · {pending.length}
          </button>
          <button
            className={`h-10 flex-1 rounded-[11px] text-[13px] font-semibold ${
              tab === 'decided' ? 'bg-navy text-white' : 'text-muted'
            }`}
            onClick={() => setTab('decided')}
            type="button"
          >
            Rozpatrzone · {decided.length}
          </button>
        </div>
        <p className="mb-3 font-mono text-[11px] tracking-[1px] text-subtle">
          {tab === 'pending' ? 'KOLEJKA WNIOSKÓW' : 'OSTATNIO ROZPATRZONE'} ·{' '}
          {visible.length}
        </p>
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={
            !visible.length &&
            (tab === 'pending'
              ? 'Brak oczekujących wniosków.'
              : 'Brak rozpatrzonych wniosków.')
          }
        />
        <div className="space-y-3">
          {visible.map((leave) => (
            <Card key={leave.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{getWorkerLabel(leave)}</p>
                  <p className="mt-1 text-[12px] text-subtle">
                    {leaveNames[leave.type]} · {leave.dateFrom} →{' '}
                    {leave.dateTo} · {leave.days} dni
                  </p>
                </div>
                <StatusBadge status={leave.status} />
              </div>
              {leave.updatedAt ? (
                <p className="mt-1 text-[12px] text-subtle">
                  Aktualizacja: {leave.updatedAt}
                </p>
              ) : null}
              {leave.comment ? (
                <p className="mt-2 text-sm text-muted">{leave.comment}</p>
              ) : null}
              {leave.status === 'pending' ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    title="Akceptuj"
                    variant="success"
                    className="flex-1"
                    disabled={mutation.isPending}
                    onPress={() =>
                      mutation.mutate({
                        leave,
                        status: 'approved',
                      })
                    }
                  />
                  <Button
                    title="Odrzuć"
                    variant="secondary"
                    className="flex-1"
                    disabled={mutation.isPending}
                    onPress={() =>
                      mutation.mutate({
                        leave,
                        status: 'rejected',
                      })
                    }
                  />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </AdminScreen>
  );
}
