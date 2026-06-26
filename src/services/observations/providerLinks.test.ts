import { describe, expect, it } from "vitest";
import {
  coopsLatestWaterLevelUrl,
  coopsStationPageUrl,
  ndbcRealtimeUrl,
  ndbcStationPageUrl,
  providerStationId,
} from "./providerLinks";

describe("providerLinks", () => {
  it("builds NDBC raw and station page links", () => {
    expect(ndbcRealtimeUrl("ndbc:ptat2")).toBe("https://www.ndbc.noaa.gov/data/realtime2/PTAT2.txt");
    expect(ndbcStationPageUrl("ndbc:ptat2")).toBe(
      "https://www.ndbc.noaa.gov/station_page.php?station=PTAT2"
    );
  });

  it("builds CO-OPS latest water level and station page links", () => {
    expect(coopsLatestWaterLevelUrl("coops:8775237")).toContain(
      "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?"
    );
    expect(coopsLatestWaterLevelUrl("coops:8775237")).toContain("product=water_level");
    expect(coopsLatestWaterLevelUrl("coops:8775237")).toContain("station=8775237");
    expect(coopsStationPageUrl("coops:8775237")).toBe(
      "https://tidesandcurrents.noaa.gov/stationhome.html?id=8775237"
    );
  });

  it("extracts provider ids from internal station ids", () => {
    expect(providerStationId("ndbc:NWST2")).toBe("NWST2");
    expect(providerStationId("manual-lt")).toBe("manual-lt");
  });
});
