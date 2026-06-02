import type { ForecastConfidenceLabel } from "../services/observations";

const STYLES: Record<ForecastConfidenceLabel, string> = {
  high: "bg-score-good/15 text-score-good ring-score-good/40",
  medium: "bg-score-maybe/15 text-score-maybe ring-score-maybe/40",
  low: "bg-score-sketchy/15 text-score-sketchy ring-score-sketchy/40",
  unknown: "bg-score-poor/15 text-score-poor ring-score-poor/40",
};

const LABELS: Record<ForecastConfidenceLabel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  unknown: "Confidence unknown",
};

export default function ConfidenceBadge({ label }: { label: ForecastConfidenceLabel }) {
  return (
    <span className={`pill text-[10px] px-2 py-0.5 ring-1 ${STYLES[label]}`}>
      {LABELS[label]}
    </span>
  );
}
