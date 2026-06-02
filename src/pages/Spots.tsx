import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import SportTagList from "../components/SportTagList";
import { usePreferences } from "../hooks/usePreferences";
import { useSpots } from "../hooks/useSpots";
import { formatRange } from "../utils/format";

export default function Spots() {
  const { spots } = useSpots();
  const { preferences } = usePreferences();

  return (
    <div>
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Saved spots</h1>
            <p className="text-ink-muted text-sm mt-1">
              Session planning for wind sports.
            </p>
          </div>
          <Link to="/spots/new" className="icon-button" aria-label="Add spot">
            <Plus size={18} />
          </Link>
        </div>
      </header>

      {spots.length === 0 ? (
        <div className="card p-6 text-center">
          <div className="font-semibold">No saved spots yet.</div>
          <Link to="/spots/new" className="button-primary mt-4 inline-flex">
            <Plus size={16} /> Add spot
          </Link>
        </div>
      ) : (
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
                    Ideal {formatRange(spot.idealWindMph[0], spot.idealWindMph[1], preferences.windUnit)}
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
      )}
    </div>
  );
}
