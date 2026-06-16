'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Plus } from 'lucide-react';

import { AdminScreen } from '@/src/components/AdminScreen';
import { Button, Card, Field, ScreenState } from '@/src/components/ui';
import {
  currentMonthLabel,
  findEmployeeName,
  findPayslipForAdvance,
  groupPayslipsByMonth,
  listWorkerOptions,
  summarizePayslips,
} from '@/src/features/payroll/adminPayroll';
import { formatMoney } from '@/src/lib/format';
import { services } from '@/src/services';
import { useToastStore } from '@/src/store/appStore';

export default function AdminPayrollPage() {
  const [mode, setMode] = useState<'payslip' | 'advance'>();
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState('Czerwiec 2026');
  const [gross, setGross] = useState('8200');
  const [net, setNet] = useState('6380');
  const [advance, setAdvance] = useState('500');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const client = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const query = useQuery({
    queryKey: ['payslips-admin'],
    queryFn: () => services.payslips.list(),
  });
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: services.employees.list,
  });
  const employeeOptions = listWorkerOptions(employeesQuery.data ?? []);
  const selectedEmployeeId = employeeId || employeeOptions[0]?.value || '';
  const advancePayslip = findPayslipForAdvance(
    query.data ?? [],
    selectedEmployeeId,
  );
  const payslips = query.data ?? [];
  const monthGroups = useMemo(
    () => groupPayslipsByMonth(payslips),
    [payslips],
  );
  const thisMonth = currentMonthLabel();
  const currentSummary = useMemo(
    () =>
      summarizePayslips(
        payslips.filter((payslip) => payslip.month === thisMonth),
      ),
    [payslips, thisMonth],
  );
  const toggleMonth = (month: string) =>
    setCollapsed((state) => ({ ...state, [month]: !state[month] }));
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployeeId) throw new Error('Wybierz pracownika.');
      if (mode === 'advance') {
        if (!advancePayslip) {
          throw new Error('Wybrany pracownik nie ma paska wypłat.');
        }
        return services.payslips.addAdvance(
          advancePayslip.id,
          Number(advance),
          new Date().toISOString().slice(0, 10),
        );
      }
      return services.payslips.create({
        userId: selectedEmployeeId,
        month,
        gross: Number(gross),
        net: Number(net),
        items: [],
        advances: [],
      });
    },
    onSuccess: async () => {
      setMode(undefined);
      await client.invalidateQueries({ queryKey: ['payslips'] });
      await client.invalidateQueries({ queryKey: ['payslips-admin'] });
      showToast('Dane płacowe zapisane');
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : 'Nie udało się zapisać danych.',
      );
    },
  });
  return (
    <AdminScreen title="Paski i zaliczki">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <div className="mb-4 flex gap-2">
          <Button
            title="+ Zaliczka"
            variant="secondary"
            className="flex-1"
            onPress={() => setMode('advance')}
          />
          <Button
            title="+ Dodaj pasek"
            className="flex-1"
            onPress={() => setMode('payslip')}
          />
        </div>
        <div className="mb-4 rounded-card border border-lineSoft bg-soft p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] uppercase tracking-wide text-muted">
              Podsumowanie · {thisMonth}
            </p>
            <span className="font-mono text-[12px] text-subtle">
              {currentSummary.count}{' '}
              {currentSummary.count === 1 ? 'pasek' : 'paski/-ów'}
            </span>
          </div>
          {currentSummary.count ? (
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5">
              <span className="font-mono text-[13px] text-muted">
                brutto {formatMoney(currentSummary.totalGross)}
              </span>
              <span className="font-mono text-[13px] font-semibold text-success">
                netto {formatMoney(currentSummary.totalNet)}
              </span>
              {currentSummary.totalAdvances ? (
                <span className="font-mono text-[13px] text-danger">
                  zaliczki − {formatMoney(currentSummary.totalAdvances)}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-subtle">
              Brak pasków w tym miesiącu.
            </p>
          )}
        </div>
        <ScreenState
          loading={query.isLoading || employeesQuery.isLoading}
          error={query.isError || employeesQuery.isError}
          empty={!query.data?.length}
        />
        <div className="space-y-4">
          {monthGroups.map((group) => {
            const isCollapsed = collapsed[group.month] ?? false;
            const summary = summarizePayslips(group.payslips);
            return (
              <section
                key={group.month}
                className="overflow-hidden rounded-card border border-lineSoft bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleMonth(group.month)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-soft"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      size={18}
                      className={`text-muted transition-transform ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                    <span className="font-display font-bold">
                      {group.month}
                    </span>
                    <span className="font-mono text-[12px] text-subtle">
                      · {summary.count}
                    </span>
                  </div>
                  <span className="font-mono text-[12px] font-semibold text-success">
                    {formatMoney(summary.totalNet)}
                  </span>
                </button>
                {isCollapsed ? null : (
                  <div className="space-y-2.5 border-t border-lineSoft p-3">
                    {group.payslips.map((payslip) => (
                      <Card key={payslip.id}>
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {findEmployeeName(
                                employeesQuery.data ?? [],
                                payslip.userId,
                              )}
                            </p>
                            <p className="text-[12px] text-subtle">
                              {payslip.month}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-[12px] text-muted">
                              brutto {formatMoney(payslip.gross)}
                            </p>
                            <p className="font-mono font-semibold text-success">
                              {formatMoney(payslip.net)}
                            </p>
                          </div>
                        </div>
                        {payslip.advances.map((item) => (
                          <div
                            key={item.id}
                            className="mt-2 flex justify-between border-t border-soft pt-2"
                          >
                            <span className="text-[12px] text-muted">
                              Zaliczka · {item.date}
                            </span>
                            <span className="font-mono text-[12px] text-danger">
                              − {formatMoney(item.amount)}
                            </span>
                          </div>
                        ))}
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
      {mode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6">
            <h2 className="mb-5 font-display text-[21px] font-extrabold">
              {mode === 'advance' ? 'Dodaj zaliczkę' : 'Dodaj pasek'}
            </h2>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-[12px] text-muted">
                Pracownik
              </span>
              <select
                className="min-h-12 w-full rounded-[11px] border border-line bg-white px-4 py-3 text-[14px] text-strong outline-none transition focus:ring-2 focus:ring-orange/20"
                value={selectedEmployeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                {employeeOptions.map((employee) => (
                  <option key={employee.value} value={employee.value}>
                    {employee.label}
                  </option>
                ))}
              </select>
              {mode === 'advance' && selectedEmployeeId && !advancePayslip ? (
                <span className="mt-1 block text-[11px] text-danger">
                  Wybrany pracownik nie ma paska wypłat.
                </span>
              ) : null}
            </label>
            {mode === 'advance' ? (
              <Field
                label="Kwota"
                type="number"
                min="1"
                value={advance}
                onChange={(event) => setAdvance(event.target.value)}
              />
            ) : (
              <>
                <Field
                  label="Miesiąc"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
                <Field
                  label="Brutto"
                  type="number"
                  min="0"
                  value={gross}
                  onChange={(event) => setGross(event.target.value)}
                />
                <Field
                  label="Netto"
                  type="number"
                  min="0"
                  value={net}
                  onChange={(event) => setNet(event.target.value)}
                />
              </>
            )}
            <div className="flex gap-2">
              <Button
                title="Anuluj"
                variant="secondary"
                className="flex-1"
                onPress={() => setMode(undefined)}
              />
              <Button
                title="Zapisz"
                className="flex-1"
                icon={<Plus size={18} />}
                disabled={
                  mutation.isPending ||
                  !selectedEmployeeId ||
                  (mode === 'advance' && !advancePayslip)
                }
                onPress={() => mutation.mutate()}
              />
            </div>
          </div>
        </div>
      ) : null}
    </AdminScreen>
  );
}
