import type { ForecastTimelineSelection } from "../../services/layers/types";

const HOUR_OPTIONS = [6, 9, 12, 15, 18, 21];
const DAY_OPTIONS = [0, 1, 2, 3, 4];

type Props = {
  value: ForecastTimelineSelection;
  onChange: (value: ForecastTimelineSelection) => void;
};

export function selectedForecastHour(value: ForecastTimelineSelection): number {
  if (value.dayOffset === 0 && value.hourOffset === 0) return 0;
  return value.dayOffset * 24 + value.hourOffset;
}

export default function ForecastTimeline({ value, onChange }: Props) {
  return (
    <div className="absolute bottom-3 left-3 right-16 z-[500] rounded-lg border border-ink-line bg-ink-panel/95 p-2 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => onChange({ dayOffset: 0, hourOffset: 0 })}
          className={`h-8 shrink-0 rounded px-3 text-xs font-semibold ${
            selectedForecastHour(value) === 0 ? "bg-ink-text text-ink-base" : "text-ink-muted"
          }`}
        >
          Now
        </button>
        <div className="h-6 w-px shrink-0 bg-ink-line" />
        {DAY_OPTIONS.map((dayOffset) => (
          <button
            key={dayOffset}
            type="button"
            onClick={() => onChange({ dayOffset, hourOffset: value.hourOffset || 12 })}
            className={`h-8 shrink-0 rounded px-3 text-xs font-semibold ${
              value.dayOffset === dayOffset && selectedForecastHour(value) !== 0
                ? "bg-ink-text text-ink-base"
                : "text-ink-muted"
            }`}
          >
            {dayLabel(dayOffset)}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1 overflow-x-auto">
        {HOUR_OPTIONS.map((hourOffset) => (
          <button
            key={hourOffset}
            type="button"
            onClick={() => onChange({ dayOffset: value.dayOffset, hourOffset })}
            className={`h-7 shrink-0 rounded px-2 text-[11px] font-semibold ${
              value.hourOffset === hourOffset && selectedForecastHour(value) !== 0
                ? "bg-score-good/15 text-score-good ring-1 ring-score-good/40"
                : "text-ink-muted"
            }`}
          >
            {hourLabel(hourOffset)}
          </button>
        ))}
      </div>
    </div>
  );
}

function dayLabel(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function hourLabel(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", hour12: true });
}
