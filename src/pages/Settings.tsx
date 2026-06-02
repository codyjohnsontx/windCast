import { useState } from "react";
import { getForecastProvider } from "../services/forecast";
import { clearForecastCache } from "../services/forecast";
import { forecastCacheTtlMinutes } from "../services/forecast";
import { usePreferences, type UnitSystem } from "../hooks/usePreferences";
import { useSpots, validateSpots } from "../hooks/useSpots";

const UNIT_OPTIONS: Array<{ value: UnitSystem; label: string }> = [
  { value: "mph", label: "mph" },
  { value: "knots", label: "knots" },
  { value: "mps", label: "m/s" },
];

export default function Settings() {
  const { exportSpots, replaceSpots, resetToSeed } = useSpots();
  const { preferences, setWindUnit } = usePreferences();
  const provider = getForecastProvider();
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function exportData() {
    const blob = new Blob([exportSpots()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "windcast-spots.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    try {
      const spots = validateSpots(JSON.parse(importText));
      replaceSpots(spots);
      setImportText("");
      setMessage(`Imported ${spots.length} spots.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not import spots.");
    }
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-ink-muted text-sm mt-1">Preferences and about.</p>
      </header>

      <section className="card p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Forecast source
        </h2>
        <div className="mt-2 text-base">{provider.id}</div>
        <p className="mt-1 text-xs text-ink-muted">
          Configure via <code className="text-ink-text">VITE_FORECAST_PROVIDER</code> in{" "}
          <code className="text-ink-text">.env.local</code>.
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-ink-muted">Cache TTL: {forecastCacheTtlMinutes()} min</span>
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              clearForecastCache();
              setMessage("Forecast cache cleared.");
            }}
          >
            Clear cache
          </button>
        </div>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Units
        </h2>
        <div className="mt-3 inline-flex rounded-md border border-ink-line bg-ink-base/40 p-0.5">
          {UNIT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setWindUnit(option.value)}
              className={`h-9 px-3 text-sm font-semibold rounded ${
                preferences.windUnit === option.value ? "bg-ink-text text-ink-base" : "text-ink-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Saved spots
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={exportData} className="button-secondary">
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => {
              resetToSeed();
              setMessage("Seed spots restored.");
            }}
            className="button-secondary"
          >
            Reset to seed
          </button>
        </div>
        <textarea
          className="input mt-3 min-h-28 resize-y text-xs"
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste exported spots JSON"
        />
        <button type="button" onClick={importData} className="button-primary mt-3" disabled={!importText.trim()}>
          Import spots
        </button>
      </section>

      {message && <div className="card p-3 mb-4 text-sm text-ink-muted">{message}</div>}

      <section className="card p-4 text-sm text-ink-muted">
        Windcast is a focused session planner for kiteboarding, wing foiling, and
        downwind foiling. Use Open-Meteo for real forecasts or mock data for demos.
      </section>
    </div>
  );
}
