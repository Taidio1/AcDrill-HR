'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { AdminScreen } from '@/src/components/AdminScreen';
import {
  Button,
  Card,
  Field,
  ScreenState,
  StatusBadge,
  UserAvatar,
} from '@/src/components/ui';
import {
  createEmployeeSchema,
  type CreateEmployeeFormData,
} from '@/src/features/employees/employeeSchema';
import { services } from '@/src/services';
import { useToastStore } from '@/src/store/appStore';

export default function EmployeesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const query = useQuery({
    queryKey: ['employees'],
    queryFn: services.employees.list,
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      email: '',
      fullName: '',
      jobTitle: 'Pracownik',
      temporaryPassword: '',
    },
  });
  const mutation = useMutation({
    mutationFn: services.employees.create,
    onSuccess: async () => {
      reset();
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      showToast('Pracownik dodany');
    },
    onError: (error) => {
      showToast(
        error instanceof Error
          ? error.message
          : 'Nie udalo sie dodac pracownika.',
      );
    },
  });
  const items = useMemo(
    () =>
      query.data?.filter((item) =>
        item.name.toLocaleLowerCase('pl').includes(
          search.toLocaleLowerCase('pl'),
        ),
      ) ?? [],
    [query.data, search],
  );
  const closeCreate = () => {
    setCreateOpen(false);
    reset();
  };

  return (
    <AdminScreen title="Pracownicy">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <div className="mb-4 flex items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[11px] bg-white px-4">
            <Search size={17} className="text-subtle" />
            <input
              className="min-h-12 flex-1 bg-transparent text-[14px] outline-none"
              placeholder="Szukaj pracownika..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button
            type="button"
            aria-label="Dodaj pracownika"
            title="Dodaj pracownika"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-orange text-white transition active:scale-[0.98]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={22} />
          </button>
        </div>
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!items.length}
        />
        <div className="space-y-2.5">
          {items.map((employee) => (
            <Card
              key={employee.id}
              onClick={() => router.push(`/admin/employees/${employee.id}`)}
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  initials={employee.initials}
                  tone={employee.tone}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{employee.name}</p>
                  <p className="text-[12px] text-subtle">
                    {employee.jobTitle}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={employee.workStatus} />
                  <p className="mt-1 font-mono text-[12px] text-muted">
                    {employee.today}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[21px] font-extrabold text-ink">
                  Dodaj pracownika
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  Konto worker z haslem tymczasowym.
                </p>
              </div>
              <button
                type="button"
                aria-label="Zamknij"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-soft text-muted"
                onClick={closeCreate}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              noValidate
            >
              <Controller
                control={control}
                name="fullName"
                render={({ field }) => (
                  <Field
                    label="Imie i nazwisko"
                    autoComplete="name"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.fullName?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <Field
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.email?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="jobTitle"
                render={({ field }) => (
                  <Field
                    label="Stanowisko"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.jobTitle?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="temporaryPassword"
                render={({ field }) => (
                  <Field
                    label="Haslo tymczasowe"
                    type="password"
                    autoComplete="new-password"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.temporaryPassword?.message}
                  />
                )}
              />
              <div className="flex gap-2 pt-1">
                <Button
                  title="Anuluj"
                  variant="secondary"
                  className="flex-1"
                  onPress={closeCreate}
                />
                <Button
                  title={mutation.isPending ? 'Dodawanie...' : 'Dodaj'}
                  type="submit"
                  className="flex-1"
                  icon={<Plus size={18} />}
                  disabled={mutation.isPending}
                />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminScreen>
  );
}
