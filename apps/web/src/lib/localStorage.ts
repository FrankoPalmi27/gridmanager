/**
 * Centralized localStorage utilities
 * Used across all stores to prevent code duplication
 */

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

export const clearAllStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Grid Manager specific storage keys
export const STORAGE_KEYS = {
  CUSTOMERS: 'gridmanager_customers',
  PRODUCTS: 'gridmanager_products',
  CATEGORIES: 'gridmanager_categories',
  STOCK_MOVEMENTS: 'gridmanager_stock_movements',
  SALES: 'gridmanager_sales',
  ACCOUNTS: 'gridmanager_accounts',
  TRANSACTIONS: 'gridmanager_transactions',
  SUPPLIERS: 'gridmanager_suppliers',
  PURCHASES: 'gridmanager_purchases',
  PURCHASE_STATS: 'gridmanager_purchase_stats',
  AUTH: 'gridmanager_auth',
  DASHBOARD_STATS: 'gridmanager_dashboard_stats',
  SYSTEM_CONFIG: 'gridmanager_system_config',
} as const;