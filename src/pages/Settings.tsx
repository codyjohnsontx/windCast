import { getForecastProvider } from "../services/forecast";
import { useSpots } from "../hooks/useSpots";

export default function Settings() {
  const { resetToSeed } = useSpots();
  const provider = getForecastProvider();

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
      </section>

      <section className="card p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Units
        </h2>
        <div className="mt-2 text-base">mph</div>
        <p className="mt-1 text-xs text-ink-muted">Knots / m/s coming later.</p>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Saved spots
        </h2>
        <button
          onClick={resetToSeed}
          className="mt-2 text-sm text-ink-text underline underline-offset-2 active:opacity-70"
        >
          Reset to seed spots
        </button>
      </section>

      <section className="card p-4 text-sm text-ink-muted">
        Windcast is a focused session planner for kiteboarding, wing foiling, and
        downwind foiling. Mock data only for now — built to make the real-API swap easy.
      </section>
    </div>
  );
}
