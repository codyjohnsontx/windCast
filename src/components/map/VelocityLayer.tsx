import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import { getWindGridProvider } from "../../services/wind-grid";
import type { WindGridDataset } from "../../services/wind-grid/types";
import type { WindParticleDensity } from "../../services/layers/types";

type Props = {
  density?: Exclude<WindParticleDensity, "off">;
  onStatusChange?: (status: "loading" | "active" | "error") => void;
};

const WIND_PARTICLE_PRESETS = {
  light: {
    velocityScale: 0.01,
    particleAge: 45,
    particleMultiplier: 1 / 650,
    lineWidth: 0.8,
    frameRate: 20,
  },
  normal: {
    velocityScale: 0.012,
    particleAge: 50,
    particleMultiplier: 1 / 400,
    lineWidth: 1,
    frameRate: 22,
  },
  dense: {
    velocityScale: 0.015,
    particleAge: 60,
    particleMultiplier: 1 / 220,
    lineWidth: 1.3,
    frameRate: 24,
  },
};

export default function VelocityLayer({ density = "light", onStatusChange }: Props) {
  const map = useMap();
  const [data, setData] = useState<WindGridDataset | null>(null);

  useEffect(() => {
    let cancelled = false;
    onStatusChange?.("loading");
    getWindGridProvider()
      .getWindGrid()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          onStatusChange?.("active");
        }
      })
      .catch((err) => {
        console.warn("WindGrid load failed:", err);
        if (!cancelled) onStatusChange?.("error");
      });
    return () => {
      cancelled = true;
    };
  }, [onStatusChange]);

  useEffect(() => {
    if (!data) return;
    const preset = WIND_PARTICLE_PRESETS[density];

    const layer = L.velocityLayer({
      data,
      minVelocity: 0,
      maxVelocity: 22,
      velocityScale: preset.velocityScale,
      particleAge: preset.particleAge,
      particleMultiplier: preset.particleMultiplier,
      lineWidth: preset.lineWidth,
      frameRate: preset.frameRate,
      colorScale: [
        "rgb(36,104,180)",
        "rgb(60,157,194)",
        "rgb(128,205,193)",
        "rgb(151,218,168)",
        "rgb(198,231,181)",
        "rgb(238,247,217)",
        "rgb(255,238,159)",
        "rgb(252,217,125)",
        "rgb(255,182,100)",
        "rgb(252,150,75)",
        "rgb(250,112,52)",
        "rgb(245,64,32)",
        "rgb(237,45,28)",
        "rgb(220,24,32)",
      ],
      displayValues: true,
      displayOptions: {
        velocityType: "Wind",
        position: "bottomleft",
        emptyString: "Hover map for wind",
        angleConvention: "bearingCW",
        displayPosition: "bottomleft",
        displayEmptyString: "Hover map for wind",
        speedUnit: "m/s",
      },
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [data, density, map]);

  return null;
}
