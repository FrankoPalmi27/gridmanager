import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { systemConfigApi } from '@/lib/api';

export interface SystemConfig {
  allowNegativeStock: boolean;
  stockWarningThreshold: number;
  defaultCurrency: string;
  dateFormat: string;
  autoBackup: boolean;
  enableAuditLog: boolean;
  maxStockAlerts: number;
  debugMode: boolean;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  allowNegativeStock: false,
  stockWarningThreshold: 120,
  defaultCurrency: 'ARS',
  dateFormat: 'DD/MM/YYYY',
  autoBackup: true,
  enableAuditLog: true,
  maxStockAlerts: 50,
  debugMode: false,
};

interface SystemConfigStore {
  config: SystemConfig;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  loadConfig: () => Promise<SystemConfig>;
  updateConfig: (updates: Partial<SystemConfig>) => Promise<SystemConfig>;
  resetConfig: () => Promise<SystemConfig>;
  toggleNegativeStock: () => void;
  isNegativeStockAllowed: () => boolean;
  getStockWarningThreshold: () => number;
}

const normalizeConfig = (incoming: unknown): SystemConfig => {
  if (!incoming || typeof incoming !== 'object') {
    return { ...DEFAULT_SYSTEM_CONFIG };
  }

  const raw = incoming as Partial<SystemConfig>;
  return {
    allowNegativeStock: typeof raw.allowNegativeStock === 'boolean'
      ? raw.allowNegativeStock
      : DEFAULT_SYSTEM_CONFIG.allowNegativeStock,
    stockWarningThreshold: typeof raw.stockWarningThreshold === 'number'
      ? raw.stockWarningThreshold
      : DEFAULT_SYSTEM_CONFIG.stockWarningThreshold,
    defaultCurrency: typeof raw.defaultCurrency === 'string' && raw.defaultCurrency.trim().length > 0
      ? raw.defaultCurrency
      : DEFAULT_SYSTEM_CONFIG.defaultCurrency,
    dateFormat: typeof raw.dateFormat === 'string' && raw.dateFormat.trim().length > 0
      ? raw.dateFormat
      : DEFAULT_SYSTEM_CONFIG.dateFormat,
    autoBackup: typeof raw.autoBackup === 'boolean'
      ? raw.autoBackup
      : DEFAULT_SYSTEM_CONFIG.autoBackup,
    enableAuditLog: typeof raw.enableAuditLog === 'boolean'
      ? raw.enableAuditLog
      : DEFAULT_SYSTEM_CONFIG.enableAuditLog,
    maxStockAlerts: typeof raw.maxStockAlerts === 'number'
      ? raw.maxStockAlerts
      : DEFAULT_SYSTEM_CONFIG.maxStockAlerts,
    debugMode: typeof raw.debugMode === 'boolean'
      ? raw.debugMode
      : DEFAULT_SYSTEM_CONFIG.debugMode,
  };
};

export const useSystemConfigStore = create<SystemConfigStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_SYSTEM_CONFIG,
      isLoading: false,
      error: null,
      hasLoaded: false,

      loadConfig: async () => {
        if (get().isLoading) {
          return get().config;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await systemConfigApi.get();
          const payload = response.data?.data ?? response.data;
          const config = normalizeConfig(payload);

          set({ config, isLoading: false, hasLoaded: true });
          return config;
        } catch (error: any) {
          const message = error?.response?.data?.error || 'Error al cargar configuración del sistema';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      updateConfig: async (updates) => {
        set({ isLoading: true, error: null });

        try {
          const response = await systemConfigApi.update(updates);
          const payload = response.data?.data ?? response.data;
          const config = normalizeConfig(payload);

          set({ config, isLoading: false, hasLoaded: true });
          return config;
        } catch (error: any) {
          const message = error?.response?.data?.error || 'Error al actualizar configuración del sistema';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      resetConfig: async () => {
        return get().updateConfig(DEFAULT_SYSTEM_CONFIG);
      },

      toggleNegativeStock: () => {
        const current = get().config.allowNegativeStock;
        void get()
          .updateConfig({ allowNegativeStock: !current })
          .catch((error) => {
            console.error('[SystemConfigStore] No se pudo actualizar allowNegativeStock', error);
          });
      },

      isNegativeStockAllowed: () => {
        return get().config.allowNegativeStock;
      },

      getStockWarningThreshold: () => {
        return get().config.stockWarningThreshold;
      },
    }),
    {
      name: 'grid-manager:system-config',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
      partialize: (state) => ({
        config: state.config,
        hasLoaded: state.hasLoaded,
      }),
    }
  )
);

export const isNegativeStockAllowed = () => {
  return useSystemConfigStore.getState().isNegativeStockAllowed();
};

export const getSystemConfig = () => {
  return useSystemConfigStore.getState().config;
};

export const toggleNegativeStock = () => {
  return useSystemConfigStore.getState().toggleNegativeStock();
};