import { useCallback, useEffect, useState } from "react";
import { getHourlyForecastResult, type ForecastSourceMeta } from "../services/forecast";
import type { ForecastHour, Spot } from "../types";

type State = {
  data: ForecastHour[] | null;
  meta: ForecastSourceMeta | null;
  loading: boolean;
  error: Error | null;
};

export function useForecast(spot: Spot | undefined, hours = 48) {
  const [state, setState] = useState<State>({ data: null, meta: null, loading: !!spot, error: null });

  const fetchForecast = useCallback(
    async (target: Spot) => {
      setState({ data: null, meta: null, loading: true, error: null });
      try {
        const result = await getHourlyForecastResult(target, hours);
        setState({ data: result.hours, meta: result.meta, loading: false, error: null });
      } catch (err) {
        setState({
          data: null,
          meta: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    },
    [hours]
  );

  useEffect(() => {
    if (!spot) {
      setState({ data: null, meta: null, loading: false, error: null });
      return;
    }
    void fetchForecast(spot);
  }, [spot, fetchForecast]);

  const refetch = useCallback(() => {
    if (spot) void fetchForecast(spot);
  }, [spot, fetchForecast]);

  return { ...state, refetch };
}
