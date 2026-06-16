import {
  formatDuration,
  formatLocationText,
  formatMoney,
  formatTimer,
  locationMapUrl,
} from './format';
import type { LocationPoint } from '@/src/types/entities';

describe('format helpers', () => {
  test('formats timer as HH:mm:ss', () => {
    expect(formatTimer(13331)).toBe('03:42:11');
  });

  test('formats duration as hours and minutes', () => {
    expect(formatDuration(36900)).toBe('10h 15m');
  });

  test('formats Polish currency', () => {
    expect(formatMoney(6380)).toContain('6 380');
  });
});

const baseLocation: LocationPoint = {
  latitude: 52.54601,
  longitude: 19.70655,
  recordedAt: '2026-06-17T06:00:00.000Z',
};

describe('formatLocationText', () => {
  it('zwraca adres gdy jest dostępny', () => {
    expect(
      formatLocationText({ ...baseLocation, address: 'ul. Wiertnicza 12, Płock' }),
    ).toBe('ul. Wiertnicza 12, Płock');
  });

  it('zwraca zaokrąglone współrzędne gdy brak adresu', () => {
    expect(formatLocationText(baseLocation)).toBe('52.5460, 19.7066');
  });

  it('zwraca "Brak" gdy brak punktu', () => {
    expect(formatLocationText(undefined)).toBe('Brak');
  });
});

describe('locationMapUrl', () => {
  it('buduje URL Google Maps z lat/lng', () => {
    expect(locationMapUrl(baseLocation)).toBe(
      'https://www.google.com/maps/search/?api=1&query=52.54601,19.70655',
    );
  });

  it('zwraca undefined gdy brak punktu', () => {
    expect(locationMapUrl(undefined)).toBeUndefined();
  });
});
