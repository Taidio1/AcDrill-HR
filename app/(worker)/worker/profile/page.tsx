'use client';

import {
  CalendarDays,
  ChevronRight,
  FileText,
  LogOut,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { PushNotificationCard } from '@/src/components/PushNotificationCard';
import { Button, Card, Heading, Screen, UserAvatar } from '@/src/components/ui';
import {
  getWorkerProfileActions,
  getWorkerProfileSummary,
} from '@/src/features/worker/profileSummary';
import { useAuthStore } from '@/src/store/appStore';

const profileLinkStyles = {
  '/worker/documents': {
    icon: FileText,
    color: 'bg-[#E8EEF7] text-info',
  },
  '/worker/payslips': {
    icon: WalletCards,
    color: 'bg-[#E6F4EC] text-success',
  },
} as const;

export default function WorkerProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  const profile = getWorkerProfileSummary(user);
  const actions = getWorkerProfileActions();

  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading title="Profil" subtitle="Dane pracownika" />

        <Card className="mb-5">
          <div className="flex items-center gap-4">
            <UserAvatar initials={profile.initials} tone="#FF6A1A" size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-[22px] font-extrabold leading-tight text-ink">
                {profile.name}
              </h2>
              <p className="mt-1 text-[14px] font-semibold text-strong">
                {profile.jobTitle}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-round bg-soft px-3 py-1.5 text-[12px] font-semibold text-muted">
                <ShieldCheck size={14} />
                rola {profile.roleLabel}
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-5" onClick={() => router.push('/worker/leaves')}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#FFF1E8] text-orange">
              <CalendarDays size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">Urlopy</p>
              <p className="mt-1 text-[12px] leading-4 text-subtle">
                Saldo dni i wnioski urlopowe
              </p>
            </div>
            <ChevronRight size={19} className="shrink-0 text-subtle" />
          </div>
        </Card>

        <PushNotificationCard className="mb-5" />

        <p className="mb-2 font-mono text-[11px] tracking-[1px] text-subtle">
          TWOJE PLIKI
        </p>
        <div className="space-y-2.5">
          {actions.primaryLinks.map((item) => {
            const style =
              profileLinkStyles[item.href as keyof typeof profileLinkStyles];
            const Icon = style.icon;
            return (
              <Card key={item.href} onClick={() => router.push(item.href)}>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] ${style.color}`}
                  >
                    <Icon size={21} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{item.label}</p>
                    <p className="mt-1 text-[12px] leading-4 text-subtle">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight size={19} className="shrink-0 text-subtle" />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 border-t border-lineSoft pt-4">
          <Button
            title={actions.footerAction.label}
            variant="secondary"
            icon={<LogOut size={18} />}
            onPress={async () => {
              await logout();
              router.replace(actions.footerAction.destination);
            }}
          />
        </div>
      </div>
    </Screen>
  );
}
