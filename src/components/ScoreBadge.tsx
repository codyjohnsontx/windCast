import type { SessionScoreLabel } from "../types";

const STYLES: Record<SessionScoreLabel, string> = {
  fire: "bg-score-fire/15 text-score-fire ring-1 ring-score-fire/40",
  good: "bg-score-good/15 text-score-good ring-1 ring-score-good/40",
  maybe: "bg-score-maybe/15 text-score-maybe ring-1 ring-score-maybe/40",
  poor: "bg-score-poor/15 text-score-poor ring-1 ring-score-poor/40",
  sketchy: "bg-score-sketchy/20 text-score-sketchy ring-1 ring-score-sketchy/50",
};

const LABELS: Record<SessionScoreLabel, string> = {
  fire: "Fire",
  good: "Good",
  maybe: "Maybe",
  poor: "Poor",
  sketchy: "Sketchy",
};

type Props = {
  label: SessionScoreLabel;
  size?: "sm" | "md";
};

export default function ScoreBadge({ label, size = "md" }: Props) {
  const sizeCls = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`pill ${sizeCls} ${STYLES[label]}`}>{LABELS[label]}</span>
  );
}
