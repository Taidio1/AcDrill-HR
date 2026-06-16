'use client';

import type { ReactNode } from 'react';
import {
  CalendarDays,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  TriangleAlert,
  Users,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { UserAvatar } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/appStore';

const tabs = [
  { label: 'Pulpit', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Pracownicy', href: '/admin/employees', icon: Users },
  { label: 'Urlopy', href: '/admin/leaves', icon: CalendarDays },
  { label: 'Zgłoszenia', href: '/admin/issues', icon: TriangleAlert },
];

const navItems = [
  { label: 'Pulpit', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Pracownicy', href: '/admin/employees', icon: Users },
  { label: 'Godziny pracy', href: '/admin/hours', icon: Clock },
  { label: 'Urlopy', href: '/admin/leaves', icon: CalendarDays },
  { label: 'Dokumenty', href: '/admin/documents', icon: FileText },
  { label: 'Paski i zaliczki', href: '/admin/payroll', icon: WalletCards },
  { label: 'Zgłoszenia', href: '/admin/issues', icon: TriangleAlert },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col bg-navy lg:flex">
        <div className="flex items-center gap-3 px-5 pb-6 pt-6">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[13px] bg-orange shadow-[0_6px_16px_-6px_rgba(255,106,26,0.6)]">
            <span className="font-display text-[17px] font-extrabold text-white">
              AC
            </span>
          </div>
          <div>
            <p className="font-display text-[15px] font-extrabold leading-tight text-white">
              DRILL
            </p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#7E8BA0]">
              PANEL HR
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-semibold transition ${
                  active
                    ? 'bg-[#212C3C] text-white'
                    : 'text-[#9AA8BC] hover:bg-[#212C3C]/60 hover:text-white'
                }`}
              >
                <Icon size={19} className={active ? 'text-orange' : undefined} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#212C3C] px-3 py-4">
          <div className="flex items-center gap-3 px-2 py-2">
            {user ? (
              <UserAvatar initials={user.initials} tone="#FF6A1A" size="sm" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-[11px] text-[#7E8BA0]">Właściciel</p>
            </div>
            <button
              aria-label="Wyloguj"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#212C3C] text-[#9AA8BC] transition hover:text-white"
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="pb-20 lg:pb-0 lg:pl-[250px]">{children}</div>

      <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white lg:hidden">
        <div className="mx-auto flex h-[72px] max-w-xl items-center justify-around">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-w-16 flex-col items-center gap-1 text-[10px] font-semibold ${
                  active ? 'text-orange' : 'text-muted'
                }`}
              >
                <Icon size={22} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
