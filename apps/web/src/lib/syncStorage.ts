import { AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

const STORAGE_PREFIX = 'gridmanager-sync-cache:';
const MUTATION_QUEUE_KEY = 'gridmanager-sync-queue';

type MutationOperation = 'create' | 'update' | 'delete';

interface QueuedMutation {
  id: string;
  storageKey: string;
  operation: MutationOperation;
  payload: any;
  tempId?: string | number;
  timestamp: number;
}

const hasWindow = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getCacheKey = (storageKey: string) => `${STORAGE_PREFIX}${storageKey}`;

function readCache<T>(storageKey: string): T[] | null {
  if (!hasWindow) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(storageKey));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T[];
  } catch (error) {
    console.warn(`⚠️ Failed to read cache for ${storageKey}:`, error);
    return null;
  }
}

function writeCache<T>(storageKey: string, data: T[]): void {
  if (!hasWindow) {
    return;
  }

  try {
    window.localStorage.setItem(getCacheKey(storageKey), JSON.stringify(data));
  } catch (error) {
    console.warn(`⚠️ Failed to write cache for ${storageKey}:`, error);
  }
}

function upsertCacheItem<T extends { id?: string | number }>(storageKey: string, item: T): void {
  if (!hasWindow) {
    return;
  }

  const cache = readCache<T>(storageKey) ?? [];
  const itemId = item.id;

  if (itemId === undefined || itemId === null) {
    cache.unshift(item);
    writeCache(storageKey, cache);
    return;
  }

  const index = cache.findIndex((entry) => entry && typeof entry === 'object' && 'id' in entry && (entry as any).id === itemId);

  if (index >= 0) {
    cache[index] = { ...cache[index], ...item };
  } else {
    cache.unshift(item);
  }

  writeCache(storageKey, cache);
}

function removeCacheItem(storageKey: string, id: string | number): void {
  if (!hasWindow) {
    return;
  }

  const cache = readCache<any>(storageKey);
  if (!cache) {
    return;
  }

  const filtered = cache.filter((entry) => !(entry && typeof entry === 'object' && 'id' in entry && (entry as any).id === id));
  writeCache(storageKey, filtered);
}

const generateQueueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function readMutationQueue(): QueuedMutation[] {
  if (!hasWindow) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(MUTATION_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as QueuedMutation[];
  } catch (error) {
    console.warn('⚠️ Failed to read sync mutation queue:', error);
    return [];
  }
}

function writeMutationQueue(queue: QueuedMutation[]): void {
  if (!hasWindow) {
    return;
  }

  try {
    window.localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('⚠️ Failed to persist sync mutation queue:', error);
  }
}

function enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): void {
  const queue = readMutationQueue();
  queue.push({ ...mutation, id: generateQueueId(), timestamp: Date.now() });
  writeMutationQueue(queue);
}

/**
 * Data Sync Helper
 * Orquesta operaciones contra la API y proporciona utilidades mínimas de fallback en memoria.
 */
export interface SyncConfig<T> {
  storageKey: string;
  apiGet: () => Promise<AxiosResponse<any>>;
  apiCreate?: (data: T) => Promise<AxiosResponse<any>>;
  apiUpdate?: (id: string | number, data: Partial<T>) => Promise<AxiosResponse<any>>;
  apiDelete?: (id: string | number) => Promise<AxiosResponse<any>>;
  extractData?: (response: AxiosResponse<any>) => T[];
}

export async function flushQueuedMutations<T>(config: SyncConfig<T>): Promise<boolean> {
  if (!isAuthenticated()) {
    return false;
  }

  const queue = readMutationQueue();
  if (!queue.length) {
    return false;
  }

  let changed = false;
  const remaining: QueuedMutation[] = [];

  for (const mutation of queue) {
    if (mutation.storageKey !== config.storageKey) {
      remaining.push(mutation);
      continue;
    }

    try {
      switch (mutation.operation) {
        case 'create': {
          if (!config.apiCreate) {
            throw new Error('apiCreate not configured');
          }

          const response = await config.apiCreate(mutation.payload);
          let createdItem: any;

          if (config.extractData) {
            const items = config.extractData(response);
            createdItem = items?.[0];
          } else {
            createdItem = response.data?.data ?? response.data;
          }

          if (mutation.tempId !== undefined) {
            removeCacheItem(config.storageKey, mutation.tempId);
          }

          if (createdItem) {
            upsertCacheItem(config.storageKey, createdItem);
          }

          changed = true;
          break;
        }
        case 'update': {
          if (!config.apiUpdate) {
            throw new Error('apiUpdate not configured');
          }

          const { id, updates } = mutation.payload ?? {};
          if (id === undefined) {
            throw new Error('Missing id in queued update payload');
          }

          await config.apiUpdate(id, updates ?? {});

          const cache = readCache<T>(config.storageKey);
          if (cache) {
            const next = cache.map((item) =>
              item && typeof item === 'object' && 'id' in item && (item as any).id === id
                ? { ...item, ...(updates ?? {}) }
                : item
            );
            writeCache(config.storageKey, next as T[]);
          }

          changed = true;
          break;
        }
        case 'delete': {
          if (!config.apiDelete) {
            throw new Error('apiDelete not configured');
          }

          const { id } = mutation.payload ?? {};
          const targetId = id ?? mutation.tempId;
          if (targetId === undefined) {
            throw new Error('Missing id in queued delete payload');
          }

          await config.apiDelete(targetId);
          removeCacheItem(config.storageKey, targetId);
          changed = true;
          break;
        }
        default:
          console.warn('⚠️ Unhandled mutation operation:', mutation.operation);
          remaining.push(mutation);
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to flush ${mutation.operation} for ${config.storageKey}:`, error);
      remaining.push(mutation);
    }
  }

  writeMutationQueue(remaining);

  return changed;
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
  const offlineSnapshot = readCache<T>(config.storageKey);

  if (!isAuthenticated()) {
    if (offlineSnapshot) {
      return offlineSnapshot;
    }
    return defaultValue;
  }

  await flushQueuedMutations(config);

  try {
    const response = await config.apiGet();
    const data = config.extractData
      ? config.extractData(response)
      : response.data.data || response.data;

    if (Array.isArray(data)) {
      let mergedData = data as T[];

      if (offlineSnapshot && offlineSnapshot.length) {
        const offlineOnly = offlineSnapshot.filter((offlineItem: any) => {
          const offlineId = offlineItem && typeof offlineItem === 'object' ? (offlineItem as any).id : undefined;
          if (offlineId === undefined || offlineId === null) {
            return false;
          }

          return !mergedData.some((remoteItem: any) => {
            if (!remoteItem || typeof remoteItem !== 'object') {
              return false;
            }
            const remoteId = (remoteItem as any).id;
            return remoteId !== undefined && remoteId !== null && remoteId === offlineId;
          });
        });

        if (offlineOnly.length) {
          mergedData = [...offlineOnly, ...mergedData];
        }
      }

      writeCache(config.storageKey, mergedData);
      return mergedData;
    }

    console.warn(`⚠️ Unexpected response shape for ${config.storageKey}, returning default value`);
    return offlineSnapshot ?? defaultValue;
  } catch (error: any) {
    console.error(`❌ API error for ${config.storageKey}:`, error.message);
    return offlineSnapshot ?? defaultValue;
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

  const queueOfflineItem = (reason?: unknown): T => {
    const tempId = item.id ?? `offline-${Date.now()}`;
    const offlineItem = { ...item, id: tempId } as T;
    const apiPayload = { ...item };

    upsertCacheItem(config.storageKey, offlineItem);
    enqueueMutation({
      storageKey: config.storageKey,
      operation: 'create',
      payload: apiPayload,
      tempId,
    });

    if (reason) {
      console.warn(`⚠️ Falling back to offline create for ${config.storageKey}:`, reason);
    }

    return offlineItem;
  };

  if (!isAuthenticated()) {
    return queueOfflineItem();
  }

  await flushQueuedMutations(config);

  try {
    const response = await config.apiCreate(item);

    // Use extractData if available to properly transform the response
    if (config.extractData) {
      const items = config.extractData(response);
      if (items && items.length > 0) {
        const createdItem = items[0];
        upsertCacheItem(config.storageKey, createdItem);
        return createdItem;
      }
    }

    // Fallback to direct extraction
    const createdItem = response.data.data || response.data;

    if (!createdItem) {
      throw new Error(`Empty response when creating item in ${config.storageKey}`);
    }

    upsertCacheItem(config.storageKey, createdItem);

    return createdItem;
  } catch (error) {
    return queueOfflineItem(error);
  }
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

  if (!isAuthenticated()) {
    enqueueMutation({
      storageKey: config.storageKey,
      operation: 'update',
      payload: { id, updates },
    });

    const cache = readCache<T>(config.storageKey);
    if (cache) {
      const next = cache.map((item) =>
        item && typeof item === 'object' && 'id' in item && (item as any).id === id
          ? { ...item, ...updates }
          : item
      );
      writeCache(config.storageKey, next as T[]);
    }

    return;
  }

  await flushQueuedMutations(config);

  await config.apiUpdate(id, updates);

  const cache = readCache<T>(config.storageKey);
  if (cache) {
    const next = cache.map((item) =>
      item && typeof item === 'object' && 'id' in item && (item as any).id === id
        ? { ...item, ...updates }
        : item
    );
    writeCache(config.storageKey, next as T[]);
  }
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

  if (!isAuthenticated()) {
    enqueueMutation({
      storageKey: config.storageKey,
      operation: 'delete',
      payload: { id },
    });
    removeCacheItem(config.storageKey, id);
    return;
  }

  await flushQueuedMutations(config);

  await config.apiDelete(id);
  removeCacheItem(config.storageKey, id);
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
