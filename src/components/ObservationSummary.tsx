import type {
  ForecastConfidence,
  ObservationStation,
  StationObservation,
} from "../services/observations";
import { formatWind } from "../utils/format";
import type { UnitSystem } from "../hooks/usePreferences";
import ConfidenceBadge from "./ConfidenceBadge";

type Props = {
  station?: ObservationStation;
  observation?: StationObservation | null;
  confidence: ForecastConfidence;
  windUnit?: UnitSystem;
  compact?: boolean;
};

export default function ObservationSummary({
  station,
  observation,
  confidence,
  windUnit = "mph",
  compact,
}: Props) {
  if (!station || !observation) {
    return (
      <div className="text-sm text-ink-muted">
        <ConfidenceBadge label={confidence.label} />
        {!compact && <div className="mt-2">No nearby fresh observation available.</div>}
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ConfidenceBadge label={confidence.label} />
        <span className="text-ink-muted">{station.name}</span>
      </div>
      <div className="mt-2 text-ink-text">
        Station{" "}
        {observation.windSpeedMph !== undefined
          ? formatWind(observation.windSpeedMph, windUnit)
          : "--"}
        {observation.windGustMph !== undefined && (
          <span className="text-ink-muted"> g {formatWind(observation.windGustMph, windUnit)}</span>
        )}
        {observation.windDirection && <span className="text-ink-muted"> {observation.windDirection}</span>}
      </div>
      {!compact && (
        <div className="mt-1 text-xs text-ink-muted">
          {formatAge(observation.observedAt)}
          {confidence.windSpeedDeltaMph !== undefined && (
            <> · model delta {formatWind(confidence.windSpeedDeltaMph, windUnit)}</>
          )}
          {confidence.windDirectionDeltaDegrees !== undefined && (
            <> · {Math.round(confidence.windDirectionDeltaDegrees)} deg</>
          )}
        </div>
      )}
      {!compact && observation.waveHeightFt !== undefined && (
        <div className="mt-1 text-xs text-ink-muted">
          Waves {observation.waveHeightFt} ft
          {observation.wavePeriodSeconds !== undefined && <> · {observation.wavePeriodSeconds}s</>}
        </div>
      )}
    </div>
  );
}

function formatAge(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} hr ago`;
}
