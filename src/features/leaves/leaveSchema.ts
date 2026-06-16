import { z } from 'zod';

export const leaveSchema = z
  .object({
    type: z.enum(['vacation', 'on_demand', 'unpaid', 'care']),
    dateFrom: z.iso.date('Podaj datę w formacie RRRR-MM-DD'),
    dateTo: z.iso.date('Podaj datę w formacie RRRR-MM-DD'),
    comment: z.string().max(500),
  })
  .superRefine((value, ctx) => {
    if (value.dateTo < value.dateFrom) {
      ctx.addIssue({
        code: 'custom',
        path: ['dateTo'],
        message: 'Data końcowa nie może być wcześniejsza.',
      });
    }
    if (value.type === 'unpaid' && value.comment.trim().length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['comment'],
        message: 'Dodaj komentarz do urlopu bezpłatnego.',
      });
    }
  });

export type LeaveFormValues = z.infer<typeof leaveSchema>;
