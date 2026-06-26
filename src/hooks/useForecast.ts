import { useCallback, useEffect, useRef, useState } from "react";
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
  const activeController = useRef<AbortController | null>(null);

  const fetchForecast = useCallback(
    async (target: Spot) => {
      activeController.current?.abort();
      const controller = new AbortController();
      activeController.current = controller;
      setState({ data: null, meta: null, loading: true, error: null });
      try {
        const result = await getHourlyForecastResult(target, hours, { signal: controller.signal });
        if (controller.signal.aborted || activeController.current !== controller) return;
        setState({ data: result.hours, meta: result.meta, loading: false, error: null });
      } catch (err) {
        if (controller.signal.aborted || activeController.current !== controller) return;
        setState({
          data: null,
          meta: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      } finally {
        if (activeController.current === controller) {
          activeController.current = null;
        }
      }
    },
    [hours]
  );

  useEffect(() => {
    if (!spot) {
      activeController.current?.abort();
      setState({ data: null, meta: null, loading: false, error: null });
      return;
    }
    void fetchForecast(spot);
    return () => {
      activeController.current?.abort();
    };
  }, [spot, fetchForecast]);

  const refetch = useCallback(() => {
    if (spot) void fetchForecast(spot);
  }, [spot, fetchForecast]);

  return { ...state, refetch };
}
