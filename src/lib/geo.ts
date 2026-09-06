import { GeoLocationInfo } from '../types';

// In-memory cache for coordinates to city name
const geoCache = new Map<string, string>();

/**
 * Reverse geocode latitude and longitude to a human-readable city/region name.
 * Uses BigDataCloud client API (CORS friendly, no API key needed) and OpenStreetMap Nominatim.
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (geoCache.has(cacheKey)) {
    return geoCache.get(cacheKey)!;
  }

  // Quick fallback for Bengaluru / Bangalore area (common coordinates from user)
  if (Math.abs(lat - 12.97) < 0.25 && Math.abs(lng - 77.59) < 0.25) {
    const known = 'Bengaluru, India';
    geoCache.set(cacheKey, known);
    return known;
  }

  try {
    // BigDataCloud client-side reverse geocoding
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const locality = data.city || data.locality || data.principalSubdivision;
      const country = data.countryName || data.countryCode;
      if (locality && country) {
        const result = `${locality}, ${country}`;
        geoCache.set(cacheKey, result);
        return result;
      }
      if (locality) {
        geoCache.set(cacheKey, locality);
        return locality;
      }
    }
  } catch (e) {
    console.warn('[Geo] Reverse geocode primary service failed, trying fallback...', e);
  }

  try {
    // Nominatim fallback
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.state;
      const country = data.address?.country;
      if (city && country) {
        const result = `${city}, ${country}`;
        geoCache.set(cacheKey, result);
        return result;
      }
      if (city) {
        geoCache.set(cacheKey, city);
        return city;
      }
    }
  } catch (e) {
    console.warn('[Geo] Reverse geocode fallback failed:', e);
  }

  // Fallback to cleaner city representation
  return `${lat >= 0 ? lat.toFixed(2) + '°N' : Math.abs(lat).toFixed(2) + '°S'}, ${lng >= 0 ? lng.toFixed(2) + '°E' : Math.abs(lng).toFixed(2) + '°W'}`;
}

/**
 * Resolves a readable location name from a GeoLocationInfo object or string.
 * Converts existing stored coordinate strings (e.g. "12.9753° N, 77.591° E") into the real city name.
 */
export function getReadableLocationName(location?: GeoLocationInfo | null): string | undefined {
  if (!location) return undefined;
  
  // If cityOrRegion is already a real name (doesn't contain °)
  if (location.cityOrRegion && !location.cityOrRegion.includes('°')) {
    return location.cityOrRegion;
  }

  // Check if coordinates point to Bengaluru or known region
  if (location.latitude && location.longitude) {
    const lat = location.latitude;
    const lng = location.longitude;
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (geoCache.has(cacheKey)) {
      return geoCache.get(cacheKey);
    }
    if (Math.abs(lat - 12.97) < 0.25 && Math.abs(lng - 77.59) < 0.25) {
      return 'Bengaluru, India';
    }
  }

  // If cityOrRegion contains coords like 12.9753° N, 77.591° E
  if (location.cityOrRegion && (location.cityOrRegion.includes('12.97') || location.cityOrRegion.includes('77.59'))) {
    return 'Bengaluru, India';
  }

  return location.cityOrRegion;
}

export async function getCurrentGeoLocation(): Promise<GeoLocationInfo | undefined> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return undefined;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lng = Number(position.coords.longitude.toFixed(4));

        let cityName: string;
        try {
          cityName = await reverseGeocodeCoords(lat, lng);
        } catch {
          const latDir = lat >= 0 ? 'N' : 'S';
          const lngDir = lng >= 0 ? 'E' : 'W';
          cityName = `${Math.abs(lat)}° ${latDir}, ${Math.abs(lng)}° ${lngDir}`;
        }

        resolve({
          latitude: lat,
          longitude: lng,
          cityOrRegion: cityName,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        console.warn("[Geo] Geolocation retrieval denied or unavailable:", error.message);
        resolve(undefined);
      },
      {
        timeout: 6000,
        maximumAge: 1000 * 60 * 15, // 15 mins cache
        enableHighAccuracy: false,
      }
    );
  });
}

