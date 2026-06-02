import { useState } from "react";
import type { ForecastHour, SessionScore } from "../types";
import type { UnitSystem } from "../hooks/usePreferences";
import ScoreBadge from "./ScoreBadge";
import WindDirectionIcon from "./WindDirectionIcon";
import { formatHour, formatPercent, formatWind } from "../utils/format";

type Props = {
  hour: ForecastHour;
  score: SessionScore;
  windUnit?: UnitSystem;
};

export default function ForecastHourCard({ hour, score, windUnit = "mph" }: Props) {
  const [showReasons, setShowReasons] = useState(false);

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <div className="text-base font-semibold tabular-nums w-16">{formatHour(hour.time)}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums">{formatWind(hour.windSpeedMph, windUnit)}</span>
            <span className="text-ink-muted text-sm tabular-nums">
              g {formatWind(hour.windGustMph, windUnit)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WindDirectionIcon direction={hour.windDirection} />
          <span className="text-sm text-ink-muted w-9 text-right">{hour.windDirection}</span>
          <ScoreBadge label={score.label} size="sm" />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
        <span>{score.score}/100</span>
        {score.reasons.length > 0 && (
          <button
            type="button"
            onClick={() => setShowReasons((prev) => !prev)}
            className="underline underline-offset-2 active:text-ink-text"
          >
            {showReasons ? "Hide score reasons" : "Why this score?"}
          </button>
        )}
      </div>

      {showReasons && score.reasons.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {score.reasons.map((reason, i) => (
            <li
              key={i}
              className="text-[11px] text-ink-muted bg-ink-base/40 ring-1 ring-ink-line rounded-full px-2 py-0.5"
            >
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
        {hour.temperatureF !== undefined && <span>{Math.round(hour.temperatureF)}°F</span>}
        {hour.rainChance !== undefined && <span>Rain {formatPercent(hour.rainChance)}</span>}
        {hour.waveHeightFt !== undefined && <span>Waves {hour.waveHeightFt} ft</span>}
        {hour.tide && <span>Tide {hour.tide}</span>}
      </div>
    </div>
  );
}
