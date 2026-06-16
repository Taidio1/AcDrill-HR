'use client';

import { Suspense, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, MapPin, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

import {
  Button,
  ChoiceRow,
  Field,
  Heading,
  Screen,
  ScreenState,
} from '@/src/components/ui';
import {
  issueSchema,
  type IssueFormValues,
} from '@/src/features/issues/issueSchema';
import { getCurrentLocation } from '@/src/hooks/useGeolocation';
import { services } from '@/src/services';
import { useAuthStore, useToastStore } from '@/src/store/appStore';
import type { LocationPoint } from '@/src/types/entities';

function NewIssueForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialType =
    params.get('type') === 'materials' ? 'materials' : 'breakdown';
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const client = useQueryClient();
  const [imageUri, setImageUri] = useState<string>();
  const [location, setLocation] = useState<LocationPoint>();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      type: initialType,
      description: '',
      priority: 'medium',
    },
  });
  const mutation = useMutation({
    mutationFn: (values: IssueFormValues) => {
      if (!user) throw new Error('Brak profilu użytkownika.');
      return services.issues.create({
        ...values,
        priority: values.priority ?? 'medium',
        userId: user.id,
        imageUri,
        location,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['issues'] });
      showToast('Zgłoszenie wysłane');
      router.back();
    },
  });

  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading title="Nowe zgłoszenie" />
        <p className="mb-2 text-[12px] text-muted">Typ</p>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <ChoiceRow
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'breakdown', label: 'Awaria' },
                { value: 'materials', label: 'Materiały' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Field
              label="Opis"
              multiline
              placeholder="Opisz problem lub zapotrzebowanie…"
              value={field.value}
              onChange={field.onChange}
              error={errors.description?.message}
            />
          )}
        />
        <p className="mb-2 text-[12px] text-muted">Priorytet</p>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <ChoiceRow
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'low', label: 'Niski' },
                { value: 'medium', label: 'Średni' },
                { value: 'high', label: 'Wysoki' },
              ]}
            />
          )}
        />
        {errors.priority?.message ? (
          <p className="-mt-2 mb-3 text-[11px] text-danger">
            {errors.priority.message}
          </p>
        ) : null}
        {imageUri ? (
          <div className="relative mb-4 overflow-hidden rounded-card">
            {/* eslint is disabled; the object URL is local and user-selected. */}
            <img
              src={imageUri}
              alt="Wybrane zdjęcie zgłoszenia"
              className="h-48 w-full object-cover"
            />
            <button
              aria-label="Usuń zdjęcie"
              className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-navy text-white"
              onClick={() => setImageUri(undefined)}
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <label className="mb-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-control border border-line bg-soft font-semibold text-strong">
            <ImageIcon size={18} className="text-orange" />
            Dodaj zdjęcie
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setImageUri(URL.createObjectURL(file));
              }}
            />
          </label>
        )}
        <Button
          title={location ? 'Lokalizacja dodana' : 'Dodaj lokalizację'}
          variant="secondary"
          icon={<MapPin size={18} className="text-success" />}
          onPress={async () => setLocation(await getCurrentLocation())}
        />
        <Button
          title={mutation.isPending ? 'Wysyłanie…' : 'Wyślij zgłoszenie'}
          className="mt-4"
          disabled={mutation.isPending}
          onPress={handleSubmit((values) => mutation.mutate(values))}
        />
      </div>
    </Screen>
  );
}

export default function NewIssuePage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <ScreenState loading="Ładowanie formularza…" />
        </Screen>
      }
    >
      <NewIssueForm />
    </Suspense>
  );
}
