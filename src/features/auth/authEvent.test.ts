import { deferAuthEvent } from './authEvent';

describe('deferAuthEvent', () => {
  test('uruchamia obsluge dopiero po zakonczeniu callbacku auth', async () => {
    jest.useFakeTimers();
    const handler = jest.fn().mockResolvedValue(undefined);

    deferAuthEvent(handler);

    expect(handler).not.toHaveBeenCalled();

    await jest.runAllTimersAsync();

    expect(handler).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
