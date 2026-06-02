import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SpotForm from "../components/SpotForm";
import { useSpots } from "../hooks/useSpots";
import type { Spot } from "../types";

export default function SpotEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSpot, removeSpot, upsertSpot } = useSpots();
  const spot = getSpot(id);

  if (!spot) {
    return (
      <div>
        <BackLink id={id} />
        <div className="card p-6 mt-4 text-center text-ink-muted">Spot not found.</div>
      </div>
    );
  }

  function save(nextSpot: Spot) {
    upsertSpot(nextSpot);
    navigate(`/spots/${nextSpot.id}`);
  }

  function deleteSpot() {
    if (!spot) return;
    const confirmed = window.confirm(`Delete ${spot.name}? This cannot be undone.`);
    if (!confirmed) return;
    removeSpot(spot.id);
    navigate("/spots");
  }

  return (
    <div>
      <BackLink id={spot.id} />
      <header className="mt-3 mb-5">
        <h1 className="text-2xl font-bold">Edit {spot.name}</h1>
        <p className="text-ink-muted text-sm mt-1">Tune this spot's wind rules.</p>
      </header>
      <SpotForm initialSpot={spot} onSubmit={save} onDelete={deleteSpot} />
    </div>
  );
}

function BackLink({ id }: { id?: string }) {
  return (
    <Link to={id ? `/spots/${id}` : "/spots"} className="inline-flex items-center gap-1 text-sm text-ink-muted active:text-ink-text">
      <ArrowLeft size={16} /> Back
    </Link>
  );
}
