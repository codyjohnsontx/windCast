import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import { getWindGridProvider } from "../../services/wind-grid";
import type { WindGridDataset } from "../../services/wind-grid/types";

export default function VelocityLayer() {
  const map = useMap();
  const [data, setData] = useState<WindGridDataset | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWindGridProvider()
      .getWindGrid()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        console.warn("WindGrid load failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data) return;

    const layer = L.velocityLayer({
      data,
      minVelocity: 0,
      maxVelocity: 22,
      velocityScale: 0.015,
      particleAge: 60,
      particleMultiplier: 1 / 200,
      lineWidth: 1.4,
      frameRate: 24,
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
        emptyString: "No wind data",
        angleConvention: "bearingCW",
        displayPosition: "bottomleft",
        displayEmptyString: "No wind data",
        speedUnit: "m/s",
      },
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [data, map]);

  return null;
}
