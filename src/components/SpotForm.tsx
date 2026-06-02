import { useMemo, useState } from "react";
import type React from "react";
import { Save, Trash2 } from "lucide-react";
import { COMPASS_OPTIONS, SPORT_OPTIONS } from "../constants";
import type { SportType, Spot } from "../types";

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
  notes: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

export default function SpotForm({ initialSpot, initialLat, initialLng, onSubmit, onDelete }: Props) {
  const [state, setState] = useState<FormState>(() => spotToForm(initialSpot, initialLat, initialLng));
  const [errors, setErrors] = useState<Errors>({});

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
      notes: state.notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" error={errors.name}>
        <input className="input" value={state.name} onChange={(event) => update("name", event.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude" error={errors.latitude}>
          <input className="input" inputMode="decimal" value={state.latitude} onChange={(event) => update("latitude", event.target.value)} />
        </Field>
        <Field label="Longitude" error={errors.longitude}>
          <input className="input" inputMode="decimal" value={state.longitude} onChange={(event) => update("longitude", event.target.value)} />
        </Field>
      </div>

      <Field label="Sports" hint={sportHint}>
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
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Minimum wind" error={errors.minWindMph}>
          <input className="input" inputMode="decimal" value={state.minWindMph} onChange={(event) => update("minWindMph", event.target.value)} />
        </Field>
        <Field label="Maximum wind" error={errors.maxWindMph}>
          <input className="input" inputMode="decimal" value={state.maxWindMph} onChange={(event) => update("maxWindMph", event.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ideal low" error={errors.idealLow}>
          <input className="input" inputMode="decimal" value={state.idealLow} onChange={(event) => update("idealLow", event.target.value)} />
        </Field>
        <Field label="Ideal high" error={errors.idealHigh}>
          <input className="input" inputMode="decimal" value={state.idealHigh} onChange={(event) => update("idealHigh", event.target.value)} />
        </Field>
      </div>

      <Field label="Ideal directions">
        <DirectionGrid selected={state.idealWindDirections} onToggle={(direction) => toggleList("idealWindDirections", direction)} />
      </Field>

      <Field label="Unsafe directions">
        <DirectionGrid selected={state.unsafeWindDirections} onToggle={(direction) => toggleList("unsafeWindDirections", direction)} />
      </Field>

      <Field label="Notes">
        <textarea className="input min-h-24 resize-y" value={state.notes} onChange={(event) => update("notes", event.target.value)} />
      </Field>

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
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-ink-muted">{label}</div>
      {children}
      {error && <div className="mt-1 text-xs text-score-sketchy">{error}</div>}
      {!error && hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </label>
  );
}

function DirectionGrid({ selected, onToggle }: { selected: string[]; onToggle: (direction: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {COMPASS_OPTIONS.map((direction) => (
        <button
          key={direction}
          type="button"
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
