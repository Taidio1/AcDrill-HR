import { reverseGeocode } from '@/src/lib/geocoding';

describe('reverseGeocode', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('składa krótki adres z ulicy, numeru i miasta', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          road: 'ul. Wiertnicza',
          house_number: '12',
          city: 'Płock',
        },
        display_name: 'ul. Wiertnicza 12, Płock, Polska',
      }),
    }) as unknown as typeof fetch;

    await expect(reverseGeocode(52.546, 19.706)).resolves.toBe(
      'ul. Wiertnicza 12, Płock',
    );
  });

  it('używa town/village gdy brak city', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: { road: 'Kolejowa', village: 'Grodzisk' },
      }),
    }) as unknown as typeof fetch;

    await expect(reverseGeocode(1, 2)).resolves.toBe('Kolejowa, Grodzisk');
  });

  it('zwraca undefined gdy odpowiedź nie jest ok', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch;

    await expect(reverseGeocode(1, 2)).resolves.toBeUndefined();
  });

  it('zwraca undefined gdy fetch rzuca (np. brak sieci / timeout)', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network')) as unknown as typeof fetch;

    await expect(reverseGeocode(1, 2)).resolves.toBeUndefined();
  });
});
