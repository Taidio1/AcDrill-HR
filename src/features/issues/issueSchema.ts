import { z } from 'zod';

export const issueSchema = z
  .object({
    type: z.enum(['breakdown', 'materials']),
    description: z
      .string()
      .trim()
      .min(10, 'Opis musi mieć co najmniej 10 znaków.')
      .max(1000),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'breakdown' && !value.priority) {
      ctx.addIssue({
        code: 'custom',
        path: ['priority'],
        message: 'Wybierz priorytet awarii.',
      });
    }
  });

export type IssueFormValues = z.infer<typeof issueSchema>;
