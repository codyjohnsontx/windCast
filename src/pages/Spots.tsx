import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SportTagList from "../components/SportTagList";
import { useSpots } from "../hooks/useSpots";
import { formatRange } from "../utils/format";

export default function Spots() {
  const { spots } = useSpots();

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Saved spots</h1>
        <p className="text-ink-muted text-sm mt-1">
          Session planning for wind sports.
        </p>
      </header>

      <ul className="card divide-y divide-ink-line">
        {spots.map((spot) => (
          <li key={spot.id}>
            <Link
              to={`/spots/${spot.id}`}
              className="flex items-center justify-between gap-3 p-4 active:bg-ink-base/30"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">{spot.name}</div>
                <div className="mt-1 text-xs text-ink-muted">
                  Ideal {formatRange(spot.idealWindMph[0], spot.idealWindMph[1])}
                  {spot.idealWindDirections.length > 0 && (
                    <> · {spot.idealWindDirections.join("/")}</>
                  )}
                </div>
                <div className="mt-2">
                  <SportTagList sports={spot.sportTypes} />
                </div>
              </div>
              <ChevronRight className="text-ink-muted shrink-0" size={20} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
