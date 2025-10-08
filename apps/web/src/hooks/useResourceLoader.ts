import { useCallback, useEffect, useRef, useState } from 'react';

interface LoaderStatus {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

type LoaderFn = () => Promise<unknown> | void;

type Options = {
  /**
   * Ejecutar inmediatamente aunque el componente vuelva a montarse.
   * Cuando es `false`, el hook evita invocaciones duplicadas durante la misma sesión.
   */
  runOnEveryMount?: boolean;
  /**
   * Mensaje de error personalizado cuando la promesa rechaza.
   */
  errorMessage?: string;
};

export function useResourceLoader(
  loader: LoaderFn,
  dependencies: unknown[] = [],
  options: Options = {},
): LoaderStatus {
  const { runOnEveryMount = false, errorMessage } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRequestedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await loader();
    } catch (err) {
      const message =
        errorMessage ?? (err instanceof Error ? err.message : 'Ocurrió un error al cargar la información.');
      console.error('[useResourceLoader] loader failed:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loader, errorMessage]);

  useEffect(() => {
    if (!runOnEveryMount && hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    loading,
    error,
    refresh,
  };
}
