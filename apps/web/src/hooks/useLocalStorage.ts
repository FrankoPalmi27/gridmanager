/**
 * Deprecated placeholder for the removed localStorage hook.
 * Importers should replace it with backend persistence flows.
 */
export function useLocalStorage(): never {
  throw new Error('useLocalStorage hook was removed. Persist data using backend APIs.');
}