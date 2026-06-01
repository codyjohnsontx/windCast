export { degreesToCompass } from "../../utils/windDirection";

export function mpsToMph(mps: number): number {
  return mps * 2.2369362921;
}

export function msToKnots(mps: number): number {
  return mps * 1.9438444924;
}

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function celsiusToFahrenheit(c: number): number {
  return c * (9 / 5) + 32;
}

export function metersToFeet(m: number): number {
  return m * 3.2808398950;
}

export function iso8601(date: Date | string): string {
  return typeof date === "string" ? new Date(date).toISOString() : date.toISOString();
}
