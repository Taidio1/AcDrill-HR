'use client';

import type { ReactNode } from 'react';
import { Bell, LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { UserAvatar } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/appStore';

export function AdminScreen({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  return (
    <main className="min-h-screen bg-navy lg:bg-canvas">
      <header className="flex items-center justify-between px-4 pb-4 pt-5 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[12px] bg-navy shadow-[0_6px_16px_-6px_rgba(24,33,46,0.55)]">
            <span className="font-display text-[16px] font-extrabold text-white">
              AC
            </span>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-orange" />
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7E8BA0]">
              AC-DRILL · ADMIN
            </p>
            <h1 className="font-display text-[20px] font-extrabold leading-tight text-white">
              {title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <UserAvatar initials={user.initials} tone="#2C3A4D" size="sm" />
          ) : null}
          <button
            aria-label="Powiadomienia"
            className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#212C3C] text-[#9AA8BC]"
          >
            <Bell size={19} />
          </button>
          <button
            aria-label="Wyloguj"
            className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#212C3C] text-[#9AA8BC]"
            onClick={async () => {
              await logout();
              router.replace('/login');
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <div className="hidden h-[66px] items-center justify-between border-b border-lineSoft bg-white px-8 lg:flex">
        <div className="relative w-full max-w-sm">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            type="search"
            placeholder="Szukaj pracownika, zgłoszenia…"
            className="h-10 w-full rounded-[11px] border border-line bg-canvas pl-10 pr-4 text-[14px] text-strong outline-none transition focus:ring-2 focus:ring-orange/20"
          />
        </div>
        <div className="ml-6 flex shrink-0 items-center gap-5">
          <button
            aria-label="Powiadomienia"
            className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-canvas text-muted"
          >
            <Bell size={19} />
          </button>
          <div className="flex items-center gap-3">
            {user ? (
              <UserAvatar initials={user.initials} tone="#FF6A1A" size="sm" />
            ) : null}
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-ink">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-[11px] text-subtle">AC-Drill Sp. z o.o.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-[calc(100vh-80px)] rounded-t-[22px] bg-canvas px-4 py-5 pb-24 lg:min-h-[calc(100vh-66px)] lg:rounded-none lg:px-8 lg:pb-8">
        <h1 className="mb-5 hidden font-display text-[28px] font-extrabold text-ink lg:block">
          {title}
        </h1>
        {children}
      </div>
    </main>
  );
}
