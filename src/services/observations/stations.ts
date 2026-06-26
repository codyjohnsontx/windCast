import type { ObservationStation } from "./types";
import { LEGACY_STATION_ALIASES } from "./noaaStations";

export function preferTrustedStation(
  stations: ObservationStation[],
  trustedStationIds: string[] | undefined
): ObservationStation | undefined {
  if (trustedStationIds?.length) {
    const trustedIds = trustedStationIds.flatMap((id) => [id, resolveStationAlias(id)]);
    const trusted = stations.find((station) => trustedIds.includes(station.id));
    if (trusted) return trusted;
  }
  return stations[0];
}

export function resolveStationAlias(id: string): string {
  return LEGACY_STATION_ALIASES[id] ?? id;
}
