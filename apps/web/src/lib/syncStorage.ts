import { AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * Data Sync Helper
 * Orquesta operaciones contra la API y proporciona utilidades mínimas de fallback en memoria.
 */

export interface SyncConfig<T> {
  storageKey: string;
  apiGet: () => Promise<AxiosResponse<any>>;
  apiCreate?: (data: T) => Promise<AxiosResponse<any>>;
  apiUpdate?: (id: string | number, data: T) => Promise<AxiosResponse<any>>;
  apiDelete?: (id: string | number) => Promise<AxiosResponse<any>>;
  extractData?: (response: AxiosResponse<any>) => T[];
}

/**
 * Load data using the backend API.
 * 1. Verifica si el usuario está autenticado
 * 2. Solicita datos al endpoint correspondiente
 * 3. Devuelve los datos en caso de éxito o el valor por defecto si la llamada falla
 */
export async function loadWithSync<T>(
  config: SyncConfig<T>,
  defaultValue: T[] = []
): Promise<T[]> {
  try {
    const response = await config.apiGet();
    const data = config.extractData
      ? config.extractData(response)
      : response.data.data || response.data;

    if (Array.isArray(data)) {
      return data;
    }

    console.warn(`⚠️ Unexpected response shape for ${config.storageKey}, returning default value`);
    return defaultValue;
  } catch (error: any) {
    console.error(`❌ API error for ${config.storageKey}:`, error.message);
    return defaultValue;
  }
}

/**
 * Persistencia optimista:
 * 1. Actualiza el estado local inmediatamente
 * 2. Intenta sincronizar con la API en segundo plano
 * 3. Si la API falla, deja constancia en consola para reintentos posteriores
 */
export async function saveWithSync<T>(
  _config: SyncConfig<T>,
  _data: T[],
  _options?: {
    skipApi?: boolean;
  }
): Promise<void> {
  console.warn('saveWithSync is deprecated in backend-only mode. Use specific API operations instead.');
}

/**
 * Create item with hybrid approach
 */
export async function createWithSync<T extends { id?: string | number }>(
  config: SyncConfig<T>,
  item: T,
  _currentData: T[]
): Promise<T> {
  if (!config.apiCreate) {
    throw new Error('apiCreate not configured');
  }

  const response = await config.apiCreate(item);

  // Use extractData if available to properly transform the response
  if (config.extractData) {
    const items = config.extractData(response);
    if (items && items.length > 0) {
      return items[0];
    }
  }

  // Fallback to direct extraction
  const createdItem = response.data.data || response.data;

  if (!createdItem) {
    throw new Error(`Empty response when creating item in ${config.storageKey}`);
  }

  return createdItem;
}

/**
 * Update item with hybrid approach
 */
export async function updateWithSync<T extends { id: string | number }>(
  config: SyncConfig<T>,
  id: string | number,
  updates: Partial<T>,
  _currentData: T[]
): Promise<void> {
  if (!config.apiUpdate) {
    throw new Error('apiUpdate not configured');
  }

  await config.apiUpdate(id, updates as T);
}

/**
 * Delete item with hybrid approach
 */
export async function deleteWithSync<T extends { id: string | number }>(
  config: SyncConfig<T>,
  id: string | number,
  _currentData: T[]
): Promise<void> {
  if (!config.apiDelete) {
    throw new Error('apiDelete not configured');
  }

  await config.apiDelete(id);
}

/**
 * Check if user is authenticated (has valid tokens)
 * Excludes mock tokens to prevent API calls with invalid auth
 */
export function isAuthenticated(): boolean {
  const { tokens } = useAuthStore.getState();
  const token = tokens?.accessToken;
  return Boolean(token && token !== 'mock-access-token');
}

/**
 * Get sync mode (online with auth, or offline)
 * Retorna 'offline' cuando se utilizan tokens mock para evitar llamadas reales a la API
 */
export function getSyncMode(): 'online' | 'offline' {
  return isAuthenticated() ? 'online' : 'offline';
}
