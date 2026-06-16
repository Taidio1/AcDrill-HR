export type WorkerNavigationIcon = 'home' | 'clock' | 'issues' | 'profile';

export const workerNavigationTabs: {
  label: string;
  href: string;
  icon: WorkerNavigationIcon;
}[] = [
  { label: 'Pulpit', href: '/worker/dashboard', icon: 'home' },
  { label: 'Czas', href: '/worker/time', icon: 'clock' },
  { label: 'Zgłoszenia', href: '/worker/issues', icon: 'issues' },
  { label: 'Profil', href: '/worker/profile', icon: 'profile' },
];
