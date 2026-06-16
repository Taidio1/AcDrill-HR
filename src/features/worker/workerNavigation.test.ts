import { workerNavigationTabs } from './workerNavigation';

describe('workerNavigationTabs', () => {
  test('zawiera skrocone menu pracownika z profilem', () => {
    expect(workerNavigationTabs.map((tab) => tab.label)).toEqual([
      'Pulpit',
      'Czas',
      'Zgłoszenia',
      'Profil',
    ]);
    expect(workerNavigationTabs.map((tab) => tab.href)).toEqual([
      '/worker/dashboard',
      '/worker/time',
      '/worker/issues',
      '/worker/profile',
    ]);
  });

  test('nie zawiera dokumentow ani paskow w menu glownym', () => {
    expect(workerNavigationTabs.map((tab) => tab.href)).not.toContain(
      '/worker/documents',
    );
    expect(workerNavigationTabs.map((tab) => tab.href)).not.toContain(
      '/worker/payslips',
    );
  });
});
