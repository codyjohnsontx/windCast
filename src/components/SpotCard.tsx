import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { ForecastHour, SessionScore, Spot } from "../types";
import { usePreferences } from "../hooks/usePreferences";
import type {
  ForecastConfidence,
  ObservationStation,
  StationObservation,
} from "../services/observations";
import ConfidenceBadge from "./ConfidenceBadge";
import ScoreBadge from "./ScoreBadge";
import SportTagList from "./SportTagList";
import WindDirectionIcon from "./WindDirectionIcon";
import { formatDayLabel, formatHour, formatWind } from "../utils/format";

type Props = {
  spot: Spot;
  currentHour?: ForecastHour;
  currentScore?: SessionScore;
  bestWindow?: { hour: ForecastHour; score: SessionScore } | null;
  confidence?: ForecastConfidence;
  observation?: StationObservation | null;
  station?: ObservationStation;
  loading?: boolean;
};

export default function SpotCard({
  spot,
  currentHour,
  currentScore,
  bestWindow,
  confidence,
  observation,
  station,
  loading,
}: Props) {
  const { preferences } = usePreferences();

  return (
    <Link
      to={`/spots/${spot.id}`}
      className="card block p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate">{spot.name}</h3>
          <div className="mt-1 text-sm font-semibold text-ink-muted">
            {decisionPhrase(currentScore, confidence)}
          </div>
          <div className="mt-1.5">
            <SportTagList sports={spot.sportTypes} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {currentScore ? <ScoreBadge label={currentScore.label} /> : null}
          <ChevronRight className="text-ink-muted" size={20} />
        </div>
      </div>

      {confidence && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ConfidenceBadge label={confidence.label} />
          {confidence.reasons[0] && (
            <span className="text-xs text-ink-muted">{confidence.reasons[0]}</span>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat
          label="Now"
          value={
            loading ? (
              <span className="skeleton inline-block h-5 w-28" />
            ) : currentHour ? (
              <span className="inline-flex items-center gap-1.5">
                {formatWind(currentHour.windSpeedMph, preferences.windUnit)}
                <span className="text-ink-muted text-sm">
                  g {formatWind(currentHour.windGustMph, preferences.windUnit)}
                </span>
                <WindDirectionIcon direction={currentHour.windDirection} size={14} />
                <span className="text-ink-muted text-sm">{currentHour.windDirection}</span>
              </span>
            ) : (
              "—"
            )
          }
        />
        <Stat
          label="Best window"
          value={
            loading ? (
              <span className="skeleton inline-block h-5 w-32" />
            ) : bestWindow ? (
              <span className="inline-flex items-center gap-1.5">
                <ScoreBadge label={bestWindow.score.label} size="sm" />
                <span className="text-sm text-ink-muted">
                  {formatDayLabel(bestWindow.hour.time)} {formatHour(bestWindow.hour.time)}
                </span>
              </span>
            ) : (
              <span className="text-ink-muted text-sm">No usable hours</span>
            )
          }
        />
      </div>

      {!loading && observation && currentHour && (
        <div className="mt-3 border-t border-ink-line pt-3 text-xs text-ink-muted">
          Model {formatWind(currentHour.windSpeedMph, preferences.windUnit)} g{" "}
          {formatWind(currentHour.windGustMph, preferences.windUnit)} {currentHour.windDirection}
          <br />
          {station?.name ?? "Station"}{" "}
          {observation.windSpeedMph !== undefined
            ? formatWind(observation.windSpeedMph, preferences.windUnit)
            : "--"}
          {observation.windGustMph !== undefined && (
            <> g {formatWind(observation.windGustMph, preferences.windUnit)}</>
          )}{" "}
          {observation.windDirection}
        </div>
      )}
    </Link>
  );
}

function decisionPhrase(score: SessionScore | undefined, confidence: ForecastConfidence | undefined): string {
  if (!score) return "Checking conditions";
  if (score.label === "sketchy" || score.label === "poor") return "Skip";
  if (confidence?.label === "low") return "Verify first";
  if (score.label === "maybe") return "Worth watching";
  return "Go window";
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
