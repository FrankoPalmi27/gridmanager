/**
 * SISTEMA DE LIMPIEZA AUTOMÁTICA DE DATOS LEGACY
 *
 * A partir de la migración a persistencia 100% en backend, los datos mock ya no se almacenan
 * en el navegador. Este módulo se mantiene para compatibilidad, pero actúa como un no-op.
 */

export interface CleanupResult {
  cleaned: boolean;
  itemsRemoved: number;
  keysAffected: string[];
  details: Record<string, any>;
}

export class DataCleanup {
  async runCleanup(): Promise<CleanupResult> {
    console.log('🧹 DataCleanup: Persistencia migrada a backend, no hay datos locales que limpiar.');

    return {
      cleaned: false,
      itemsRemoved: 0,
      keysAffected: [],
      details: {
        note: 'LocalStorage cleanup no longer required — data lives in Supabase/Railway.'
      }
    };
  }
}

export const runAutoCleanup = async (): Promise<CleanupResult> => {
  const cleanup = new DataCleanup();
  return cleanup.runCleanup();
};

export const hasLegacyData = (): boolean => {
  console.log('🔍 hasLegacyData: Local data deprecated; returning false.');
  return false;
};