'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Button, Card, Heading, Screen, ScreenState } from '@/src/components/ui';
import { formatMoney } from '@/src/lib/format';
import { services } from '@/src/services';

export default function PayslipDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => services.payslips.get(id),
  });
  const payslip = query.data;
  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading
          title={payslip?.month ?? 'Pasek wypłaty'}
          action={
            <button
              aria-label="Wróć"
              className="flex h-11 w-11 items-center justify-center rounded-control bg-white text-muted"
              onClick={() => router.back()}
            >
              <ArrowLeft size={20} />
            </button>
          }
        />
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!payslip}
        />
        {payslip ? (
          <div className="space-y-3">
            <Card className="bg-navy text-white">
              <p className="text-[12px] text-[#9AA8BC]">Do wypłaty</p>
              <p className="font-mono text-[34px] font-semibold text-success">
                {formatMoney(payslip.net)}
              </p>
              <p className="mt-2 text-sm text-[#9AA8BC]">
                Brutto {formatMoney(payslip.gross)}
              </p>
            </Card>
            <Card>
              <p className="mb-3 font-semibold">Składniki wynagrodzenia</p>
              <div className="divide-y divide-soft">
                {payslip.items.length ? (
                  payslip.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between gap-3 py-2 text-sm"
                    >
                      <span className="text-muted">{item.label}</span>
                      <span className="font-mono">{formatMoney(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">Brak rozbicia składników.</p>
                )}
              </div>
            </Card>
            <Card>
              <p className="mb-3 font-semibold">Zaliczki</p>
              {payslip.advances.length ? (
                payslip.advances.map((advance) => (
                  <div
                    key={advance.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span className="text-muted">{advance.date}</span>
                    <span className="font-mono text-danger">
                      − {formatMoney(advance.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Brak zaliczek.</p>
              )}
            </Card>
            <Button
              title="Pobierz PDF"
              variant="secondary"
              icon={<Download size={18} />}
              onPress={() => {
                if (payslip.pdfUri) window.open(payslip.pdfUri, '_blank');
              }}
              disabled={!payslip.pdfUri}
            />
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
