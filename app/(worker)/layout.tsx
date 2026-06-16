'use client';

import type { ReactNode } from 'react';
import { Clock, Home, TriangleAlert, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  workerNavigationTabs,
  type WorkerNavigationIcon,
} from '@/src/features/worker/workerNavigation';
import { useSyncQueue } from '@/src/hooks/useSyncQueue';

const icons: Record<WorkerNavigationIcon, typeof Home> = {
  home: Home,
  clock: Clock,
  issues: TriangleAlert,
  profile: UserRound,
};

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useSyncQueue();

  return (
    <>
      <div className="pb-24">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white">
        <div className="mx-auto flex h-[64px] max-w-xl items-center justify-around px-1">
          {workerNavigationTabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const Icon = icons[tab.icon];
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-w-[60px] flex-col items-center gap-[5px] text-[10.5px] font-semibold transition-colors ${
                  active ? 'text-orange' : 'text-[#98A2B0]'
                }`}
              >
                <Icon size={23} />
                {tab.label}
              </Link>
            );
          })}
        </div>
        {/* iOS-style home indicator */}
        <div className="safe-area-bottom flex justify-center bg-white pb-2">
          <div className="h-[5px] w-32 rounded-full bg-[#1B2533] opacity-85" />
        </div>
      </nav>
    </>
  );
}
