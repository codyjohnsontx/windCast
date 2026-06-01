import "leaflet";
import type { WindGridDataset } from "../services/wind-grid/types";

declare module "leaflet" {
  interface VelocityLayerOptions {
    data: WindGridDataset;
    minVelocity?: number;
    maxVelocity?: number;
    velocityScale?: number;
    particleAge?: number;
    particleMultiplier?: number;
    lineWidth?: number;
    frameRate?: number;
    colorScale?: string[];
    displayValues?: boolean;
    displayOptions?: {
      velocityType?: string;
      position?: string;
      emptyString?: string;
      angleConvention?: string;
      displayPosition?: string;
      displayEmptyString?: string;
      speedUnit?: string;
    };
    onAdd?: () => void;
    onRemove?: () => void;
  }

  function velocityLayer(options: VelocityLayerOptions): Layer;
}

declare module "leaflet-velocity";
