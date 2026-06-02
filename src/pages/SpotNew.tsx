import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SpotForm from "../components/SpotForm";
import { useSpots } from "../hooks/useSpots";
import type { Spot } from "../types";

export default function SpotNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { upsertSpot } = useSpots();
  const lat = numberParam(params.get("lat"));
  const lng = numberParam(params.get("lng"));

  function save(spot: Spot) {
    upsertSpot(spot);
    navigate(`/spots/${spot.id}`);
  }

  return (
    <div>
      <BackLink />
      <header className="mt-3 mb-5">
        <h1 className="text-2xl font-bold">New spot</h1>
        <p className="text-ink-muted text-sm mt-1">Add launch details and wind rules.</p>
      </header>
      <SpotForm initialLat={lat} initialLng={lng} onSubmit={save} />
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/spots" className="inline-flex items-center gap-1 text-sm text-ink-muted active:text-ink-text">
      <ArrowLeft size={16} /> Back
    </Link>
  );
}

function numberParam(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
