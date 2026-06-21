import { useMemo, useState } from "react";
import type React from "react";
import { Crosshair, MapPinned, Save, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { COMPASS_OPTIONS, ENVIRONMENT_OPTIONS, SPORT_OPTIONS } from "../constants";
import type { SportType, Spot, SpotEnvironment } from "../types";

type Props = {
  initialSpot?: Spot;
  initialLat?: number;
  initialLng?: number;
  onSubmit: (spot: Spot) => void;
  onDelete?: () => void;
};

type FormState = {
  name: string;
  latitude: string;
  longitude: string;
  sportTypes: SportType[];
  minWindMph: string;
  idealLow: string;
  idealHigh: string;
  maxWindMph: string;
  idealWindDirections: string[];
  unsafeWindDirections: string[];
  environment: SpotEnvironment;
  notes: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

export default function SpotForm({ initialSpot, initialLat, initialLng, onSubmit, onDelete }: Props) {
  const [state, setState] = useState<FormState>(() => spotToForm(initialSpot, initialLat, initialLng));
  const [errors, setErrors] = useState<Errors>({});
  const [coordinateText, setCoordinateText] = useState("");
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const sportHint = useMemo(
    () => (state.sportTypes.length === 0 ? "Pick at least one sport so lists are easier to scan." : ""),
    [state.sportTypes.length]
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      id: initialSpot?.id ?? slugify(state.name),
      name: state.name.trim(),
      latitude: Number(state.latitude),
      longitude: Number(state.longitude),
      sportTypes: state.sportTypes,
      idealWindDirections: state.idealWindDirections,
      unsafeWindDirections: state.unsafeWindDirections,
      minWindMph: Number(state.minWindMph),
      idealWindMph: [Number(state.idealLow), Number(state.idealHigh)],
      maxWindMph: Number(state.maxWindMph),
      environment: state.environment,
      trustedStationIds: initialSpot?.trustedStationIds,
      notes: state.notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Location</h2>
        <div className="mt-3 space-y-4">
          <Field label="Name" error={errors.name} htmlFor="spot-name">
            <input id="spot-name" className="input" value={state.name} onChange={(event) => update("name", event.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" error={errors.latitude} htmlFor="spot-latitude">
              <input id="spot-latitude" className="input" inputMode="decimal" value={state.latitude} onChange={(event) => update("latitude", event.target.value)} />
            </Field>
            <Field label="Longitude" error={errors.longitude} htmlFor="spot-longitude">
              <input id="spot-longitude" className="input" inputMode="decimal" value={state.longitude} onChange={(event) => update("longitude", event.target.value)} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="button-secondary" onClick={useCurrentLocation}>
              <Crosshair size={16} /> Use my location
            </button>
            <Link to="/map" className="button-secondary">
              <MapPinned size={16} /> Pick on map
            </Link>
          </div>
          {locationStatus && <div className="text-xs text-ink-muted">{locationStatus}</div>}

          <div className="flex gap-2">
            <input
              className="input"
              value={coordinateText}
              onChange={(event) => setCoordinateText(event.target.value)}
              placeholder="Paste coordinates, e.g. 27.4661, -97.3122"
              aria-label="Paste coordinates"
            />
            <button type="button" className="button-secondary shrink-0" onClick={applyCoordinateText}>
              Apply
            </button>
          </div>
        </div>
      </section>

      <fieldset className="card p-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Spot basics</legend>
        <div className="mt-3 space-y-4">
          <FieldsetGroup label="Spot type">
            <div className="inline-flex rounded-md border border-ink-line bg-ink-base/40 p-0.5">
              {ENVIRONMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={state.environment === option.value}
                  onClick={() => update("environment", option.value)}
                  className={`h-9 px-3 text-sm font-semibold rounded ${
                    state.environment === option.value ? "bg-ink-text text-ink-base" : "text-ink-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FieldsetGroup>

          <FieldsetGroup label="Sports" hint={sportHint}>
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTIONS.map((option) => (
                <label key={option.value} className="choice">
                  <input
                    type="checkbox"
                    checked={state.sportTypes.includes(option.value)}
                    onChange={() => toggleList("sportTypes", option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </FieldsetGroup>
        </div>
      </fieldset>

      <fieldset className="card p-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Wind rules</legend>
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum wind" error={errors.minWindMph} htmlFor="spot-min-wind">
              <input id="spot-min-wind" className="input" inputMode="decimal" value={state.minWindMph} onChange={(event) => update("minWindMph", event.target.value)} />
            </Field>
            <Field label="Maximum wind" error={errors.maxWindMph} htmlFor="spot-max-wind">
              <input id="spot-max-wind" className="input" inputMode="decimal" value={state.maxWindMph} onChange={(event) => update("maxWindMph", event.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ideal low" error={errors.idealLow} htmlFor="spot-ideal-low">
              <input id="spot-ideal-low" className="input" inputMode="decimal" value={state.idealLow} onChange={(event) => update("idealLow", event.target.value)} />
            </Field>
            <Field label="Ideal high" error={errors.idealHigh} htmlFor="spot-ideal-high">
              <input id="spot-ideal-high" className="input" inputMode="decimal" value={state.idealHigh} onChange={(event) => update("idealHigh", event.target.value)} />
            </Field>
          </div>

          <FieldsetGroup label="Ideal directions">
            <DirectionGrid selected={state.idealWindDirections} onToggle={(direction) => toggleList("idealWindDirections", direction)} />
          </FieldsetGroup>
        </div>
      </fieldset>

      <fieldset className="card p-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Safety and notes</legend>
        <div className="mt-3 space-y-4">
          <FieldsetGroup label="Unsafe directions">
            <DirectionGrid selected={state.unsafeWindDirections} onToggle={(direction) => toggleList("unsafeWindDirections", direction)} />
          </FieldsetGroup>

          <Field label="Notes" htmlFor="spot-notes">
            <textarea id="spot-notes" className="input min-h-24 resize-y" value={state.notes} onChange={(event) => update("notes", event.target.value)} />
          </Field>
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3 pt-2">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="button-danger">
            <Trash2 size={16} /> Delete
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="button-primary">
          <Save size={16} /> Save spot
        </button>
      </div>
    </form>
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not available in this browser.");
      return;
    }
    setLocationStatus("Requesting current location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("latitude", position.coords.latitude.toFixed(5));
        update("longitude", position.coords.longitude.toFixed(5));
        setLocationStatus(`Location applied with ${Math.round(position.coords.accuracy)} m accuracy.`);
      },
      () => setLocationStatus("Could not get current location. You can paste coordinates instead."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function applyCoordinateText() {
    const match = /(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/.exec(coordinateText.trim());
    if (!match) {
      setLocationStatus("Enter coordinates like 27.4661, -97.3122.");
      return;
    }
    update("latitude", match[1]);
    update("longitude", match[2]);
    setLocationStatus("Coordinates applied.");
  }

  function toggleList<K extends "sportTypes" | "idealWindDirections" | "unsafeWindDirections">(
    key: K,
    value: FormState[K][number]
  ) {
    setState((prev) => {
      const list = prev[key] as string[];
      return {
        ...prev,
        [key]: list.includes(value as string)
          ? list.filter((item) => item !== value)
          : [...list, value],
      };
    });
  }
}

function Field({
  label,
  children,
  error,
  hint,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[10px] uppercase tracking-wider text-ink-muted">{label}</label>
      {children}
      {error && <div className="mt-1 text-xs text-score-sketchy">{error}</div>}
      {!error && hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

function FieldsetGroup({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-[10px] uppercase tracking-wider text-ink-muted">{label}</legend>
      {children}
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </fieldset>
  );
}

function DirectionGrid({ selected, onToggle }: { selected: string[]; onToggle: (direction: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {COMPASS_OPTIONS.map((direction) => (
        <button
          key={direction}
          type="button"
          aria-pressed={selected.includes(direction)}
          aria-label={`${direction} wind direction`}
          onClick={() => onToggle(direction)}
          className={`h-9 rounded-md border text-xs font-semibold ${
            selected.includes(direction)
              ? "border-score-good bg-score-good/15 text-score-good"
              : "border-ink-line bg-ink-base/40 text-ink-muted"
          }`}
        >
          {direction}
        </button>
      ))}
    </div>
  );
}

function spotToForm(spot?: Spot, initialLat?: number, initialLng?: number): FormState {
  return {
    name: spot?.name ?? "",
    latitude: String(spot?.latitude ?? initialLat ?? ""),
    longitude: String(spot?.longitude ?? initialLng ?? ""),
    sportTypes: spot?.sportTypes ?? [],
    minWindMph: String(spot?.minWindMph ?? 12),
    idealLow: String(spot?.idealWindMph[0] ?? 16),
    idealHigh: String(spot?.idealWindMph[1] ?? 26),
    maxWindMph: String(spot?.maxWindMph ?? 35),
    idealWindDirections: spot?.idealWindDirections ?? [],
    unsafeWindDirections: spot?.unsafeWindDirections ?? [],
    environment: spot?.environment ?? "inland",
    notes: spot?.notes ?? "",
  };
}

export function validate(state: FormState): Errors {
  const errors: Errors = {};
  const latitude = parseNumericField(state.latitude, "latitude", errors);
  const longitude = parseNumericField(state.longitude, "longitude", errors);
  const min = parseNumericField(state.minWindMph, "minWindMph", errors);
  const idealLow = parseNumericField(state.idealLow, "idealLow", errors);
  const idealHigh = parseNumericField(state.idealHigh, "idealHigh", errors);
  const max = parseNumericField(state.maxWindMph, "maxWindMph", errors);

  if (!state.name.trim()) errors.name = "Name is required.";
  if (latitude !== null && (latitude < -90 || latitude > 90)) errors.latitude = "Use -90 to 90.";
  if (longitude !== null && (longitude < -180 || longitude > 180)) errors.longitude = "Use -180 to 180.";
  if (min !== null && idealLow !== null && min > idealLow) errors.idealLow = "Must be at least minimum.";
  if (idealLow !== null && idealHigh !== null && idealLow > idealHigh) errors.idealHigh = "Must be at least ideal low.";
  if (idealHigh !== null && max !== null && idealHigh > max) errors.maxWindMph = "Must be at least ideal high.";

  return errors;
}

function parseNumericField(value: string, key: keyof Errors, errors: Errors): number | null {
  if (value.trim() === "") {
    errors[key] = "Enter a number.";
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors[key] = "Enter a number.";
    return null;
  }
  return parsed;
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "spot"}-${Date.now().toString(36)}`;
}
