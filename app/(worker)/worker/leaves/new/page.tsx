'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import {
  Button,
  ChoiceRow,
  Field,
  Heading,
  Screen,
} from '@/src/components/ui';
import {
  leaveSchema,
  type LeaveFormValues,
} from '@/src/features/leaves/leaveSchema';
import { services } from '@/src/services';
import { useAuthStore, useToastStore } from '@/src/store/appStore';

export default function NewLeavePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const client = useQueryClient();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { type: 'vacation', dateFrom: '', dateTo: '', comment: '' },
  });
  const mutation = useMutation({
    mutationFn: (values: LeaveFormValues) => {
      if (!user) throw new Error('Brak profilu użytkownika.');
      return services.leaves.create({ ...values, userId: user.id });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['leaves'] });
      showToast('Wniosek urlopowy wysłany');
      router.back();
    },
  });
  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading title="Nowy wniosek" subtitle="Urlop lub dzień wolny" />
        <p className="mb-2 text-[12px] text-muted">Typ wniosku</p>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <ChoiceRow
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'vacation', label: 'Wypoczynkowy' },
                { value: 'on_demand', label: 'Na żądanie' },
                { value: 'care', label: 'Opieka' },
                { value: 'unpaid', label: 'Bezpłatny' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="dateFrom"
          render={({ field }) => (
            <Field
              label="Data od"
              type="date"
              value={field.value}
              onChange={field.onChange}
              error={errors.dateFrom?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="dateTo"
          render={({ field }) => (
            <Field
              label="Data do"
              type="date"
              value={field.value}
              onChange={field.onChange}
              error={errors.dateTo?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="comment"
          render={({ field }) => (
            <Field
              label="Komentarz"
              multiline
              placeholder="Opcjonalnie"
              value={field.value}
              onChange={field.onChange}
              error={errors.comment?.message}
            />
          )}
        />
        <Button
          title={mutation.isPending ? 'Wysyłanie…' : 'Wyślij wniosek'}
          disabled={mutation.isPending}
          onPress={handleSubmit((values) => mutation.mutate(values))}
        />
      </div>
    </Screen>
  );
}
