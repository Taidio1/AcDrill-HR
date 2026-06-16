import { reverseGeocode } from '@/src/lib/geocoding';
import type { LocationPoint } from '@/src/types/entities';

export function getCurrentLocation(): Promise<LocationPoint | undefined> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point: LocationPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          recordedAt: new Date(position.timestamp).toISOString(),
        };
        const address = await reverseGeocode(point.latitude, point.longitude);
        if (address) point.address = address;
        resolve(point);
      },
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  });
}
