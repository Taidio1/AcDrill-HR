import {
  createEmployeeSchema,
  getEmployeeInitials,
} from '@/src/features/employees/employeeSchema';

describe('employee creation schema', () => {
  test('normalizuje email i waliduje dane nowego pracownika', () => {
    const parsed = createEmployeeSchema.parse({
      email: '  Jan.Kowalski@GMAIL.COM  ',
      fullName: '  Jan Kowalski  ',
      jobTitle: '  Operator wiertnicy  ',
      temporaryPassword: 'TempPass123!',
    });

    expect(parsed).toEqual({
      email: 'jan.kowalski@gmail.com',
      fullName: 'Jan Kowalski',
      jobTitle: 'Operator wiertnicy',
      temporaryPassword: 'TempPass123!',
    });
  });

  test('wymaga hasla tymczasowego o sensownej dlugosci', () => {
    const result = createEmployeeSchema.safeParse({
      email: 'worker@example.com',
      fullName: 'Jan Kowalski',
      jobTitle: 'Operator',
      temporaryPassword: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['temporaryPassword']);
    }
  });

  test('wylicza inicjaly z imienia i nazwiska', () => {
    expect(getEmployeeInitials('Łukasz Żuk')).toBe('ŁŻ');
    expect(getEmployeeInitials('  Anna Maria Nowak  ')).toBe('AM');
    expect(getEmployeeInitials('')).toBe('P');
  });
});
