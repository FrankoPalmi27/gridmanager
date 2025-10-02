import { AxiosResponse } from 'axios';
import { loadFromStorage, saveToStorage } from './localStorage';

/**
 * Hybrid Storage Sync Helper
 * Combina API con localStorage como caché para funcionar offline/online
 */

export interface SyncConfig<T> {
  storageKey: string;
  apiGet: () => Promise<AxiosResponse<any>>;
  apiCreate?: (data: T) => Promise<AxiosResponse<any>>;
  apiUpdate?: (id: string, data: T) => Promise<AxiosResponse<any>>;
  apiDelete?: (id: string) => Promise<AxiosResponse<any>>;
  extractData?: (response: AxiosResponse<any>) => T[];
}

/**
 * Load data with hybrid approach:
 * 1. Try to fetch from API
 * 2. If successful, update localStorage and return API data
 * 3. If fails (offline/error), return localStorage cache
 */
export async function loadWithSync<T>(
  config: SyncConfig<T>,
  defaultValue: T[] = []
): Promise<T[]> {
  try {
    // Try to fetch from API
    const response = await config.apiGet();
    const data = config.extractData
      ? config.extractData(response)
      : response.data.data || response.data;

    // Update localStorage cache
    saveToStorage(config.storageKey, data);

    console.log(`✅ Loaded ${config.storageKey} from API`);
    return data;
  } catch (error: any) {
    console.warn(`⚠️ API error for ${config.storageKey}, using localStorage cache:`, error.message);

    // Fallback to localStorage cache
    const cachedData = loadFromStorage(config.storageKey, defaultValue);
    return cachedData;
  }
}

/**
 * Save data with hybrid approach:
 * 1. Update localStorage immediately (optimistic update)
 * 2. Try to sync with API in background
 * 3. If API fails, keep localStorage and queue for retry
 */
export async function saveWithSync<T>(
  config: SyncConfig<T>,
  data: T[],
  options?: {
    skipApi?: boolean; // Skip API call (useful for bulk operations)
  }
): Promise<void> {
  // Always update localStorage first (optimistic)
  saveToStorage(config.storageKey, data);

  if (options?.skipApi) {
    return;
  }

  // Try to sync with API in background
  // Note: Individual create/update/delete operations should be called separately
  // This is just for full sync scenarios
}

/**
 * Create item with hybrid approach
 */
export async function createWithSync<T extends { id?: string }>(
  config: SyncConfig<T>,
  item: T,
  currentData: T[]
): Promise<T> {
  if (!config.apiCreate) {
    throw new Error('apiCreate not configured');
  }

  try {
    // Try to create in API
    const response = await config.apiCreate(item);
    const createdItem = response.data.data || response.data;

    // Update localStorage with server response
    const updatedData = [createdItem, ...currentData];
    saveToStorage(config.storageKey, updatedData);

    console.log(`✅ Created item in ${config.storageKey} via API`);
    return createdItem;
  } catch (error: any) {
    console.warn(`⚠️ API create failed for ${config.storageKey}, saving to localStorage only:`, error.message);

    // Fallback: save to localStorage only
    const localItem = { ...item, id: item.id || Date.now().toString() };
    const updatedData = [localItem, ...currentData];
    saveToStorage(config.storageKey, updatedData);

    // TODO: Queue for retry when connection is restored
    return localItem as T;
  }
}

/**
 * Update item with hybrid approach
 */
export async function updateWithSync<T extends { id: string }>(
  config: SyncConfig<T>,
  id: string,
  updates: Partial<T>,
  currentData: T[]
): Promise<void> {
  if (!config.apiUpdate) {
    throw new Error('apiUpdate not configured');
  }

  try {
    // Try to update in API
    await config.apiUpdate(id, updates as T);

    // Update localStorage
    const updatedData = currentData.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveToStorage(config.storageKey, updatedData);

    console.log(`✅ Updated item in ${config.storageKey} via API`);
  } catch (error: any) {
    console.warn(`⚠️ API update failed for ${config.storageKey}, saving to localStorage only:`, error.message);

    // Fallback: update localStorage only
    const updatedData = currentData.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveToStorage(config.storageKey, updatedData);

    // TODO: Queue for retry when connection is restored
  }
}

/**
 * Delete item with hybrid approach
 */
export async function deleteWithSync<T extends { id: string }>(
  config: SyncConfig<T>,
  id: string,
  currentData: T[]
): Promise<void> {
  if (!config.apiDelete) {
    throw new Error('apiDelete not configured');
  }

  try {
    // Try to delete from API
    await config.apiDelete(id);

    // Update localStorage
    const updatedData = currentData.filter((item) => item.id !== id);
    saveToStorage(config.storageKey, updatedData);

    console.log(`✅ Deleted item from ${config.storageKey} via API`);
  } catch (error: any) {
    console.warn(`⚠️ API delete failed for ${config.storageKey}, removing from localStorage only:`, error.message);

    // Fallback: delete from localStorage only
    const updatedData = currentData.filter((item) => item.id !== id);
    saveToStorage(config.storageKey, updatedData);

    // TODO: Queue for retry when connection is restored
  }
}

/**
 * Check if user is authenticated (has valid tokens)
 * Excludes mock tokens to prevent API calls with invalid auth
 */
export function isAuthenticated(): boolean {
  try {
    const authData = localStorage.getItem('grid-manager-auth');
    if (!authData) return false;

    const parsed = JSON.parse(authData);
    const token = parsed.state?.tokens?.accessToken;

    // Exclude mock tokens - they won't work with real backend
    if (!token || token === 'mock-access-token') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get sync mode (online with auth, or offline)
 * Returns 'offline' for mock tokens to use localStorage only
 */
export function getSyncMode(): 'online' | 'offline' {
  return isAuthenticated() ? 'online' : 'offline';
}
