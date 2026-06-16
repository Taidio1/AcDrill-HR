'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

import { useToastStore } from '@/src/store/appStore';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-label="Ładowanie"
      className={`inline-block h-7 w-7 animate-spin rounded-full border-2 border-line border-t-orange ${className}`}
    />
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-6 pb-24">{children}</main>
  );
}

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const classes = `rounded-card border border-lineSoft bg-white p-4 ${className}`;
  if (onClick) {
    return (
      <button className={`${classes} w-full text-left`} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={classes}>{children}</div>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'navy' | 'success';

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  className = '',
  icon,
  accessibilityLabel,
  type = 'button',
  ...rest
}: ButtonProps) {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-orange text-white',
    secondary: 'border border-line bg-soft text-strong',
    danger: 'bg-danger text-white',
    navy: 'bg-navy text-white',
    success: 'bg-success text-white',
  };
  return (
    <button
      type={type}
      onClick={onPress}
      disabled={disabled}
      aria-label={accessibilityLabel}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-control px-4 font-sans text-[15px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {title}
    </button>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Potwierdź',
  cancelLabel = 'Anuluj',
  confirmVariant = 'danger',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-card border border-lineSoft bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-[18px] font-extrabold text-ink">
          {title}
        </h2>
        {message ? (
          <p className="mt-2 text-[14px] leading-5 text-subtle">{message}</p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button
            title={cancelLabel}
            variant="secondary"
            className="flex-1"
            onPress={onCancel}
            disabled={loading}
          />
          <Button
            title={confirmLabel}
            variant={confirmVariant}
            className="flex-1"
            onPress={onConfirm}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  multiline?: boolean;
} & InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Field({
  label,
  error,
  multiline,
  className = '',
  ...rest
}: FieldProps) {
  const controlClass = `min-h-12 w-full rounded-[11px] border bg-white px-4 py-3 text-[14px] text-strong outline-none transition focus:ring-2 focus:ring-orange/20 ${
    error ? 'border-danger' : 'border-line'
  } ${className}`;
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[12px] text-muted">{label}</span>
      {multiline ? (
        <textarea
          className={`${controlClass} min-h-32 resize-y`}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={controlClass}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error ? (
        <span className="mt-1 block text-[11px] text-danger">{error}</span>
      ) : null}
    </label>
  );
}

export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {subtitle ? (
          <p className="text-[13px] text-subtle">{subtitle}</p>
        ) : null}
        <h1 className="font-display text-[26px] font-extrabold text-ink">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

export function ScreenState({
  loading,
  error,
  empty,
}: {
  loading?: boolean | string;
  error?: boolean | string;
  empty?: boolean | string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 text-muted">
        <Spinner />
        <p className="mt-3 text-sm">
          {typeof loading === 'string' ? loading : 'Ładowanie danych…'}
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-card bg-[#FCEAE8] p-4 text-center text-sm text-danger">
        {typeof error === 'string'
          ? error
          : 'Nie udało się pobrać danych.'}
      </p>
    );
  }
  if (empty) {
    return (
      <p className="rounded-card border border-lineSoft bg-white p-4 text-center text-sm text-muted">
        {typeof empty === 'string' ? empty : 'Brak danych do wyświetlenia.'}
      </p>
    );
  }
  return null;
}

const badgeStyles = {
  working: ['bg-[#E6F4EC]', 'text-[#157F4E]', 'Pracuje', '#1FA35A'],
  leave: ['bg-[#FEF3DE]', 'text-[#B7791F]', 'Urlop', '#E0A53A'],
  off: ['bg-soft', 'text-muted', 'Wolne', '#9AA3B0'],
  new: ['bg-[#E8EEF7]', 'text-info', 'Nowe', '#2563A8'],
  in_progress: ['bg-[#FEF3DE]', 'text-[#B7791F]', 'W realizacji', '#E0A53A'],
  closed: ['bg-soft', 'text-muted', 'Zamknięte', '#9AA3B0'],
  pending: ['bg-[#FEF3DE]', 'text-[#B7791F]', 'Oczekuje', '#E0A53A'],
  approved: ['bg-[#E6F4EC]', 'text-[#157F4E]', 'Zaakceptowane', '#1FA35A'],
  rejected: ['bg-[#FCEAE8]', 'text-danger', 'Odrzucone', '#E0392B'],
  low: ['bg-soft', 'text-muted', 'Niski', '#9AA3B0'],
  medium: ['bg-[#FEF3DE]', 'text-[#B7791F]', 'Średni', '#E0A53A'],
  high: ['bg-[#FCEAE8]', 'text-danger', 'Wysoki', '#E0392B'],
} as const;

export function StatusBadge({ status }: { status: keyof typeof badgeStyles }) {
  const [background, color, label, dot] = badgeStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-round px-3 py-1.5 text-[11px] font-semibold ${background} ${color}`}
    >
      <span
        className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ background: dot }}
      />
      {label}
    </span>
  );
}

export function UserAvatar({
  initials,
  tone = '#FF6A1A',
  size = 'md',
}: {
  initials: string;
  tone?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'h-9 w-9 rounded-[10px] text-[13px]',
    md: 'h-[46px] w-[46px] rounded-[14px] text-[17px]',
    lg: 'h-16 w-16 rounded-[18px] text-xl',
  };
  return (
    <span
      className={`flex shrink-0 items-center justify-center font-display font-bold text-white ${sizes[size]}`}
      style={{ backgroundColor: tone }}
    >
      {initials}
    </span>
  );
}

export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value?: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-h-11 rounded-round border px-4 text-[13px] font-semibold ${
            value === option.value
              ? 'border-navy bg-navy text-white'
              : 'border-line bg-white text-muted'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toast() {
  const message = useToastStore((state) => state.message);
  return (
    <div
      aria-live="polite"
      className={`fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-round bg-navy px-5 py-3 text-[14px] text-white shadow-xl transition-all ${
        message
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
