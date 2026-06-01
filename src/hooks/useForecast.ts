import { useCallback, useEffect, useState } from "react";
import { getForecastProvider } from "../services/forecast";
import type { ForecastHour, Spot } from "../types";

type State = {
  data: ForecastHour[] | null;
  loading: boolean;
  error: Error | null;
};

export function useForecast(spot: Spot | undefined, hours = 48) {
  const [state, setState] = useState<State>({ data: null, loading: !!spot, error: null });

  const fetchForecast = useCallback(
    async (target: Spot) => {
      setState({ data: null, loading: true, error: null });
      try {
        const provider = getForecastProvider();
        const data = await provider.getHourlyForecast(target, hours);
        setState({ data, loading: false, error: null });
      } catch (err) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    },
    [hours]
  );

  useEffect(() => {
    if (!spot) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    void fetchForecast(spot);
  }, [spot, fetchForecast]);

  const refetch = useCallback(() => {
    if (spot) void fetchForecast(spot);
  }, [spot, fetchForecast]);

  return { ...state, refetch };
}
