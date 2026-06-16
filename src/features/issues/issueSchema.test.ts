import { issueSchema } from './issueSchema';

describe('issue schema', () => {
  test('requires a priority for a breakdown', () => {
    const result = issueSchema.safeParse({
      type: 'breakdown',
      description: 'Spadek ciśnienia płuczki',
      priority: undefined,
    });
    expect(result.success).toBe(false);
  });

  test('requires a useful description', () => {
    const result = issueSchema.safeParse({
      type: 'materials',
      description: 'Rury',
      priority: 'medium',
    });
    expect(result.success).toBe(false);
  });
});
