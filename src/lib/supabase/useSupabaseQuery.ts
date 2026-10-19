import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { getErrorMessage } from "@/lib/utils";

type QueryResult<T> = PromiseLike<{
  data: T | null;
  error: { message: string } | null;
}>;

// Loads a Supabase query on mount; `reload` refetches after a change without
// flashing the loading state again. A failed reload keeps the last data.
export function useSupabaseQuery<T>(
  query: () => QueryResult<T>,
  emptyValue: T,
  loadErrorMessage: string,
) {
  const [state, setState] = useState({
    data: emptyValue,
    error: "",
    isLoading: true,
  });
  const [requestCount, setRequestCount] = useState(0);

  const runQuery = useEffectEvent(async () => {
    try {
      const { data, error } = await query();
      return error
        ? { ok: false as const, error: error.message }
        : { ok: true as const, data: data ?? emptyValue };
    } catch (caughtError) {
      return {
        ok: false as const,
        error: getErrorMessage(caughtError, loadErrorMessage),
      };
    }
  });

  useEffect(() => {
    let isCurrent = true;

    void runQuery().then((result) => {
      if (!isCurrent) {
        return;
      }

      setState((current) =>
        result.ok
          ? { data: result.data, error: "", isLoading: false }
          : { ...current, error: result.error, isLoading: false },
      );
    });

    return () => {
      isCurrent = false;
    };
  }, [requestCount]);

  const reload = useCallback(() => setRequestCount((count) => count + 1), []);

  return { ...state, reload };
}
