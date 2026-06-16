'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Button,
  Card,
  Heading,
  Screen,
  ScreenState,
  StatusBadge,
} from '@/src/components/ui';
import { services } from '@/src/services';
import { useAuthStore } from '@/src/store/appStore';

const leaveNames = {
  vacation: 'Wypoczynkowy',
  on_demand: 'Na żądanie',
  unpaid: 'Bezpłatny',
  care: 'Opieka',
};

export default function LeavesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const balance = useQuery({
    queryKey: ['leave-balance', user?.id],
    queryFn: () => services.leaves.balance(user?.id ?? ''),
    enabled: Boolean(user),
  });
  const leaves = useQuery({
    queryKey: ['leaves', user?.id],
    queryFn: () => services.leaves.list(user?.id),
    enabled: Boolean(user),
  });
  const latestDecision = leaves.data
    ?.filter((leave) => leave.status === 'approved' || leave.status === 'rejected')
    .sort((left, right) =>
      (right.updatedAt ?? right.createdAt ?? right.dateFrom).localeCompare(
        left.updatedAt ?? left.createdAt ?? left.dateFrom,
      ),
    )[0];

  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading title="Urlopy i wolne" />
        <div className="mb-3 flex items-center justify-between rounded-[18px] bg-navy px-5 py-4">
          <div>
            <p className="text-[12px] text-[#9AA8BC]">Dostępne dni</p>
            <p className="font-mono text-[32px] font-semibold text-white">
              {balance.data?.available ?? '—'}
            </p>
          </div>
          <p className="text-right text-[12px] leading-5 text-[#7E8BA0]">
            Wykorzystane · {balance.data?.used ?? '—'}
            <br />
            Pula roczna · {balance.data?.annual ?? '—'}
          </p>
        </div>
        <Button
          title="Nowy wniosek"
          icon={<CalendarPlus size={19} />}
          onPress={() => router.push('/worker/leaves/new')}
        />
        {latestDecision ? (
          <div className="mt-4 rounded-[14px] border border-lineSoft bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] tracking-[1px] text-subtle">
                  OSTATNIA DECYZJA
                </p>
                <p className="mt-1 font-semibold">
                  {leaveNames[latestDecision.type]}
                </p>
                <p className="mt-1 font-mono text-[12px] text-subtle">
                  {latestDecision.dateFrom} → {latestDecision.dateTo} ·{' '}
                  {latestDecision.days} dni
                </p>
              </div>
              <StatusBadge status={latestDecision.status} />
            </div>
          </div>
        ) : null}
        <p className="mb-2 mt-6 font-mono text-[11px] tracking-[1px] text-subtle">
          MOJE WNIOSKI
        </p>
        <ScreenState
          loading={leaves.isLoading}
          error={leaves.isError}
          empty={!leaves.data?.length}
        />
        <div className="space-y-2.5">
          {leaves.data?.map((leave) => (
            <Card key={leave.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{leaveNames[leave.type]}</p>
                  <p className="mt-1 font-mono text-[12px] text-subtle">
                    {leave.dateFrom} → {leave.dateTo} · {leave.days} dni
                  </p>
                </div>
                <StatusBadge status={leave.status} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Screen>
  );
}
