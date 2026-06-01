import { MockWindGridProvider } from "./MockWindGridProvider";
import { NoaaGfsWindGridProvider } from "./NoaaGfsWindGridProvider";
import type { WindGridProvider } from "./types";

export { WindGridError } from "./types";
export type {
  WindGrid,
  WindGridDataset,
  WindGridHeader,
  WindGridProvider,
} from "./types";

let cached: WindGridProvider | null = null;

export function getWindGridProvider(): WindGridProvider {
  if (cached) return cached;
  const id = (import.meta.env.VITE_WIND_GRID_PROVIDER ?? "mock").toLowerCase();
  switch (id) {
    case "noaa-gfs":
      cached = new NoaaGfsWindGridProvider();
      break;
    case "mock":
    default:
      cached = new MockWindGridProvider();
      break;
  }
  return cached;
}
