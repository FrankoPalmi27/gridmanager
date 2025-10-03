/**
 * LocalStorage helpers were removed as part of the backend-only migration.
 * Importers should replace any dependency on this module with API-driven persistence.
 */
export function localStorageUnsupported(): never {
  throw new Error('localStorage helpers were removed. Use backend APIs instead.');
}