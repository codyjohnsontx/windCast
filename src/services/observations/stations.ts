import type { ObservationStation } from "./types";

export function preferTrustedStation(
  stations: ObservationStation[],
  trustedStationIds: string[] | undefined
): ObservationStation | undefined {
  if (trustedStationIds?.length) {
    const trusted = stations.find((station) => trustedStationIds.includes(station.id));
    if (trusted) return trusted;
  }
  return stations[0];
}
