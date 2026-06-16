import { loginSchema } from './loginSchema';

describe('loginSchema – walidacja formularza logowania', () => {
  test('akceptuje poprawny e-mail i hasło', () => {
    const result = loginSchema.safeParse({
      email: 'pracownik@acdrill.pl',
      password: 'haslo123',
    });
    expect(result.success).toBe(true);
  });

  test('odrzuca pusty e-mail', () => {
    const result = loginSchema.safeParse({ email: '', password: 'haslo123' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Adres e-mail jest wymagany.');
  });

  test('odrzuca nieprawidłowy format e-mail', () => {
    const result = loginSchema.safeParse({
      email: 'niepoprawnyadres',
      password: 'haslo123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Nieprawidłowy adres e-mail.');
  });

  test('odrzuca puste hasło', () => {
    const result = loginSchema.safeParse({
      email: 'pracownik@acdrill.pl',
      password: '',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Hasło jest wymagane.');
  });

  test('odrzuca hasło krótsze niż 6 znaków', () => {
    const result = loginSchema.safeParse({
      email: 'pracownik@acdrill.pl',
      password: 'abc',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Hasło musi mieć co najmniej 6 znaków.',
    );
  });

  test('odrzuca brak obu pól naraz', () => {
    const result = loginSchema.safeParse({ email: '', password: '' });
    expect(result.success).toBe(false);
    // Oba pola zgłaszają błędy
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(2);
  });
});
