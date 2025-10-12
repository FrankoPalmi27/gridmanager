/**
 * Cross-Browser Synchronization System
 *
 * Permite sincronización de datos entre diferentes navegadores mediante:
 * 1. Detección de cambios en localStorage mediante polling
 * 2. Marcadores de timestamp para detectar actualizaciones
 * 3. Callbacks para notificar cambios a los stores
 *
 * Limitación: BroadcastChannel NO funciona entre navegadores diferentes
 * (Chrome ↔ Edge ↔ Firefox), solo entre pestañas del mismo navegador.
 */

const SYNC_MARKER_PREFIX = 'gridmanager-sync-marker:';
const POLL_INTERVAL = 2000; // Check every 2 seconds

interface SyncMarker {
  storeName: string;
  lastUpdate: number;
  operation: 'create' | 'update' | 'delete' | 'load';
  recordId?: string;
}

type SyncCallback = (marker: SyncMarker) => void;

class CrossBrowserSync {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastKnownTimestamps: Map<string, number> = new Map();
  private callbacks: Map<string, SyncCallback> = new Map();

  /**
   * Register a store for cross-browser synchronization
   */
  register(storeName: string, callback: SyncCallback): () => void {
    console.log(`[CrossBrowserSync] 🔄 Registering store: ${storeName}`);

    this.callbacks.set(storeName, callback);

    // Initialize last known timestamp
    const marker = this.readMarker(storeName);
    if (marker) {
      this.lastKnownTimestamps.set(storeName, marker.lastUpdate);
    }

    // Start polling for this store
    this.startPolling(storeName);

    // Return unregister function
    return () => this.unregister(storeName);
  }

  /**
   * Unregister a store from cross-browser synchronization
   */
  private unregister(storeName: string): void {
    console.log(`[CrossBrowserSync] ❌ Unregistering store: ${storeName}`);

    const interval = this.pollingIntervals.get(storeName);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(storeName);
    }

    this.callbacks.delete(storeName);
    this.lastKnownTimestamps.delete(storeName);
  }

  /**
   * Update the sync marker for a store
   */
  updateMarker(storeName: string, operation: SyncMarker['operation'], recordId?: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const marker: SyncMarker = {
      storeName,
      lastUpdate: Date.now(),
      operation,
      recordId,
    };

    const key = `${SYNC_MARKER_PREFIX}${storeName}`;

    try {
      window.localStorage.setItem(key, JSON.stringify(marker));
      console.log(`[CrossBrowserSync] ✅ Marker updated for ${storeName}:`, operation, recordId || '');
    } catch (error) {
      console.error(`[CrossBrowserSync] ❌ Failed to update marker for ${storeName}:`, error);
    }
  }

  /**
   * Read the sync marker for a store
   */
  private readMarker(storeName: string): SyncMarker | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const key = `${SYNC_MARKER_PREFIX}${storeName}`;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as SyncMarker;
    } catch (error) {
      console.error(`[CrossBrowserSync] ❌ Failed to read marker for ${storeName}:`, error);
      return null;
    }
  }

  /**
   * Start polling for changes to a store's marker
   */
  private startPolling(storeName: string): void {
    // Clear existing interval if any
    const existingInterval = this.pollingIntervals.get(storeName);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Create new polling interval
    const interval = setInterval(() => {
      this.checkForUpdates(storeName);
    }, POLL_INTERVAL);

    this.pollingIntervals.set(storeName, interval);
    console.log(`[CrossBrowserSync] ⏰ Started polling for ${storeName}`);
  }

  /**
   * Check if a store's marker has been updated
   */
  private checkForUpdates(storeName: string): void {
    const marker = this.readMarker(storeName);

    if (!marker) {
      return;
    }

    const lastKnown = this.lastKnownTimestamps.get(storeName) || 0;

    // If marker is newer than what we know, trigger callback
    if (marker.lastUpdate > lastKnown) {
      console.log(`[CrossBrowserSync] 🔔 Change detected in ${storeName}:`, marker.operation);

      // Update our timestamp
      this.lastKnownTimestamps.set(storeName, marker.lastUpdate);

      // Notify callback
      const callback = this.callbacks.get(storeName);
      if (callback) {
        callback(marker);
      }
    }
  }

  /**
   * Stop all polling
   */
  stopAll(): void {
    console.log('[CrossBrowserSync] 🛑 Stopping all polling');

    for (const [storeName, interval] of this.pollingIntervals.entries()) {
      clearInterval(interval);
      console.log(`[CrossBrowserSync] ⏸️ Stopped polling for ${storeName}`);
    }

    this.pollingIntervals.clear();
    this.callbacks.clear();
    this.lastKnownTimestamps.clear();
  }
}

// Singleton instance
export const crossBrowserSync = new CrossBrowserSync();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    crossBrowserSync.stopAll();
  });
}
