'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card, Heading, Screen, ScreenState } from '@/src/components/ui';
import { formatMoney } from '@/src/lib/format';
import { services } from '@/src/services';
import { useAuthStore } from '@/src/store/appStore';

export default function PayslipsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const query = useQuery({
    queryKey: ['payslips', user?.id],
    queryFn: () => services.payslips.list(user?.id),
    enabled: Boolean(user),
  });
  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading title="Paski wypłat" />
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!query.data?.length}
        />
        <div className="space-y-2.5">
          {query.data?.map((item) => (
            <Card
              key={item.id}
              onClick={() => router.push(`/worker/payslips/${item.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.month}</p>
                  <p className="text-[12px] text-subtle">netto</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[17px] font-semibold text-success">
                    {formatMoney(item.net)}
                  </span>
                  <ChevronRight size={19} className="text-subtle" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Screen>
  );
}
