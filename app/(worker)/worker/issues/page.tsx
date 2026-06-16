'use client';

import { useQuery } from '@tanstack/react-query';
import { PackagePlus, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Card,
  Heading,
  Screen,
  ScreenState,
  StatusBadge,
} from '@/src/components/ui';
import { services } from '@/src/services';
import { useAuthStore } from '@/src/store/appStore';

export default function IssuesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const query = useQuery({
    queryKey: ['issues', user?.id],
    queryFn: () => services.issues.list(user?.id),
    enabled: Boolean(user),
  });
  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading title="Zgłoszenia" />
        <div className="mb-6 grid grid-cols-2 gap-2.5">
          <button
            className="rounded-card bg-[#FCEAE8] p-4 text-left"
            onClick={() => router.push('/worker/issues/new?type=breakdown')}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-danger text-white">
              <TriangleAlert size={21} />
            </span>
            <span className="mt-3 block font-semibold text-[#9B271C]">
              Awaria maszyny
            </span>
          </button>
          <button
            className="rounded-card bg-[#E8EEF7] p-4 text-left"
            onClick={() => router.push('/worker/issues/new?type=materials')}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-info text-white">
              <PackagePlus size={21} />
            </span>
            <span className="mt-3 block font-semibold text-[#1C4374]">
              Zapotrzebowanie
            </span>
          </button>
        </div>
        <p className="mb-2 font-mono text-[11px] tracking-[1px] text-subtle">
          MOJE ZGŁOSZENIA
        </p>
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!query.data?.length}
        />
        <div className="space-y-2.5">
          {query.data?.map((issue) => (
            <Card key={issue.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
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
              <div className="mt-2 flex justify-between gap-2 text-[12px]">
                <span className="text-muted">
                  Priorytet: <StatusBadge status={issue.priority} />
                </span>
                <span className="text-subtle">
                  {new Date(issue.createdAt).toLocaleDateString('pl-PL')}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Screen>
  );
}
