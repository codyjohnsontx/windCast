import type { ObservationStation } from "./types";

const EARTH_RADIUS_MILES = 3958.8;

export function distanceMiles(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function stationsWithinRadius(
  stations: ObservationStation[],
  latitude: number,
  longitude: number,
  radiusMiles: number
): ObservationStation[] {
  return stations
    .map((station) => ({
      ...station,
      distanceMiles: distanceMiles(latitude, longitude, station.latitude, station.longitude),
    }))
    .filter((station) => (station.distanceMiles ?? Infinity) <= radiusMiles)
    .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
