import type { SportType } from "../types";

const SPORT_LABELS: Record<SportType, string> = {
  kiteboarding: "Kite",
  wing_foiling: "Wing",
  downwind_foiling: "Downwind",
};

type Props = {
  sports: SportType[];
};

export default function SportTagList({ sports }: Props) {
  if (!sports.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {sports.map((sport) => (
        <span
          key={sport}
          className="pill text-[10px] bg-ink-line text-ink-text/80 ring-1 ring-ink-line"
        >
          {SPORT_LABELS[sport]}
        </span>
      ))}
    </div>
  );
}
