import { getWorkerProfileActions, getWorkerProfileSummary } from './profileSummary';

describe('getWorkerProfileSummary', () => {
  test('zwraca podstawowe dane profilu pracownika', () => {
    const summary = getWorkerProfileSummary({
      id: 'worker-1',
      name: 'Jan Kowalski',
      initials: 'JK',
      jobTitle: 'Operator wiertnicy',
      role: 'worker',
    });

    expect(summary).toEqual({
      name: 'Jan Kowalski',
      initials: 'JK',
      jobTitle: 'Operator wiertnicy',
      roleLabel: 'worker',
    });
  });
});

describe('getWorkerProfileActions', () => {
  test('zwraca dokumenty i paski jako glowne karty profilu', () => {
    expect(getWorkerProfileActions().primaryLinks).toEqual([
      expect.objectContaining({
        label: 'Dokumenty',
        href: '/worker/documents',
      }),
      expect.objectContaining({
        label: 'Paski wypłat',
        href: '/worker/payslips',
      }),
    ]);
  });

  test('zwraca wylogowanie jako akcje na dole profilu', () => {
    expect(getWorkerProfileActions().footerAction).toEqual({
      label: 'Wyloguj',
      destination: '/login',
    });
  });
});
