import type { User } from '@/src/types/entities';

export interface WorkerProfileSummary {
  name: string;
  initials: string;
  jobTitle: string;
  roleLabel: 'worker';
}

export interface WorkerProfileActions {
  primaryLinks: {
    label: string;
    description: string;
    href: string;
  }[];
  footerAction: {
    label: string;
    destination: string;
  };
}

export function getWorkerProfileSummary(user: User): WorkerProfileSummary {
  return {
    name: user.name,
    initials: user.initials,
    jobTitle: user.jobTitle,
    roleLabel: 'worker',
  };
}

export function getWorkerProfileActions(): WorkerProfileActions {
  return {
    primaryLinks: [
      {
        label: 'Dokumenty',
        description: 'Umowy, zaświadczenia i pliki firmowe',
        href: '/worker/documents',
      },
      {
        label: 'Paski wypłat',
        description: 'Historia wynagrodzeń i szczegóły wypłat',
        href: '/worker/payslips',
      },
    ],
    footerAction: {
      label: 'Wyloguj',
      destination: '/login',
    },
  };
}
