import { leaveSchema } from './leaveSchema';

describe('leave schema', () => {
  test('rejects end date before start date', () => {
    const result = leaveSchema.safeParse({
      type: 'vacation',
      dateFrom: '2026-07-18',
      dateTo: '2026-07-14',
      comment: '',
    });
    expect(result.success).toBe(false);
  });

  test('requires a comment for unpaid leave', () => {
    const result = leaveSchema.safeParse({
      type: 'unpaid',
      dateFrom: '2026-07-14',
      dateTo: '2026-07-14',
      comment: '',
    });
    expect(result.success).toBe(false);
  });
});
