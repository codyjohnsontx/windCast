import type { ForecastHour } from "../../types";
import { compassToDegrees } from "../../utils/windDirection";
import type { ForecastConfidence, StationObservation } from "./types";

const FRESH_OBSERVATION_MS = 2 * 60 * 60 * 1000;

export function isObservationFresh(observedAt: string, now = new Date()): boolean {
  const observedTime = new Date(observedAt).getTime();
  if (!Number.isFinite(observedTime)) return false;
  return now.getTime() - observedTime <= FRESH_OBSERVATION_MS;
}

export function calculateForecastConfidence(
  forecast: ForecastHour | undefined,
  observation: StationObservation | null,
  now = new Date()
): ForecastConfidence {
  if (!forecast || !observation) {
    return { label: "unknown", reasons: ["No recent station observation available"] };
  }

  if (!isObservationFresh(observation.observedAt, now)) {
    return {
      label: "unknown",
      observedAt: observation.observedAt,
      reasons: ["Nearest observation is stale"],
    };
  }

  if (
    observation.windSpeedMph === undefined ||
    observation.windDirection === undefined
  ) {
    return {
      label: "unknown",
      observedAt: observation.observedAt,
      reasons: ["Observation is missing wind speed or direction"],
    };
  }

  const windSpeedDeltaMph = Math.abs(forecast.windSpeedMph - observation.windSpeedMph);
  const windDirectionDeltaDegrees = directionDeltaDegrees(
    forecast.windDirection,
    observation.windDirection
  );

  if (windSpeedDeltaMph <= 4 && windDirectionDeltaDegrees <= 30) {
    return {
      label: "high",
      observedAt: observation.observedAt,
      windSpeedDeltaMph,
      windDirectionDeltaDegrees,
      reasons: ["Forecast matches nearby observation"],
    };
  }

  if (windSpeedDeltaMph <= 8 && windDirectionDeltaDegrees <= 45) {
    return {
      label: "medium",
      observedAt: observation.observedAt,
      windSpeedDeltaMph,
      windDirectionDeltaDegrees,
      reasons: ["Forecast is close to nearby observation"],
    };
  }

  return {
    label: "low",
    observedAt: observation.observedAt,
    windSpeedDeltaMph,
    windDirectionDeltaDegrees,
    reasons: ["Forecast and nearby observation disagree"],
  };
}

function directionDeltaDegrees(a: string, b: string): number {
  const diff = Math.abs(compassToDegrees(a) - compassToDegrees(b));
  return Math.min(diff, 360 - diff);
}
