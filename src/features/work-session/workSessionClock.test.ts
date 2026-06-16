import { elapsedSeconds } from './workSessionClock';

test('calculates elapsed time from timestamps instead of tick count', () => {
  expect(
    elapsedSeconds(
      '2026-06-15T07:00:00.000Z',
      new Date('2026-06-15T10:42:11.000Z'),
    ),
  ).toBe(13331);
});
