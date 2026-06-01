import { Navigation } from "lucide-react";
import { compassToDegrees } from "../utils/windDirection";

type Props = {
  direction: string;
  size?: number;
  className?: string;
};

export default function WindDirectionIcon({ direction, size = 18, className = "" }: Props) {
  const degrees = compassToDegrees(direction);
  return (
    <span
      className={`inline-flex items-center justify-center text-ink-text/80 ${className}`}
      title={`Wind from ${direction}`}
      aria-label={`Wind from ${direction}`}
    >
      <Navigation
        size={size}
        style={{ transform: `rotate(${degrees + 180}deg)` }}
      />
    </span>
  );
}
