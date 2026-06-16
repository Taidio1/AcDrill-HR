import { z } from 'zod';

export const createEmployeeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Podaj poprawny adres e-mail.'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Podaj imie i nazwisko.')
    .max(160, 'Imie i nazwisko jest za dlugie.'),
  jobTitle: z
    .string()
    .trim()
    .min(2, 'Podaj stanowisko.')
    .max(120, 'Stanowisko jest za dlugie.'),
  temporaryPassword: z
    .string()
    .min(8, 'Haslo tymczasowe musi miec co najmniej 8 znakow.')
    .max(128, 'Haslo tymczasowe jest za dlugie.'),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

export function getEmployeeInitials(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('pl'))
    .join('');

  return initials || 'P';
}
