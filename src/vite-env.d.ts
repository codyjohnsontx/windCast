/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORECAST_PROVIDER?: string;
  readonly VITE_OPEN_METEO_BASE_URL?: string;
  readonly VITE_OPEN_METEO_TIMEOUT_MS?: string;
  readonly VITE_STORMGLASS_API_KEY?: string;
  readonly VITE_WIND_GRID_PROVIDER?: string;
  readonly VITE_WIND_GRID_PROXY_URL?: string;
  readonly VITE_WIND_GRID_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
