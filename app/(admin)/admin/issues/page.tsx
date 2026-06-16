'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminScreen } from '@/src/components/AdminScreen';
import {
  Button,
  Card,
  ChoiceRow,
  ConfirmDialog,
  ScreenState,
  StatusBadge,
} from '@/src/components/ui';
import { services } from '@/src/services';
import { useToastStore } from '@/src/store/appStore';
import type { IssueStatus, IssueType } from '@/src/types/entities';

export default function AdminIssuesPage() {
  const [filter, setFilter] = useState<'all' | IssueType>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const client = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const query = useQuery({
    queryKey: ['issues-admin'],
    queryFn: () => services.issues.list(),
  });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) =>
      services.issues.updateStatus(id, status),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['issues'] });
      await client.invalidateQueries({ queryKey: ['issues-admin'] });
      showToast('Status zgłoszenia zaktualizowany');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => services.issues.remove(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['issues'] });
      await client.invalidateQueries({ queryKey: ['issues-admin'] });
      setPendingDelete(null);
      showToast('Zgłoszenie usunięte');
    },
  });
  const items =
    query.data?.filter((item) => filter === 'all' || item.type === filter) ??
    [];
  return (
    <AdminScreen title="Zgłoszenia">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <ChoiceRow
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Wszystkie' },
            { value: 'breakdown', label: 'Awarie' },
            { value: 'materials', label: 'Zapotrz.' },
          ]}
        />
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!items.length}
        />
        <div className="space-y-3">
          {items.map((issue) => (
            <Card key={issue.id}>
              <div className="mb-2 flex justify-between gap-2">
                <span
                  className={`rounded-round px-3 py-1 text-[11px] font-semibold ${
                    issue.type === 'breakdown'
                      ? 'bg-[#FCEAE8] text-danger'
                      : 'bg-[#E8EEF7] text-info'
                  }`}
                >
                  {issue.type === 'breakdown' ? 'Awaria' : 'Zapotrzebowanie'}
                </span>
                <StatusBadge status={issue.status} />
              </div>
              <p className="font-semibold leading-5">{issue.description}</p>
              <p className="mt-1 text-[12px] text-subtle">
                Zgłosił: {issue.userName ?? 'Nieznany pracownik'} · priorytet{' '}
                {issue.priority}
              </p>
              <div className="mt-3 flex gap-2">
                {issue.status === 'new' ? (
                  <Button
                    title="Rozpocznij"
                    variant="secondary"
                    className="flex-1"
                    onPress={() =>
                      mutation.mutate({
                        id: issue.id,
                        status: 'in_progress',
                      })
                    }
                  />
                ) : null}
                {issue.status !== 'closed' ? (
                  <Button
                    title="Zamknij"
                    variant="navy"
                    className="flex-1"
                    onPress={() =>
                      mutation.mutate({ id: issue.id, status: 'closed' })
                    }
                  />
                ) : (
                  <Button
                    title="Przywróć"
                    variant="secondary"
                    className="flex-1"
                    onPress={() =>
                      mutation.mutate({ id: issue.id, status: 'in_progress' })
                    }
                  />
                )}
                <Button
                  title="Usuń"
                  variant="danger"
                  className="flex-1"
                  onPress={() => setPendingDelete(issue.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Usunąć zgłoszenie?"
        message="Tej operacji nie można cofnąć. Zgłoszenie zostanie trwale usunięte."
        confirmLabel="Usuń"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminScreen>
  );
}
