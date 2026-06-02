# Windcast

Find your next wind window. A focused, mobile-first session planner for
kiteboarding, wing foiling, and downwind foiling — designed to answer one
question: *is it worth loading up gear and going?*

Built with React + TypeScript + Vite + Tailwind. Uses mock forecast data by
default and can switch to Open-Meteo for real hourly wind forecasts.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run typecheck   # tsc --noEmit
npm run test:run    # vitest run
npm run build       # typecheck + production build
npm run preview     # serve the production build
```

## Pages

- `/` Dashboard — saved spots, each with the best upcoming session window and a
  score badge.
- `/map` Map — interactive Leaflet map with saved spots as score-colored pins,
  an animated wind-particle overlay (Windy-style), and tap-anywhere-for-forecast.
- `/spots` Saved spots list — dense list view with add/edit flows.
- `/spots/new` New saved spot — supports map-prefilled coordinates.
- `/spots/:id` Spot detail — local notes, spot config, hourly forecast cards
  grouped by day with per-hour scores and reasons.
- `/spots/:id/edit` Edit saved spot — update rules or delete.
- `/settings` Settings — forecast source/cache controls, units, import/export,
  and reset-to-seed.

## The Map

`/map` shows a Leaflet base map (OpenStreetMap tiles, free) with:

- **Animated wind particle overlay** via `leaflet-velocity`. Driven by a
  `WindGridProvider` (today: a synthetic Gulf-of-Mexico flow).
- **Score-colored pins** for every saved spot. Tap one for a popup with the
  current wind summary, session-score label, and a link to spot detail.
- **Tap anywhere** on the map for a quick forecast popup at that lat/lng. Uses
  the existing `ForecastProvider` via an ephemeral spot — no interface change.
- **Toolbar controls** for forecast hour, wind particle visibility, saved spot
  visibility, and recentering.
- **Save clicked locations** directly as new spots.

### Swapping in real wind grids

Same pattern as the forecast layer. Edit
`src/services/wind-grid/NoaaGfsWindGridProvider.ts` — the file documents the
real path (NOAA NOMADS GFS 0.25° via a small serverless GRIB2-to-JSON proxy)
and alternatives (OpenWeatherMap raster tiles, Stormglass marine API).

To activate the swap once implemented:

```
VITE_WIND_GRID_PROVIDER=noaa-gfs
VITE_WIND_GRID_PROXY_URL=https://your-grib-proxy.example.com/wind
```

## Session scoring

`src/utils/sessionScore.ts` exposes `scoreHour(forecast, spot)` and
`bestUpcomingHour(forecast, spot, hours)`.

Labels: `fire`, `good`, `maybe`, `poor`, `sketchy`.

Hard fails (return `sketchy` immediately):
- Wind direction is in the spot's `unsafeWindDirections`
- Wind speed is over `maxWindMph`
- Gust is more than 5 mph over `maxWindMph`

Otherwise: starts at 50, adds for ideal range / ideal direction, subtracts for
off-axis direction / gusty conditions / rain risk, then maps to a label.

## Real weather API

The app talks to forecasts only through `ForecastProvider`
(`src/services/forecast/types.ts`). The active provider defaults to
`MockForecastProvider`; `OpenMeteoForecastProvider` is implemented and can be
enabled without page/component changes.

To swap in Open-Meteo:

1. Copy `.env.example` to `.env.local` if you use one locally, or create
   `.env.local`.
2. Set:

```
VITE_FORECAST_PROVIDER=open-meteo
VITE_FORECAST_CACHE_TTL_MINUTES=30
```

3. Restart `npm run dev`.

Unit conversions live in `src/services/forecast/normalize.ts`
(`mpsToMph`, `degreesToCompass`, `celsiusToFahrenheit`, `metersToFeet`).

Need rate-limit-friendly caching? Open-Meteo is wrapped with
`CachedForecastProvider` automatically using `VITE_FORECAST_CACHE_TTL_MINUTES`.
The cache can be cleared from Settings.

Need to combine sources (e.g. Open-Meteo wind + NOAA tides)? Same interface —
build a `CompositeForecastProvider` that merges results from two underlying
providers per hour.

## What's next

- Real tide data from NOAA CO-OPS for Texas coastal stations
- Real wind grids: build a NOAA GFS GRIB2-to-JSON serverless proxy and wire
  `NoaaGfsWindGridProvider`
- Make particles follow the selected forecast hour
- Additional map layers (rain, temperature, waves) behind a `MapLayerProvider`
- Long-press on the map to add a saved spot at that lat/lng
- PWA install + offline cache
- Push notifications when a saved spot enters a "fire" window

## Out of scope (on purpose)

- Radar loops, satellite imagery, 3D globe
- Auth, accounts, payments
- Route planning
- 10-day forecasts, 1-hour forecast steps premium tier
- Any backend at all (until real wind grids force a small proxy)
