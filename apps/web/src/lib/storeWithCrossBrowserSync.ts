/**
 * Store Wrapper with Cross-Browser Synchronization
 *
 * Provides a convenient wrapper for Zustand stores to automatically
 * enable cross-browser synchronization via localStorage polling.
 */

import { crossBrowserSync } from './crossBrowserSync';

interface SyncOperations {
  load: () => Promise<void>;
}

/**
 * Setup cross-browser synchronization for a store
 *
 * @param storeName - Name of the store (e.g., 'accounts', 'products')
 * @param operations - Object with reload operation
 * @returns Cleanup function
 */
export function setupCrossBrowserSync(
  storeName: string,
  operations: SyncOperations
): () => void {
  console.log(`[CrossBrowserSync] Setting up for store: ${storeName}`);

  return crossBrowserSync.register(storeName, (marker) => {
    console.log(`[${storeName}] 🌐 Cross-browser change detected:`, marker.operation);
    void operations.load();
  });
}

/**
 * Notify other browsers of a change in a store
 *
 * @param storeName - Name of the store
 * @param operation - Type of operation performed
 * @param recordId - Optional ID of the affected record
 */
export function notifyCrossBrowserChange(
  storeName: string,
  operation: 'create' | 'update' | 'delete' | 'load',
  recordId?: string
): void {
  crossBrowserSync.updateMarker(storeName, operation, recordId);
}
