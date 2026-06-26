import type { ObservationProviderId, ObservationStation } from "./types";

const NDBC_REALTIME_BASE_URL = "https://www.ndbc.noaa.gov/data/realtime2";
const NDBC_STATION_BASE_URL = "https://www.ndbc.noaa.gov/station_page.php";
const COOPS_DATA_BASE_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const COOPS_STATION_BASE_URL = "https://tidesandcurrents.noaa.gov/stationhome.html";

export function providerStationId(stationOrId: ObservationStation | string): string {
  const id = typeof stationOrId === "string" ? stationOrId : stationOrId.id;
  return id.includes(":") ? id.split(":").slice(1).join(":") : id;
}

export function ndbcRealtimeUrl(stationId: string): string {
  return `${NDBC_REALTIME_BASE_URL}/${providerStationId(stationId).toUpperCase()}.txt`;
}

export function ndbcStationPageUrl(stationId: string): string {
  return `${NDBC_STATION_BASE_URL}?station=${encodeURIComponent(providerStationId(stationId).toUpperCase())}`;
}

export function coopsLatestWaterLevelUrl(stationId: string): string {
  const params = new URLSearchParams({
    product: "water_level",
    date: "latest",
    datum: "MLLW",
    station: providerStationId(stationId),
    time_zone: "gmt",
    units: "english",
    format: "json",
    application: "windcast",
  });
  return `${COOPS_DATA_BASE_URL}?${params}`;
}

export function coopsRecentWaterLevelUrl(stationId: string): string {
  const params = new URLSearchParams({
    product: "water_level",
    range: "3",
    datum: "MLLW",
    station: providerStationId(stationId),
    time_zone: "gmt",
    units: "english",
    format: "json",
    application: "windcast",
  });
  return `${COOPS_DATA_BASE_URL}?${params}`;
}

export function coopsStationPageUrl(stationId: string): string {
  return `${COOPS_STATION_BASE_URL}?id=${encodeURIComponent(providerStationId(stationId))}`;
}

export function rawObservationUrl(provider: ObservationProviderId, stationId: string): string | undefined {
  if (provider === "ndbc") return ndbcRealtimeUrl(stationId);
  if (provider === "coops") return coopsLatestWaterLevelUrl(stationId);
  return undefined;
}

export function stationPageUrl(provider: ObservationProviderId, stationId: string): string | undefined {
  if (provider === "ndbc") return ndbcStationPageUrl(stationId);
  if (provider === "coops") return coopsStationPageUrl(stationId);
  return undefined;
}
