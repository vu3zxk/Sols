import { GeoLocationInfo } from '../types';

export async function getCurrentGeoLocation(): Promise<GeoLocationInfo | undefined> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return undefined;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lng = Number(position.coords.longitude.toFixed(4));
        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        const formatted = `${Math.abs(lat)}° ${latDir}, ${Math.abs(lng)}° ${lngDir}`;

        resolve({
          latitude: lat,
          longitude: lng,
          cityOrRegion: formatted,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        console.warn("[Geo] Geolocation retrieval denied or unavailable:", error.message);
        resolve(undefined);
      },
      {
        timeout: 5000,
        maximumAge: 1000 * 60 * 15, // 15 mins cache
        enableHighAccuracy: false,
      }
    );
  });
}
