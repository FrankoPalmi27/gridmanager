import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ExchangeRateSnapshot {
  compra: number;
  venta: number;
  fetchedAt: number;
  provider: string;
  isFallback?: boolean;
}

type ExchangeRateStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseExchangeRateState {
  data: ExchangeRateSnapshot | null;
  status: ExchangeRateStatus;
  error: Error | null;
}

export interface UseExchangeRateResult {
  data: ExchangeRateSnapshot | null;
  status: ExchangeRateStatus;
  error: Error | null;
  refresh: () => Promise<void>;
}

const EXCHANGE_ENDPOINT = 'https://api.bluelytics.com.ar/v2/latest';
const CACHE_KEY = 'grid-manager:exchange-rate';
const STALE_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 3;

const FALLBACK_RATE: Pick<ExchangeRateSnapshot, 'compra' | 'venta'> = {
  compra: 920,
  venta: 940
};

const loadCachedSnapshot = (): ExchangeRateSnapshot | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ExchangeRateSnapshot;
    if (!parsed || typeof parsed.fetchedAt !== 'number') {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('[useExchangeRate] No se pudo leer la cache local:', error);
    return null;
  }
};

const persistSnapshot = (snapshot: ExchangeRateSnapshot) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('[useExchangeRate] No se pudo almacenar la cache local:', error);
  }
};

const buildFallbackSnapshot = (previous?: ExchangeRateSnapshot | null): ExchangeRateSnapshot => ({
  compra: previous?.compra ?? FALLBACK_RATE.compra,
  venta: previous?.venta ?? FALLBACK_RATE.venta,
  fetchedAt: Date.now(),
  provider: 'fallback:manual',
  isFallback: true
});

export const useExchangeRate = (): UseExchangeRateResult => {
  const cached = useMemo(loadCachedSnapshot, []);

  const [state, setState] = useState<UseExchangeRateState>({
    data: cached,
    status: cached ? 'success' : 'idle',
    error: null
  });

  const controllerRef = useRef<AbortController | null>(null);

  const fetchWithRetry = useCallback(async (controller: AbortController, attempt = 1): Promise<ExchangeRateSnapshot> => {
    try {
      const response = await fetch(EXCHANGE_ENDPOINT, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const oficial = payload?.oficial;
      if (!oficial) {
        throw new Error('Respuesta inválida: falta la cotización oficial');
      }

      const snapshot: ExchangeRateSnapshot = {
        compra: Number(oficial.value_buy ?? oficial.value_avg ?? FALLBACK_RATE.compra),
        venta: Number(oficial.value_sell ?? oficial.value_avg ?? FALLBACK_RATE.venta),
        fetchedAt: Date.now(),
        provider: EXCHANGE_ENDPOINT
      };

      if (!Number.isFinite(snapshot.compra) || !Number.isFinite(snapshot.venta)) {
        throw new Error('Respuesta inválida: valores no numéricos');
      }

      return snapshot;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error;
      }

      if (attempt >= MAX_ATTEMPTS) {
        throw error as Error;
      }

      const delay = Math.min(2 ** attempt * 500, 8000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(controller, attempt + 1);
    }
  }, []);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) => ({
      data: prev.data,
      status: prev.data ? 'success' : 'loading',
      error: null
    }));

    try {
      const snapshot = await fetchWithRetry(controller);
      persistSnapshot(snapshot);
      setState({ data: snapshot, status: 'success', error: null });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      console.error('[useExchangeRate] Error obteniendo tipo de cambio:', error);
      setState((prev) => {
        if (prev.data) {
          return { data: prev.data, status: 'success', error: error as Error };
        }

        const fallback = buildFallbackSnapshot(prev.data);
        persistSnapshot(fallback);
        return { data: fallback, status: 'error', error: error as Error };
      });
    }
  }, [fetchWithRetry]);

  useEffect(() => {
    const needsRefresh = !state.data || Date.now() - state.data.fetchedAt > STALE_MS;
    if (needsRefresh) {
      void refresh();
    }
  }, [refresh, state.data]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, STALE_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  useEffect(() => () => {
    controllerRef.current?.abort();
  }, []);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    refresh
  };
};
