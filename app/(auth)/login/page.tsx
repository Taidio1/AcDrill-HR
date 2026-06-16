'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button, Card, Field, Screen, Spinner } from '@/src/components/ui';
import { getAuthErrorMessage } from '@/src/features/auth/authService';
import {
  loginSchema,
  type LoginFormData,
} from '@/src/features/auth/loginSchema';
import { supabase } from '@/src/lib/supabase';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const isLoading = isSubmitting || isGoogleLoading;

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) setGlobalError(getAuthErrorMessage(error));
  };

  const handleGoogleLogin = async () => {
    setGlobalError(null);
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setGlobalError('Nie udało się uruchomić logowania przez Google.');
      }
    } catch {
      setGlobalError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Screen>
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center pb-10 pt-10">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] bg-navy">
            <span className="font-display text-[28px] font-extrabold text-white">
              AC
            </span>
            <div className="absolute bottom-0 h-3 w-full bg-orange" />
          </div>
          <p className="mt-5 font-display text-[30px] font-extrabold">DRILL</p>
          <p className="font-mono text-[11px] tracking-[3px] text-subtle">
            HR · SYSTEM
          </p>
        </div>

        <Card>
          <h1 className="font-display text-[24px] font-extrabold">
            Zaloguj się
          </h1>
          <p className="mb-5 mt-1 text-muted">
            Podaj dane konta nadanego przez administratora.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Field
                  label="Adres e-mail"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  aria-label="Adres e-mail"
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <div className="relative">
                  <Field
                    label="Hasło"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    placeholder="••••••••"
                    aria-label="Hasło"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-0 top-[27px] flex h-12 w-12 items-center justify-center text-muted"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              )}
            />

            {globalError ? (
              <p
                role="alert"
                className="mb-4 rounded-[11px] bg-[#FCEAE8] p-3 text-[13px] text-danger"
              >
                {globalError}
              </p>
            ) : null}

            <Button
              title={isSubmitting ? 'Logowanie…' : 'Zaloguj się'}
              type="submit"
              disabled={isLoading}
              accessibilityLabel="Zaloguj się"
            />
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[12px] text-subtle">lub</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <Button
            title={
              isGoogleLoading ? 'Łączenie z Google…' : 'Kontynuuj z Google'
            }
            variant="secondary"
            disabled={isLoading}
            onPress={handleGoogleLogin}
            accessibilityLabel="Zaloguj się przez Google"
            icon={isGoogleLoading ? <Spinner className="h-4 w-4" /> : undefined}
          />
        </Card>
      </div>
    </Screen>
  );
}
