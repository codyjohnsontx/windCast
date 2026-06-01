import type { ForecastHour, SessionScore, SessionScoreLabel, Spot } from "../types";
import { isIdealDirection, isUnsafeDirection } from "./windDirection";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function labelForScore(score: number): SessionScoreLabel {
  if (score >= 85) return "fire";
  if (score >= 65) return "good";
  if (score >= 40) return "maybe";
  return "poor";
}

export function scoreHour(forecast: ForecastHour, spot: Spot): SessionScore {
  const reasons: string[] = [];

  if (isUnsafeDirection(forecast.windDirection, spot.unsafeWindDirections)) {
    return {
      label: "sketchy",
      score: 0,
      reasons: [`Wind direction ${forecast.windDirection} is unsafe here`],
    };
  }
  if (forecast.windSpeedMph > spot.maxWindMph) {
    return {
      label: "sketchy",
      score: 0,
      reasons: [`Wind ${forecast.windSpeedMph} mph is over max (${spot.maxWindMph})`],
    };
  }
  if (forecast.windGustMph > spot.maxWindMph + 5) {
    return {
      label: "sketchy",
      score: 0,
      reasons: [`Gusts ${forecast.windGustMph} mph well over max (${spot.maxWindMph})`],
    };
  }

  if (forecast.windSpeedMph < spot.minWindMph - 2) {
    return {
      label: "poor",
      score: 10,
      reasons: [`Wind ${forecast.windSpeedMph} mph is under minimum (${spot.minWindMph})`],
    };
  }

  let score = 50;
  const [idealLow, idealHigh] = spot.idealWindMph;

  if (forecast.windSpeedMph >= idealLow && forecast.windSpeedMph <= idealHigh) {
    score += 30;
    reasons.push("Wind in ideal range");
  } else if (forecast.windSpeedMph < idealLow && forecast.windSpeedMph >= spot.minWindMph) {
    score += 5;
    reasons.push("Light but rideable");
  } else if (forecast.windSpeedMph > idealHigh && forecast.windSpeedMph <= spot.maxWindMph) {
    score += 10;
    reasons.push("Strong but manageable");
  }

  if (isIdealDirection(forecast.windDirection, spot.idealWindDirections)) {
    score += 20;
    reasons.push("Direction is on for this spot");
  } else {
    score -= 5;
    reasons.push("Off-axis direction");
  }

  const gustSpread = forecast.windGustMph - forecast.windSpeedMph;
  if (gustSpread > 10) {
    score -= 15;
    reasons.push("Gusty conditions");
  } else if (gustSpread >= 5) {
    score -= 5;
    reasons.push("Slightly gusty");
  }

  if (forecast.rainChance !== undefined) {
    if (forecast.rainChance >= 0.6) {
      score -= 15;
      reasons.push("High rain chance");
    } else if (forecast.rainChance >= 0.3) {
      score -= 5;
      reasons.push("Some rain risk");
    }
  }

  const finalScore = clamp(Math.round(score), 0, 100);
  return {
    label: labelForScore(finalScore),
    score: finalScore,
    reasons,
  };
}

export function bestUpcomingHour(
  forecast: ForecastHour[],
  spot: Spot,
  withinHours = 24
): { hour: ForecastHour; score: SessionScore } | null {
  if (!forecast.length) return null;
  const window = forecast.slice(0, withinHours);
  let best: { hour: ForecastHour; score: SessionScore } | null = null;
  for (const hour of window) {
    const score = scoreHour(hour, spot);
    if (score.label === "sketchy") continue;
    if (!best || score.score > best.score.score) {
      best = { hour, score };
    }
  }
  return best;
}
