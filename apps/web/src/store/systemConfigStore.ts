import { create } from 'zustand';

// Configuraciones del sistema
export interface SystemConfig {
  allowNegativeStock: boolean;
  stockWarningThreshold: number; // Porcentaje del minStock para mostrar warnings
  defaultCurrency: string;
  dateFormat: string;
  autoBackup: boolean;
  enableAuditLog: boolean;
  maxStockAlerts: number;
  debugMode: boolean;
}

// Configuración por defecto del sistema
const defaultSystemConfig: SystemConfig = {
  allowNegativeStock: false, // 🚨 CRITICO: Por defecto NO permitir stock negativo
  stockWarningThreshold: 120, // Mostrar warning cuando stock <= minStock * 1.2
  defaultCurrency: 'ARS',
  dateFormat: 'DD/MM/YYYY',
  autoBackup: true,
  enableAuditLog: true,
  maxStockAlerts: 50,
  debugMode: false,
};

interface SystemConfigStore {
  config: SystemConfig;
  updateConfig: (updates: Partial<SystemConfig>) => void;
  resetConfig: () => void;
  toggleNegativeStock: () => void;
  isNegativeStockAllowed: () => boolean;
  getStockWarningThreshold: () => number;
}

export const useSystemConfigStore = create<SystemConfigStore>((set, get) => ({
  config: defaultSystemConfig,

  updateConfig: (updates) => {
    set((state) => {
      const newConfig = { ...state.config, ...updates };
      // Log para auditoría
      if (state.config.enableAuditLog) {
        console.log('System config updated:', {
          changes: updates,
          timestamp: new Date().toISOString(),
          previousConfig: state.config,
          newConfig
        });
      }

      return { config: newConfig };
    });
  },

  resetConfig: () => {
    set({ config: defaultSystemConfig });
    console.log('System config reset to defaults');
  },

  toggleNegativeStock: () => {
    const currentConfig = get().config;
    const newValue = !currentConfig.allowNegativeStock;

    get().updateConfig({ allowNegativeStock: newValue });

    console.log(`Negative stock ${newValue ? 'ENABLED' : 'DISABLED'}`, {
      timestamp: new Date().toISOString(),
      previousValue: currentConfig.allowNegativeStock,
      newValue
    });
  },

  isNegativeStockAllowed: () => {
    return get().config.allowNegativeStock;
  },

  getStockWarningThreshold: () => {
    return get().config.stockWarningThreshold;
  },
}));

// Helper functions para fácil acceso desde otros módulos
export const isNegativeStockAllowed = () => {
  return useSystemConfigStore.getState().isNegativeStockAllowed();
};

export const getSystemConfig = () => {
  return useSystemConfigStore.getState().config;
};

export const toggleNegativeStock = () => {
  return useSystemConfigStore.getState().toggleNegativeStock();
};