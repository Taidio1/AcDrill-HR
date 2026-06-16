const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const TIMEOUT_MS = 5_000;

interface NominatimAddress {
  road?: string;
  house_number?: string;
  pedestrian?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
  display_name?: string;
}

function formatAddress(data: NominatimResponse): string | undefined {
  const a = data.address;
  if (a) {
    const streetName = a.road ?? a.pedestrian ?? a.suburb ?? a.neighbourhood;
    const street =
      streetName && a.house_number ? `${streetName} ${a.house_number}` : streetName;
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county;
    const parts = [street, city].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  const fallback = data.display_name?.split(',').slice(0, 2).join(',').trim();
  return fallback || undefined;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url =
      `${NOMINATIM_URL}?format=jsonv2&lat=${latitude}&lon=${longitude}` +
      `&zoom=18&accept-language=pl`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return undefined;
    const data = (await response.json()) as NominatimResponse;
    return formatAddress(data);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
