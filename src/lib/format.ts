import type { LocationPoint } from '@/src/types/entities';

export function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 3600)}h ${String(Math.floor((safe % 3600) / 60)).padStart(2, '0')}m`;
}

export function formatMoney(value: number) {
  const sign = value < 0 ? '−' : '';
  const [integer, fraction] = Math.abs(value).toFixed(2).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return `${sign}${grouped},${fraction}\u00A0zł`;
}

export function sessionSeconds(startedAt: string, endedAt?: string) {
  return Math.max(
    0,
    Math.floor(
      (new Date(endedAt ?? Date.now()).getTime() -
        new Date(startedAt).getTime()) /
        1000,
    ),
  );
}

export function formatClock(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMonthLabel(monthKey: string) {
  const label = new Date(`${monthKey}-01T12:00:00`).toLocaleDateString('pl-PL', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatLocationText(point?: LocationPoint): string {
  if (!point) return 'Brak';
  if (point.address) return point.address;
  return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
}

export function locationMapUrl(point?: LocationPoint): string | undefined {
  if (!point) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
}
